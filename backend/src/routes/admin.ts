import { Router } from "express"
import { z } from "zod"
import { authenticate, authorize } from "../lib/auth.js"
import { query } from "../lib/db.js"
import { toSaoPauloISO, startOfDaySP, endOfDaySP } from "../lib/slots.js"
import { validate } from "../lib/validate.js"

// --- Schemas ---

const querySchema = z.object({
	scope: z.enum(["today", "future"], {
		message: "scope deve ser 'today' ou 'future'",
	}),
})

// --- Router ---

export const adminRouter = Router()

// GET /api/admin/appointments (admin only)
adminRouter.get(
	"/appointments",
	authenticate,
	authorize("admin"),
	validate(querySchema, "query"),
	async (req, res, next) => {
		try {
			const { scope } = req.query as { scope: "today" | "future" }

			let whereClause: string
			let params: unknown[]

			if (scope === "today") {
				const todayStr = new Intl.DateTimeFormat("en-CA", {
					timeZone: "America/Sao_Paulo",
				}).format(new Date())
				const dayStart = startOfDaySP(todayStr)
				const dayEnd = endOfDaySP(todayStr)
				whereClause = "a.start_at >= $1 AND a.start_at < $2"
				params = [dayStart, dayEnd]
			} else {
				whereClause = "a.start_at > NOW()"
				params = []
			}

			const { rows } = await query<{
				id: number
				status: string
				start_at: Date
				end_at: Date
				customer_id: number
				customer_name: string
				barber_id: number
				barber_name: string
				specialty_id: number
				specialty_name: string
			}>(
				`SELECT a.id, a.status, a.start_at, a.end_at,
				        u.id AS customer_id, u.name AS customer_name,
				        b.id AS barber_id, b.name AS barber_name,
				        s.id AS specialty_id, s.name AS specialty_name
				 FROM appointments a
				 JOIN users u ON u.id = a.customer_id
				 JOIN barbers b ON b.id = a.barber_id
				 JOIN specialties s ON s.id = a.specialty_id
				 WHERE ${whereClause}
				 ORDER BY a.start_at ASC`,
				params,
			)

			res.json(
				rows.map((r) => ({
					id: r.id,
					status: r.status,
					startAt: toSaoPauloISO(r.start_at),
					endAt: toSaoPauloISO(r.end_at),
					customer: { id: r.customer_id, name: r.customer_name },
					barber: { id: r.barber_id, name: r.barber_name },
					specialty: { id: r.specialty_id, name: r.specialty_name },
				})),
			)
		} catch (err) {
			next(err)
		}
	},
)
