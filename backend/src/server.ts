import "dotenv/config"
import cors from "cors"
import express from "express"

const parsePort = (value: string | undefined, fallbackPort: number, label: string) => {
	if (!value) {
		return fallbackPort
	}

	const parsedPort = Number(value)

	if (
		Number.isInteger(parsedPort) &&
		parsedPort >= 1 &&
		parsedPort <= 65535
	) {
		return parsedPort
	}

	throw new Error(`Invalid ${label}: "${value}"`)
}

const app = express()
const port = parsePort(process.env.PORT, 3001, "PORT")
const isDev = process.env.NODE_ENV !== "production"
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173"
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
