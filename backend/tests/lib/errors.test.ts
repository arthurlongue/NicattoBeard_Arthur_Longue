import { describe, expect, it, vi } from "vitest"
import { errorHandler } from "../../src/lib/errors.js"

function createRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn(),
	}

	return res
}

describe("errorHandler", () => {
	it("does not expose stack traces outside development", () => {
		const previousNodeEnv = process.env.NODE_ENV
		process.env.NODE_ENV = "test"

		const res = createRes()
		errorHandler(new Error("boom"), {} as never, res as never, vi.fn())

		expect(res.status).toHaveBeenCalledWith(500)
		expect(res.json).toHaveBeenCalledWith({
			error: "INTERNAL_ERROR",
			message: "Erro interno do servidor",
		})

		process.env.NODE_ENV = previousNodeEnv
	})

	it("includes stack traces only in development", () => {
		const previousNodeEnv = process.env.NODE_ENV
		process.env.NODE_ENV = "development"

		const res = createRes()
		errorHandler(new Error("boom"), {} as never, res as never, vi.fn())

		expect(res.status).toHaveBeenCalledWith(500)
		expect(res.json.mock.calls[0][0]).toMatchObject({
			error: "INTERNAL_ERROR",
			message: "Erro interno do servidor",
		})
		expect(res.json.mock.calls[0][0].details).toHaveProperty("stack")

		process.env.NODE_ENV = previousNodeEnv
	})
})
