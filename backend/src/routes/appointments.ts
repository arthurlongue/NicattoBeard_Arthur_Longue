import { Router } from "express"
import { z } from "zod"
import { authenticate } from "../lib/auth.js"
import { query } from "../lib/db.js"
import { ApiError } from "../lib/errors.js"
import { toSaoPauloISO } from "../lib/slots.js"
import { validate } from "../lib/validate.js"

// --- Schemas ---

const createSchema = z.object({
	barberId: z.number().int().positive("barberId obrigatório"),
	specialtyId: z.number().int().positive("specialtyId obrigatório"),
	startAt: z
		.string()
		.datetime({ offset: true, message: "Data/hora inválida (ISO 8601 com offset)" })
		.refine((val) => {
			const d = new Date(val)
			return d.getSeconds() === 0 && d.getMilliseconds() === 0
		}, "Segundos e milissegundos devem ser zero"),
})

const cancelSchema = z.object({
	reason: z.string().max(500).optional(),
})

const paramsSchema = z.object({
	appointmentId: z.coerce.number().int().positive(),
})

// --- Helpers ---

const TZ = "America/Sao_Paulo"

function getLocalHourMinute(date: Date): { hour: number; minute: number } {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		hour: "numeric",
		minute: "numeric",
		hour12: false,
	}).formatToParts(date)

	const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
	const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
	return { hour, minute }
}

// --- Router ---

export const appointmentsRouter = Router()

// POST /api/appointments (auth required)
appointmentsRouter.post(
	"/",
	authenticate,
	validate(createSchema, "body"),
	async (req, res, next) => {
		try {
			const { barberId, specialtyId, startAt: startAtStr } = req.body as {
				barberId: number
				specialtyId: number
				startAt: string
			}
			const customerId = req.user!.id

			const startAt = new Date(startAtStr)
			const endAt = new Date(startAt.getTime() + 30 * 60 * 1000)

			// Prevent past bookings
			if (startAt <= new Date()) {
				next(ApiError.validation("Não é possível agendar no passado"))
				return
			}

			// Validate business hours (08:00–17:30 in SP)
			const { hour, minute } = getLocalHourMinute(startAt)

			if (hour < 8 || hour >= 18 || (hour === 17 && minute > 30)) {
				next(ApiError.validation("Horário fora da faixa operacional 08:00–18:00"))
				return
			}

			// Validate 30-min slot boundaries
			if (minute !== 0 && minute !== 30) {
				next(ApiError.validation("Horário deve iniciar em intervalos de 30 minutos"))
				return
			}

			// Verify barber has the specialty and both are active
			const specCheck = await query(
				`SELECT 1 FROM barber_specialties bs
				 JOIN barbers b ON b.id = bs.barber_id
				 JOIN specialties s ON s.id = bs.specialty_id
				 WHERE bs.barber_id = $1 AND bs.specialty_id = $2
				 AND b.active = true AND s.active = true`,
				[barberId, specialtyId],
			)
			if (specCheck.rows.length === 0) {
				next(ApiError.validation("Barbeiro não atende essa especialidade ou recurso inativo"))
				return
			}

			// Insert appointment
			const { rows } = await query<{
				id: number
				status: string
				start_at: Date
				end_at: Date
				customer_id: number
				barber_id: number
				specialty_id: number
			}>(
				`INSERT INTO appointments (customer_id, barber_id, specialty_id, status, start_at, end_at)
				 VALUES ($1, $2, $3, 'scheduled', $4, $5)
				 RETURNING id, status, start_at, end_at, customer_id, barber_id, specialty_id`,
				[customerId, barberId, specialtyId, startAt, endAt],
			)

			const apt = rows[0]
			res.status(201).json({
				id: apt.id,
				status: apt.status,
				startAt: toSaoPauloISO(apt.start_at),
				endAt: toSaoPauloISO(apt.end_at),
				customerId: apt.customer_id,
				barberId: apt.barber_id,
				specialtyId: apt.specialty_id,
			})
		} catch (err: unknown) {
			if (
				err instanceof Error &&
				"code" in err &&
				(err as { code: string }).code === "23505"
			) {
				next(
					ApiError.conflict("Este horário já está ocupado para o barbeiro selecionado", {
						barberId: req.body.barberId,
						startAt: req.body.startAt,
					}),
				)
				return
			}
			next(err)
		}
	},
)

// GET /api/appointments (auth required — customer's own)
appointmentsRouter.get("/", authenticate, async (req, res, next) => {
	try {
		const customerId = req.user!.id

		const { rows } = await query<{
			id: number
			status: string
			start_at: Date
			end_at: Date
			specialty_id: number
			specialty_name: string
			barber_id: number
			barber_name: string
		}>(
			`SELECT a.id, a.status, a.start_at, a.end_at,
			        s.id AS specialty_id, s.name AS specialty_name,
			        b.id AS barber_id, b.name AS barber_name
			 FROM appointments a
			 JOIN specialties s ON s.id = a.specialty_id
			 JOIN barbers b ON b.id = a.barber_id
			 WHERE a.customer_id = $1
			 ORDER BY a.start_at DESC`,
			[customerId],
		)

		res.json(
			rows.map((r) => ({
				id: r.id,
				status: r.status,
				startAt: toSaoPauloISO(r.start_at),
				endAt: toSaoPauloISO(r.end_at),
				specialty: { id: r.specialty_id, name: r.specialty_name },
				barber: { id: r.barber_id, name: r.barber_name },
			})),
		)
	} catch (err) {
		next(err)
	}
})

// PATCH /api/appointments/:appointmentId/cancel (auth required)
appointmentsRouter.patch(
	"/:appointmentId/cancel",
	authenticate,
	validate(paramsSchema, "params"),
	validate(cancelSchema, "body"),
	async (req, res, next) => {
		try {
			const { appointmentId } = res.locals.params as { appointmentId: number }
			const { reason } = req.body as { reason?: string }
			const customerId = req.user!.id

			const { rows } = await query<{
				id: number
				customer_id: number
				status: string
				start_at: Date
			}>("SELECT id, customer_id, status, start_at FROM appointments WHERE id = $1", [
				appointmentId,
			])

			if (rows.length === 0) {
				next(ApiError.notFound("Agendamento não encontrado"))
				return
			}

			const apt = rows[0]

			if (apt.customer_id !== customerId) {
				next(ApiError.forbidden("Agendamento não pertence ao usuário"))
				return
			}

			if (apt.status !== "scheduled") {
				next(ApiError.conflict("Agendamento já está cancelado"))
				return
			}

			const msUntilStart = apt.start_at.getTime() - Date.now()
			const twoHoursMs = 2 * 60 * 60 * 1000

			if (msUntilStart < twoHoursMs) {
				next(
					ApiError.conflict(
						"Cancelamento permitido com no mínimo 2 horas de antecedência",
					),
				)
				return
			}

			const updated = await query<{
				id: number
				status: string
				cancelled_at: Date
				cancellation_reason: string | null
			}>(
				`UPDATE appointments
				 SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $2
				 WHERE id = $1
				 RETURNING id, status, cancelled_at, cancellation_reason`,
				[appointmentId, reason ?? null],
			)

			const result = updated.rows[0]
			res.json({
				id: result.id,
				status: result.status,
				cancelledAt: toSaoPauloISO(result.cancelled_at),
				cancellationReason: result.cancellation_reason,
			})
		} catch (err) {
			next(err)
		}
	},
)
