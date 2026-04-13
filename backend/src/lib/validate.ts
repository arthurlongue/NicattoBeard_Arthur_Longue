import type { RequestHandler } from "express"
import { z } from "zod"
import { ApiError } from "./errors.js"

export function validate(
	schema: z.ZodType,
	source: "body" | "params" | "query",
): RequestHandler {
	return (req, res, next) => {
		const result = schema.safeParse(req[source])

		if (!result.success) {
			const fieldErrors: Record<string, string[]> = {}

			for (const issue of result.error.issues) {
				const key = issue.path.join(".") || source
				if (!fieldErrors[key]) fieldErrors[key] = []
				fieldErrors[key].push(issue.message)
			}

			next(ApiError.validation("Payload inválido", fieldErrors))
			return
		}

		// Express 5 makes req.query and req.params read-only getters.
		// Store parsed data in res.locals so handlers can access typed values.
		if (source === "query") {
			res.locals.query = result.data
		} else if (source === "params") {
			res.locals.params = result.data
		} else {
			req.body = result.data
		}

		next()
	}
}
