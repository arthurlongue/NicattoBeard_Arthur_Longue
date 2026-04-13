import type { RequestHandler } from "express"
import { z } from "zod"
import { ApiError } from "./errors.js"

export function validate(
	schema: z.ZodType,
	source: "body" | "params" | "query",
): RequestHandler {
	return (req, _res, next) => {
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

		req[source] = result.data
		next()
	}
}
