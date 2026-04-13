/**
 * Tests for routes/barbers.ts
 *
 * GET /, POST /, PATCH /:barberId,
 * PUT /:barberId/specialties, GET /:barberId/availability
 *
 * Barbers route uses pool.connect() for transactions — mock includes client.
 *
 * Run: pnpm vitest run tests/routes/barbers.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import { customerHeaders, adminHeaders, createApp } from "../helpers.js"

// ── Mocks (vi.hoisted for cross-reference) ─────────────────────

const { mockQuery, mockClient, mockPool, mockGenerateSlots } = vi.hoisted(
	() => ({
		mockQuery: vi.fn(),
		mockClient: { query: vi.fn(), release: vi.fn() },
		mockPool: { end: vi.fn(), connect: vi.fn() },
		mockGenerateSlots: vi.fn(),
	}),
)

vi.mock("../../src/lib/db.js", () => ({
	pool: mockPool,
	query: mockQuery,
}))

vi.mock("../../src/lib/slots.js", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../src/lib/slots.js")>()
	return {
		...actual,
		generateAvailableSlots: mockGenerateSlots,
		startOfDaySP: vi.fn(() => new Date("2026-06-15T03:00:00.000Z")),
		endOfDaySP: vi.fn(() => new Date("2026-06-16T02:59:59.999Z")),
	}
})

import { barbersRouter } from "../../src/routes/barbers.js"

const app = createApp([["/api/barbers", barbersRouter]])

function futureDate(daysAhead: number): string {
	const date = new Date()
	date.setUTCDate(date.getUTCDate() + daysAhead)
	return date.toISOString().slice(0, 10)
}

/**
 * Sets up mockClient.query for a transaction flow:
 * specCheckRows → BEGIN → INSERT barber(id) → INSERT specialties → COMMIT
 */
function setupTransactionMocks(specRows: Array<{ id: number }> = [], barberId = 4) {
	mockPool.connect.mockResolvedValueOnce(mockClient)
	mockClient.release.mockReset()
	mockClient.query.mockReset()
	mockClient.query
		.mockResolvedValueOnce({ rows: specRows })
		.mockResolvedValueOnce({}) // BEGIN
		.mockResolvedValueOnce({ rows: [{ id: barberId }] }) // INSERT barber
		.mockResolvedValueOnce({ rowCount: specRows.length }) // INSERT specialties
		.mockResolvedValueOnce({}) // COMMIT
}

// ── GET /api/barbers ───────────────────────────────────────────

describe("GET /api/barbers", () => {
	beforeEach(() => mockQuery.mockReset())

	it("returns active barbers with specialties → 200 (public)", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 1,
					name: "Rafael Costa",
					age: 31,
					hire_date: "2024-03-01",
					specialty_id: 1,
					specialty_name: "Barba",
				},
				{
					id: 1,
					name: "Rafael Costa",
					age: 31,
					hire_date: "2024-03-01",
					specialty_id: 2,
					specialty_name: "Corte",
				},
			],
		})

		const res = await request(app).get("/api/barbers")

		expect(res.status).toBe(200)
		expect(res.body).toBeInstanceOf(Array)
		expect(res.body[0]).toHaveProperty("specialties")
		expect(res.body[0].specialties).toHaveLength(2)
	})

	it("returns 200 with empty list", async () => {
		mockQuery.mockResolvedValueOnce({ rows: [] })

		const res = await request(app).get("/api/barbers")

		expect(res.status).toBe(200)
		expect(res.body).toEqual([])
	})
})

// ── POST /api/barbers ──────────────────────────────────────────

