import { Router } from "express"
import { z } from "zod"
import { authenticate, authorize } from "../lib/auth.js"
import { pool, query } from "../lib/db.js"
import { ApiError } from "../lib/errors.js"
import { generateAvailableSlots, startOfDaySP, endOfDaySP } from "../lib/slots.js"
import { validate } from "../lib/validate.js"

// --- Schemas ---

const createSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
	age: z.number().int().min(18, "Idade mínima: 18").max(100, "Idade máxima: 100"),
	hireDate: z.string().date("Data de contratação inválida (YYYY-MM-DD)"),
	specialtyIds: z
		.array(z.number().int().positive())
		.min(1, "Ao menos uma especialidade é obrigatória"),
})

const updateSchema = z
	.object({
		name: z.string().min(2).max(120).optional(),
		age: z.number().int().min(18).max(100).optional(),
		active: z.boolean().optional(),
	})
	.refine((obj) => Object.keys(obj).length > 0, "Ao menos um campo é obrigatório")

const replaceSpecialtiesSchema = z.object({
	specialtyIds: z
		.array(z.number().int().positive())
		.min(1, "Ao menos uma especialidade é obrigatória"),
})

const paramsSchema = z.object({
	barberId: z.coerce.number().int().positive(),
})

const listQuerySchema = z.object({
	specialtyId: z.coerce.number().int().positive().optional(),
})

const availabilityQuerySchema = z.object({
	date: z.string().date("Data inválida (YYYY-MM-DD)"),
	specialtyId: z.coerce.number().int().positive("specialtyId obrigatório"),
})

// --- Helpers ---

interface BarberRow {
	id: number
	name: string
	age: number
	hire_date: string
	specialty_id: number | null
	specialty_name: string | null
}

function groupBarberRows(rows: BarberRow[]) {
	const map = new Map<
		number,
		{
			id: number
			name: string
			age: number
			hireDate: string
			specialties: { id: number; name: string }[]
		}
	>()

	for (const row of rows) {
		if (!map.has(row.id)) {
			map.set(row.id, {
				id: row.id,
				name: row.name,
				age: row.age,
				hireDate: row.hire_date,
				specialties: [],
			})
		}
		if (row.specialty_id && row.specialty_name) {
			map.get(row.id)!.specialties.push({ id: row.specialty_id, name: row.specialty_name })
		}
	}

	return [...map.values()]
}

async function fetchBarberWithSpecialties(barberId: number) {
	const { rows } = await query<BarberRow>(
		`SELECT b.id, b.name, b.age, b.hire_date, s.id AS specialty_id, s.name AS specialty_name
		 FROM barbers b
		 LEFT JOIN barber_specialties bs ON bs.barber_id = b.id
		 LEFT JOIN specialties s ON s.id = bs.specialty_id
		 WHERE b.id = $1`,
		[barberId],
	)
	const result = groupBarberRows(rows)
	return result[0] ?? null
}

// --- Router ---

export const barbersRouter = Router()

// GET /api/barbers (público)
barbersRouter.get("/", validate(listQuerySchema, "query"), async (_req, res, next) => {
	try {
		const { specialtyId } = res.locals.query as { specialtyId?: number }

		let sql = `
			SELECT b.id, b.name, b.age, b.hire_date, s.id AS specialty_id, s.name AS specialty_name
			FROM barbers b
			LEFT JOIN barber_specialties bs ON bs.barber_id = b.id
			LEFT JOIN specialties s ON s.id = bs.specialty_id AND s.active = true
			WHERE b.active = true
		`
		const params: unknown[] = []

		if (specialtyId) {
			sql += ` AND b.id IN (SELECT bs2.barber_id FROM barber_specialties bs2 JOIN specialties s2 ON s2.id = bs2.specialty_id WHERE bs2.specialty_id = $1 AND s2.active = true)`
			params.push(specialtyId)
		}

		sql += " ORDER BY b.name, s.name"

		const { rows } = await query<BarberRow>(sql, params)
		res.json(groupBarberRows(rows))
	} catch (err) {
		next(err)
	}
})

// POST /api/barbers (admin)
barbersRouter.post(
	"/",
	authenticate,
	authorize("admin"),
	validate(createSchema, "body"),
	async (req, res, next) => {
		const client = await pool.connect()
		try {
			const { name, age, hireDate, specialtyIds } = req.body as {
				name: string
				age: number
				hireDate: string
				specialtyIds: number[]
			}

			// Validate hireDate not in the future
			if (new Date(hireDate) > new Date()) {
				next(ApiError.validation("Data de contratação não pode ser futura", { hireDate: ["Data futura não permitida"] }))
				return
			}

			// Deduplicate specialtyIds before verifying
			const uniqueSpecIds = [...new Set(specialtyIds)]
			const specCheck = await client.query(
				"SELECT id FROM specialties WHERE id = ANY($1) AND active = true",
				[uniqueSpecIds],
			)
			if (specCheck.rows.length !== uniqueSpecIds.length) {
				next(ApiError.validation("Uma ou mais especialidades não existem ou estão inativas", { specialtyIds: ["ID inválido ou inativo"] }))
				return
			}

			await client.query("BEGIN")

			const barberResult = await client.query(
				"INSERT INTO barbers (name, age, hire_date) VALUES ($1, $2, $3) RETURNING id",
				[name, age, hireDate],
			)
			const barberId = barberResult.rows[0].id

			// Bulk insert specialties
			if (uniqueSpecIds.length > 0) {
				const values = uniqueSpecIds.map((_, i) => `($1, $${i + 2})`).join(", ")
				await client.query(
					`INSERT INTO barber_specialties (barber_id, specialty_id) VALUES ${values}`,
					[barberId, ...uniqueSpecIds],
				)
			}

			await client.query("COMMIT")

			// Fetch complete barber with specialties
			const barber = await fetchBarberWithSpecialties(barberId)
			res.status(201).json(barber)
		} catch (err) {
			await client.query("ROLLBACK").catch(() => {})
			next(err)
		} finally {
			client.release()
		}
	},
)

