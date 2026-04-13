import pg from "pg"

const { Pool } = pg

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 10,
	connectionTimeoutMillis: 5000,
})

pool.on("error", (err) => {
	console.error("[DB] Unexpected pool error:", err.message)
})

export function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
	text: string,
	params?: unknown[],
) {
	return pool.query<T>(text, params)
}
