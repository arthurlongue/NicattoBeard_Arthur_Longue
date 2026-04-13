import pg from "pg"

const { Pool, types } = pg

// BIGINT (OID 20) → number instead of string
types.setTypeParser(20, (val) => Number.parseInt(val, 10))
// DATE (OID 1082) → "YYYY-MM-DD" string instead of Date object
types.setTypeParser(1082, (val) => val)

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
