import pg from "pg"

const { Pool, types } = pg

// DATE (OID 1082) → "YYYY-MM-DD" string instead of Date object
types.setTypeParser(1082, (val) => val)

// BIGINT / int8 (OID 20) → number instead of string
// pg returns BIGINT as string because JS Number can't represent all int64 values.
// Our IDs will never exceed MAX_SAFE_INTEGER, so parsing as number is safe.
types.setTypeParser(20, (val) => Number(val))

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	min: 0,
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
