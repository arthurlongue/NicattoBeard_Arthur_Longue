import type { ErrorRequestHandler } from "express"

export class ApiError extends Error {
	constructor(
		public statusCode: number,
		public error: string,
		message: string,
		public details?: unknown,
	) {
		super(message)
		this.name = "ApiError"
	}

	static conflict(message: string, details?: unknown) {
		return new ApiError(409, "CONFLICT", message, details)
	}

	static badRequest(message = "Requisição inválida", details?: unknown) {
		return new ApiError(400, "BAD_REQUEST", message, details)
	}

	static notFound(message = "Recurso não encontrado") {
		return new ApiError(404, "NOT_FOUND", message)
	}

	static unauthorized(message = "Não autorizado") {
		return new ApiError(401, "UNAUTHORIZED", message)
	}

	static forbidden(message = "Permissão insuficiente") {
		return new ApiError(403, "FORBIDDEN", message)
	}

	static validation(message: string, fieldErrors?: Record<string, string[]>) {
		return new ApiError(422, "VALIDATION_ERROR", message, fieldErrors ? { fieldErrors } : undefined)
	}
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	if (err instanceof ApiError) {
		res.status(err.statusCode).json({
			error: err.error,
			message: err.message,
			...(err.details ? { details: err.details } : {}),
		})
		return
	}

	if (
		err instanceof Error &&
		"type" in err &&
		(err as { type?: string }).type === "entity.parse.failed"
	) {
		res.status(400).json({
			error: "BAD_REQUEST",
			message: "JSON inválido no corpo da requisição",
		})
		return
	}

	console.error("[INTERNAL_ERROR]", err)

	const isDev = process.env.NODE_ENV === "development"

	res.status(500).json({
		error: "INTERNAL_ERROR",
		message: "Erro interno do servidor",
		...(isDev && err instanceof Error ? { details: { stack: err.stack } } : {}),
	})
}
