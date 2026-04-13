import express, { Router } from "express"
import { signToken } from "../src/lib/auth.js"
import { errorHandler } from "../src/lib/errors.js"

// Ensure JWT_SECRET is set for tests
if (!process.env.JWT_SECRET) {
	process.env.JWT_SECRET = "test-secret-min-32-characters-ok"
}

// ── App Factory ────────────────────────────────────────────────

export function createApp(routes: [string, Router][]) {
	const app = express()
	app.use(express.json())

	for (const [path, router] of routes) {
		app.use(path, router)
	}

	app.use(errorHandler)
	return app
}

// ── Auth Helpers ───────────────────────────────────────────────

export function tokenHeaders(payload: { sub: number; role: "customer" | "admin" }) {
	const token = signToken(payload)
	return { Authorization: `Bearer ${token}` }
}

export function customerHeaders(id: number = 1) {
	return tokenHeaders({ sub: id, role: "customer" })
}

export function adminHeaders(id: number = 1) {
	return tokenHeaders({ sub: id, role: "admin" })
}

// ── DB Errors ──────────────────────────────────────────────────

export function pgUniqueViolation() {
	const err = new Error("Unique violation")
	;(err as any).code = "23505"
	return err
}