// PATCH /api/barbers/:barberId (admin)
barbersRouter.patch(
	"/:barberId",
	authenticate,
	authorize("admin"),
	validate(paramsSchema, "params"),
	validate(updateSchema, "body"),
	async (req, res, next) => {
		try {
			const { barberId } = res.locals.params as { barberId: number }
			const body = req.body as { name?: string; age?: number; active?: boolean }

			const existing = await query("SELECT id FROM barbers WHERE id = $1", [barberId])
			if (existing.rows.length === 0) {
				next(ApiError.notFound("Barbeiro não encontrado"))
				return
			}

			const sets: string[] = []
			const values: unknown[] = []
			let i = 1

			if (body.name !== undefined) {
				sets.push(`name = $${i++}`)
				values.push(body.name)
			}
			if (body.age !== undefined) {
				sets.push(`age = $${i++}`)
				values.push(body.age)
			}
			if (body.active !== undefined) {
				sets.push(`active = $${i++}`)
				values.push(body.active)
			}

			values.push(barberId)
			await query(`UPDATE barbers SET ${sets.join(", ")} WHERE id = $${i}`, values)

			const barber = await fetchBarberWithSpecialties(barberId)
			res.json(barber)
		} catch (err) {
			next(err)
		}
	},
)

// PUT /api/barbers/:barberId/specialties (admin)
barbersRouter.put(
	"/:barberId/specialties",
	authenticate,
	authorize("admin"),
	validate(paramsSchema, "params"),
	validate(replaceSpecialtiesSchema, "body"),
	async (req, res, next) => {
		const client = await pool.connect()
		try {
			const { barberId } = res.locals.params as { barberId: number }
			const { specialtyIds } = req.body as { specialtyIds: number[] }

			const existing = await client.query("SELECT id FROM barbers WHERE id = $1", [barberId])
			if (existing.rows.length === 0) {
				next(ApiError.notFound("Barbeiro não encontrado"))
				return
			}

			// Deduplicate specialtyIds before verifying
			const uniqueSpecIds = [...new Set(specialtyIds)]
			const specCheck = await client.query(
				"SELECT id FROM specialties WHERE id = ANY($1) AND active = true",
				[uniqueSpecIds],
			)
			if (specCheck.rows.length !== uniqueSpecIds.length) {
				next(ApiError.validation("Uma ou mais especialidades não existem ou estão inativas", { specialtyIds: ["ID inválido ou inativo"] }))
				return
			}

			await client.query("BEGIN")

			await client.query("DELETE FROM barber_specialties WHERE barber_id = $1", [barberId])

			const values = uniqueSpecIds.map((_, i) => `($1, $${i + 2})`).join(", ")
			await client.query(
				`INSERT INTO barber_specialties (barber_id, specialty_id) VALUES ${values}`,
				[barberId, ...uniqueSpecIds],
			)

			await client.query("COMMIT")

			// Fetch updated specialties
			const { rows } = await query<{ id: number; name: string }>(
				`SELECT s.id, s.name FROM specialties s
				 JOIN barber_specialties bs ON bs.specialty_id = s.id
				 WHERE bs.barber_id = $1 ORDER BY s.name`,
				[barberId],
			)

			res.json({ barberId, specialties: rows })
		} catch (err) {
			await client.query("ROLLBACK").catch(() => {})
			next(err)
		} finally {
			client.release()
		}
	},
)

// GET /api/barbers/:barberId/availability (auth required)
barbersRouter.get(
	"/:barberId/availability",
	authenticate,
	validate(paramsSchema, "params"),
	validate(availabilityQuerySchema, "query"),
	async (req, res, next) => {
		try {
			const { barberId } = res.locals.params as { barberId: number }
			const { date, specialtyId } = res.locals.query as {
				date: string
				specialtyId: number
			}

			// Check barber exists and is active
			const barberCheck = await query(
				"SELECT id FROM barbers WHERE id = $1 AND active = true",
				[barberId],
			)
			if (barberCheck.rows.length === 0) {
				next(ApiError.notFound("Barbeiro não encontrado"))
				return
			}

			// Check barber has the specialty and it is active
			const specCheck = await query(
				`SELECT 1 FROM barber_specialties bs
				 JOIN specialties s ON s.id = bs.specialty_id
				 WHERE bs.barber_id = $1 AND bs.specialty_id = $2 AND s.active = true`,
				[barberId, specialtyId],
			)
			if (specCheck.rows.length === 0) {
				next(
					ApiError.validation("Barbeiro não atende essa especialidade", {
						specialtyId: ["Barbeiro não habilitado"],
					}),
				)
				return
			}

			// Get booked slots for the date
			const dayStart = startOfDaySP(date)
			const dayEnd = endOfDaySP(date)

			const booked = await query<{ start_at: Date }>(
				`SELECT start_at FROM appointments
				 WHERE barber_id = $1 AND status = 'scheduled'
				 AND start_at >= $2 AND start_at < $3`,
				[barberId, dayStart, dayEnd],
			)

			const slots = generateAvailableSlots(
				date,
				booked.rows.map((r) => r.start_at),
			)

			res.json({ barberId, date, specialtyId, slots })
		} catch (err) {
			next(err)
		}
	},
)