describe("POST /api/barbers", () => {
	beforeEach(() => {
		mockQuery.mockReset()
		mockClient.query.mockReset()
		mockPool.connect.mockReset()
	})

	it("admin creates barber → 201", async () => {
		// Transaction: pool.connect → client.query calls
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()

		// 1. Check specialtyIds exist (via client)
		mockClient.query
			.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }) // spec check
			.mockResolvedValueOnce({}) // BEGIN
			.mockResolvedValueOnce({ rows: [{ id: 4 }] }) // INSERT barber
			.mockResolvedValueOnce({ rowCount: 2 }) // INSERT specialties
			.mockResolvedValueOnce({}) // COMMIT

		// After transaction: fetchBarberWithSpecialties (uses query, not client)
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 4,
					name: "Novo Barbeiro",
					age: 25,
					hire_date: "2026-01-15",
					specialty_id: 1,
					specialty_name: "Barba",
				},
				{
					id: 4,
					name: "Novo Barbeiro",
					age: 25,
					hire_date: "2026-01-15",
					specialty_id: 2,
					specialty_name: "Corte",
				},
			],
		})

		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({
				name: "Novo Barbeiro",
				age: 25,
				hireDate: "2026-01-15",
				specialtyIds: [1, 2],
			})

		expect(res.status).toBe(201)
		expect(res.body).toHaveProperty("id")
		expect(res.body).toHaveProperty("specialties")
	})

	it("no token → 401", async () => {
		const res = await request(app)
			.post("/api/barbers")
			.send({ name: "X", age: 20, hireDate: "2026-01-01", specialtyIds: [1] })

		expect(res.status).toBe(401)
	})

	it("customer → 403", async () => {
		const res = await request(app)
			.post("/api/barbers")
			.set(customerHeaders())
			.send({ name: "X", age: 20, hireDate: "2026-01-01", specialtyIds: [1] })

		expect(res.status).toBe(403)
	})

	it("age < 18 → 422", async () => {
		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({ name: "X", age: 15, hireDate: "2026-01-01", specialtyIds: [1] })

		expect(res.status).toBe(422)
	})

	it("age > 100 → 422", async () => {
		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({ name: "X", age: 101, hireDate: "2026-01-01", specialtyIds: [1] })

		expect(res.status).toBe(422)
	})

	it("future hireDate → 422", async () => {
		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({
				name: "X",
				age: 25,
				hireDate: "2099-01-01",
				specialtyIds: [1],
			})

		expect(res.status).toBe(422)
	})

	it("empty specialtyIds → 422", async () => {
		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({
				name: "X",
				age: 25,
				hireDate: "2026-01-01",
				specialtyIds: [],
			})

		expect(res.status).toBe(422)
	})

	it("non-existent specialtyId → 422", async () => {
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()
		mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // only 1 of 2 found

		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({
				name: "X",
				age: 25,
				hireDate: "2026-01-01",
				specialtyIds: [1, 999],
			})

		expect(res.status).toBe(422)
	})

	it("inactive specialtyId → 422", async () => {
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()
		// query filters by AND active = true, so if specialty 2 is inactive, it only returns 1 row
		mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] })

		const res = await request(app)
			.post("/api/barbers")
			.set(adminHeaders())
			.send({
				name: "X",
				age: 25,
				hireDate: "2026-01-01",
				specialtyIds: [1, 2], // 2 is inactive
			})

		expect(res.status).toBe(422)
	})
})

// ── PATCH /api/barbers/:barberId ───────────────────────────────

describe("PATCH /api/barbers/:barberId", () => {
	beforeEach(() => mockQuery.mockReset())

	it("admin updates barber → 200", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [
				{ id: 1, name: "Rafael", age: 31, hire_date: "2024-03-01", active: true },
			],
		})
		mockQuery.mockResolvedValueOnce({ rowCount: 1 }) // UPDATE
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 1,
					name: "Rafael Silva",
					age: 32,
					hire_date: "2024-03-01",
					specialty_id: 1,
					specialty_name: "Barba",
				},
			],
		})

		const res = await request(app)
			.patch("/api/barbers/1")
			.set(adminHeaders())
			.send({ name: "Rafael Silva", age: 32 })

		expect(res.status).toBe(200)
		expect(res.body.name).toBe("Rafael Silva")
	})

	it("non-existent barber → 404", async () => {
		mockQuery.mockResolvedValueOnce({ rows: [] })

		const res = await request(app)
			.patch("/api/barbers/999")
			.set(adminHeaders())
			.send({ name: "Ghost" })

		expect(res.status).toBe(404)
	})

	it("no fields → 422", async () => {
		const res = await request(app)
			.patch("/api/barbers/1")
			.set(adminHeaders())
			.send({})

		expect(res.status).toBe(422)
	})
})

// ── PUT /api/barbers/:barberId/specialties ─────────────────────

