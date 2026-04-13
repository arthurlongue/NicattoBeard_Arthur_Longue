import { Router } from "express"
import { z } from "zod"
import type { AuthRole } from "../lib/auth.js"
import { comparePassword, hashPassword, signToken } from "../lib/auth.js"
import { query } from "../lib/db.js"
import { ApiError } from "../lib/errors.js"
import { validate } from "../lib/validate.js"

// --- Schemas ---

const registerSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120),
	email: z.string().email("E-mail inválido"),
	password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(72),
})

const loginSchema = z.object({
	email: z.string().email("E-mail inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
})

// --- Router ---

export const authRouter = Router()

// POST /api/auth/register
authRouter.post("/register", validate(registerSchema, "body"), async (req, res, next) => {
	try {
		const { name, email, password } = req.body

		const passwordHash = await hashPassword(password)

			const { rows } = await query<{
				id: number
				role: AuthRole
				name: string
				email: string
			}>(
			"INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, role, name, email",
			[name, email, passwordHash],
		)

		res.status(201).json({ user: rows[0] })
	} catch (err: unknown) {
		if (err instanceof Error && "code" in err && (err as { code: string }).code === "23505") {
			next(ApiError.conflict("E-mail já cadastrado"))
			return
		}
		next(err)
	}
})

// POST /api/auth/login
authRouter.post("/login", validate(loginSchema, "body"), async (req, res, next) => {
	try {
		const { email, password } = req.body

			const { rows } = await query<{
				id: number
				role: AuthRole
				name: string
				email: string
				password_hash: string
		}>("SELECT id, role, name, email, password_hash FROM users WHERE email = $1", [email])

		if (rows.length === 0) {
			next(ApiError.unauthorized("Credenciais inválidas"))
			return
		}

		const user = rows[0]
		const valid = await comparePassword(password, user.password_hash)

		if (!valid) {
			next(ApiError.unauthorized("Credenciais inválidas"))
			return
		}

		const token = signToken({ sub: user.id, role: user.role })

		res.json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		})
	} catch (err) {
		next(err)
	}
})
