import "dotenv/config"
import cors from "cors"
import express from "express"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import { adminRouter } from "./routes/admin.js"
import { appointmentsRouter } from "./routes/appointments.js"
import { authRouter } from "./routes/auth.js"
import { barbersRouter } from "./routes/barbers.js"
import { specialtiesRouter } from "./routes/specialties.js"
import { pool } from "./lib/db.js"
import { errorHandler } from "./lib/errors.js"

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3001),
	NODE_ENV: z.enum(["development", "production", "test"]).optional(),
	CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
	DATABASE_URL: z.string().url(),
	JWT_SECRET: z.string().min(8),
})

const envResult = envSchema.safeParse(process.env)

if (!envResult.success) {
	const details = envResult.error.issues
		.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
		.join("; ")

	throw new Error(`Invalid environment configuration. ${details}`)
}

const app = express()
const env = envResult.data
const port = env.PORT
const isDev = env.NODE_ENV !== "production"
const corsOrigin = env.CORS_ORIGIN
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = path.dirname(currentFilePath)
const frontendDistDir = path.resolve(currentDirPath, "../../frontend/dist")
const hasFrontendBuild = fs.existsSync(frontendDistDir)

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || origin === corsOrigin || (isDev && localhostPattern.test(origin))) {
				callback(null, true)
				return
			}

			callback(new Error(`CORS blocked for origin "${origin}"`))
		},
	}),
)
app.use(express.json())

// --- Health ---
app.get("/api/health", (_req, res) => {
	res.json({ status: "ok" })
})

// --- Routes ---
app.use("/api/auth", authRouter)
app.use("/api/specialties", specialtiesRouter)
app.use("/api/barbers", barbersRouter)
app.use("/api/appointments", appointmentsRouter)
app.use("/api/admin", adminRouter)

if (hasFrontendBuild) {
	app.use(express.static(frontendDistDir))

	app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
		res.sendFile(path.join(frontendDistDir, "index.html"))
	})
}

// --- Error handler (must be last) ---
app.use(errorHandler)

// --- Start ---
const server = app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})

// --- Graceful shutdown ---
process.on("SIGTERM", () => {
	console.log("SIGTERM received, shutting down...")
	server.close(() => {
		pool.end().then(() => process.exit(0))
	})
})
