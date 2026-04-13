import bcrypt from "bcryptjs"
import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"
import { ApiError } from "./errors.js"

const SALT_ROUNDS = 10

function getSecret(): string {
	const secret = process.env.JWT_SECRET
	if (!secret) throw new Error("JWT_SECRET not configured")
	return secret
}

// --- Password helpers ---

export function hashPassword(plain: string): Promise<string> {
	return bcrypt.hash(plain, SALT_ROUNDS)
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
	return bcrypt.compare(plain, hash)
}

// --- JWT helpers ---

export function signToken(payload: { sub: number; role: string }): string {
	return jwt.sign(payload, getSecret(), { expiresIn: "24h" })
}

export function verifyToken(token: string): { sub: number; role: string } {
	const decoded = jwt.verify(token, getSecret())
	return decoded as unknown as { sub: number; role: string }
}

// --- Middleware ---

export const authenticate: RequestHandler = (req, _res, next) => {
	const header = req.headers.authorization

	if (!header?.startsWith("Bearer ")) {
		next(ApiError.unauthorized("Token inválido ou ausente"))
		return
	}

	try {
		const payload = verifyToken(header.slice(7))
		req.user = { id: payload.sub, role: payload.role as "customer" | "admin" }
		next()
	} catch {
		next(ApiError.unauthorized("Token inválido ou ausente"))
	}
}

export function authorize(...roles: string[]): RequestHandler {
	return (req, _res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			next(ApiError.forbidden("Permissão insuficiente"))
			return
		}
		next()
	}
}
