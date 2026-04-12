import "dotenv/config"
import cors from "cors"
import express from "express"
import { z } from "zod"

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3001),
	NODE_ENV: z.enum(["development", "production", "test"]).optional(),
	CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
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

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || origin === corsOrigin || (isDev && localhostPattern.test(origin))) {
				callback(null, true)
				return
			}

			callback(new Error(`CORS blocked for origin "${origin}"`))
		},
	})
)
app.use(express.json())

app.get("/api/health", (_req, res) => {
	res.json({
		status: "ok",
	})
})

app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