describe("PUT /api/barbers/:barberId/specialties", () => {
	beforeEach(() => {
		mockQuery.mockReset()
		mockClient.query.mockReset()
		mockPool.connect.mockReset()
	})

	it("replaces specialties → 200", async () => {
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()

		// 1. Barber exists (via client)
		mockClient.query
			.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // barber check
			.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 3 }] }) // spec check
			.mockResolvedValueOnce({}) // BEGIN
			.mockResolvedValueOnce({ rowCount: 2 }) // DELETE
			.mockResolvedValueOnce({ rowCount: 2 }) // INSERT new
			.mockResolvedValueOnce({}) // COMMIT

		// After transaction: re-fetch (uses query)
		mockQuery.mockResolvedValueOnce({
			rows: [
				{ id: 1, name: "Barba" },
				{ id: 3, name: "Sobrancelha" },
			],
		})

		const res = await request(app)
			.put("/api/barbers/1/specialties")
			.set(adminHeaders())
			.send({ specialtyIds: [1, 3] })

		expect(res.status).toBe(200)
		expect(res.body).toHaveProperty("barberId")
		expect(res.body).toHaveProperty("specialties")
	})

	it("non-existent barber → 404", async () => {
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()
		mockClient.query.mockResolvedValueOnce({ rows: [] }) // barber not found

		const res = await request(app)
			.put("/api/barbers/999/specialties")
			.set(adminHeaders())
			.send({ specialtyIds: [1] })

		expect(res.status).toBe(404)
	})

	it("empty specialtyIds → 422", async () => {
		const res = await request(app)
			.put("/api/barbers/1/specialties")
			.set(adminHeaders())
			.send({ specialtyIds: [] })

		expect(res.status).toBe(422)
	})

	it("non-existent specialtyId → 422", async () => {
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()
		mockClient.query
			.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // barber exists
			.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // only 1 found

		const res = await request(app)
			.put("/api/barbers/1/specialties")
			.set(adminHeaders())
			.send({ specialtyIds: [1, 999] })

		expect(res.status).toBe(422)
	})

	it("inactive specialtyId → 422", async () => {
		mockPool.connect.mockResolvedValueOnce(mockClient)
		mockClient.release.mockReset()
		mockClient.query
			.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // barber exists
			.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // only 1 active found for 1 and 2

		const res = await request(app)
			.put("/api/barbers/1/specialties")
			.set(adminHeaders())
			.send({ specialtyIds: [1, 2] }) // 2 is inactive

		expect(res.status).toBe(422)
	})
})

// ── GET /api/barbers/:barberId/availability ────────────────────

describe("GET /api/barbers/:barberId/availability", () => {
	beforeEach(() => {
		mockQuery.mockReset()
		mockGenerateSlots.mockReset()
	})

	it("returns available slots → 200", async () => {
		// Barber exists
		mockQuery.mockResolvedValueOnce({
			rows: [{ id: 1 }],
		})
		// Barber has specialty
		mockQuery.mockResolvedValueOnce({ rows: [{ barber_id: 1 }] })
		// Booked slots
		mockQuery.mockResolvedValueOnce({
			rows: [{ start_at: new Date("2026-06-15T10:00:00-03:00") }],
		})

			mockGenerateSlots.mockReturnValue([
				{
					startAt: `${futureDate(2)}T08:00:00-03:00`,
					endAt: `${futureDate(2)}T08:30:00-03:00`,
				},
			])

			const res = await request(app)
				.get(`/api/barbers/1/availability?date=${futureDate(2)}&specialtyId=1`)
				.set(customerHeaders())

			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty("barberId", 1)
			expect(res.body).toHaveProperty("date", futureDate(2))
			expect(res.body).toHaveProperty("specialtyId", 1)
			expect(res.body).toHaveProperty("slots")
		})

	it("non-existent barber → 404", async () => {
			mockQuery.mockResolvedValueOnce({ rows: [] })

			const res = await request(app)
				.get(`/api/barbers/999/availability?date=${futureDate(2)}&specialtyId=1`)
				.set(customerHeaders())

			expect(res.status).toBe(404)
		})

		it("availability beyond booking window → 422", async () => {
			const res = await request(app)
				.get(`/api/barbers/1/availability?date=${futureDate(120)}&specialtyId=1`)
				.set(customerHeaders())

			expect(res.status).toBe(422)
		})

		it("no auth → 401", async () => {
			const res = await request(app)
				.get(`/api/barbers/1/availability?date=${futureDate(2)}&specialtyId=1`)

			expect(res.status).toBe(401)
		})
	})
