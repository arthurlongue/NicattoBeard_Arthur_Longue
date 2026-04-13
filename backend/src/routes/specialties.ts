import { Router } from "express"
import { z } from "zod"
import { authenticate, authorize } from "../lib/auth.js"
import { query } from "../lib/db.js"
import { ApiError } from "../lib/errors.js"
import { validate } from "../lib/validate.js"

// --- Schemas ---

const createSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
	description: z.string().max(500).optional(),
})

const updateSchema = z
	.object({
		name: z.string().min(2).max(120).optional(),
		description: z.string().max(500).optional(),
		active: z.boolean().optional(),
	})
	.refine((obj) => Object.keys(obj).length > 0, "Ao menos um campo é obrigatório")

const paramsSchema = z.object({
	specialtyId: z.coerce.number().int().positive(),
})

// --- Router ---

export const specialtiesRouter = Router()

// GET /api/specialties (público)
specialtiesRouter.get("/", async (_req, res, next) => {
	try {
		const { rows } = await query(
			"SELECT id, name, description FROM specialties WHERE active = true ORDER BY name",
		)
		res.json(rows)
	} catch (err) {
		next(err)
	}
})

// POST /api/specialties (admin)
specialtiesRouter.post(
	"/",
	authenticate,
	authorize("admin"),
	validate(createSchema, "body"),
	async (req, res, next) => {
		try {
			const { name, description } = req.body

			const { rows } = await query(
				"INSERT INTO specialties (name, description) VALUES ($1, $2) RETURNING id, name, description",
				[name, description ?? null],
			)

			res.status(201).json(rows[0])
		} catch (err: unknown) {
			if (
				err instanceof Error &&
				"code" in err &&
				(err as { code: string }).code === "23505"
			) {
				next(ApiError.conflict("Especialidade já existe"))
				return
			}
			next(err)
		}
	},
)

// PATCH /api/specialties/:specialtyId (admin)
specialtiesRouter.patch(
	"/:specialtyId",
	authenticate,
	authorize("admin"),
	validate(paramsSchema, "params"),
	validate(updateSchema, "body"),
	async (req, res, next) => {
		try {
			const { specialtyId } = res.locals.params as { specialtyId: number }
			const body = req.body as { name?: string; description?: string; active?: boolean }

			// Check exists
			const existing = await query("SELECT id FROM specialties WHERE id = $1", [specialtyId])
			if (existing.rows.length === 0) {
				next(ApiError.notFound("Especialidade não encontrada"))
				return
			}

			// Build dynamic UPDATE
			const sets: string[] = []
			const values: unknown[] = []
			let i = 1

			if (body.name !== undefined) {
				sets.push(`name = $${i++}`)
				values.push(body.name)
			}
			if (body.description !== undefined) {
				sets.push(`description = $${i++}`)
				values.push(body.description)
			}
			if (body.active !== undefined) {
				sets.push(`active = $${i++}`)
				values.push(body.active)
			}

			values.push(specialtyId)

			const { rows } = await query(
				`UPDATE specialties SET ${sets.join(", ")} WHERE id = $${i} RETURNING id, name, description`,
				values,
			)

			res.json(rows[0])
		} catch (err: unknown) {
			if (
				err instanceof Error &&
				"code" in err &&
				(err as { code: string }).code === "23505"
			) {
				next(ApiError.conflict("Nome já em uso"))
				return
			}
			next(err)
		}
	},
)
