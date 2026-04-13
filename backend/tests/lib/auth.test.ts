import { describe, expect, it } from "vitest"
import jwt from "jsonwebtoken"
import { signToken, verifyToken } from "../../src/lib/auth.js"

const secret = "test-secret-min-32-characters-ok"

process.env.JWT_SECRET = secret

describe("auth helpers", () => {
	it("signToken + verifyToken round-trip valid payload", () => {
		const token = signToken({ sub: 7, role: "admin" })

		expect(verifyToken(token)).toEqual({ sub: 7, role: "admin" })
	})

	it("rejects payload with invalid runtime shape", () => {
		const token = jwt.sign({ sub: "7", role: "admin" }, secret, { algorithm: "HS256" })

		expect(() => verifyToken(token)).toThrow()
	})

	it("rejects tokens signed with a different algorithm", () => {
		const token = jwt.sign({ sub: 7, role: "customer" }, secret, { algorithm: "HS512" })

		expect(() => verifyToken(token)).toThrow()
	})
})
