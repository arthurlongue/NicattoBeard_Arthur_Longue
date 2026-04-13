/**
 * Tests for routes/appointments.ts
 *
 * GET /, POST /, PATCH /:appointmentId/cancel
 * Run: pnpm vitest run tests/routes/appointments.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import { customerHeaders, pgUniqueViolation, createApp } from "../helpers.js"

// ── Mock DB ────────────────────────────────────────────────────

const { mockQuery } = vi.hoisted(() => ({
	mockQuery: vi.fn(),
}))

vi.mock("../../src/lib/db.js", () => ({
	pool: { end: vi.fn() },
	query: mockQuery,
}))

vi.mock("../../src/lib/slots.js", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../src/lib/slots.js")>()
	return {
		...actual,
		toSaoPauloISO: vi.fn((d: Date) => d ? d.toISOString() : ""),
	}
})

import { appointmentsRouter } from "../../src/routes/appointments.js"

const app = createApp([["/api/appointments", appointmentsRouter]])

const ONE_HOUR_MS = 3_600_000

function futureDate(daysAhead: number): string {
	const date = new Date()
	date.setUTCDate(date.getUTCDate() + daysAhead)
	return date.toISOString().slice(0, 10)
}

// ── POST /api/appointments ─────────────────────────────────────

describe("POST /api/appointments", () => {
	beforeEach(() => mockQuery.mockReset())

	const validPayload = {
		barberId: 1,
		specialtyId: 2,
		startAt: `${futureDate(2)}T10:00:00-03:00`,
	}

	it("creates appointment on free slot → 201", async () => {
		// INSERT
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					status: "scheduled",
					start_at: new Date("2026-06-15T13:00:00.000Z"),
					end_at: new Date("2026-06-15T13:30:00.000Z"),
					customer_id: 1,
					barber_id: 1,
					specialty_id: 2,
				},
			],
		})

		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send(validPayload)

		expect(res.status).toBe(201)
		expect(res.body).toHaveProperty("id")
		expect(res.body.status).toBe("scheduled")
	})

	it("barber without specialty → 422", async () => {
		mockQuery.mockResolvedValueOnce({ rows: [] })

		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send(validPayload)

		expect(res.status).toBe(422)
	})

	it("duplicate slot (PG 23505) → 409 CONFLICT", async () => {
		const { pgUniqueViolation } = await import("../helpers.js")

		mockQuery.mockRejectedValueOnce(pgUniqueViolation())

		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send(validPayload)

		expect(res.status).toBe(409)
		expect(res.body.error).toBe("CONFLICT")
	})

	it("hour 07:30 (before business hours) → 422", async () => {
		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send({ ...validPayload, startAt: `${futureDate(2)}T07:30:00-03:00` })

		expect(res.status).toBe(422)
	})

	it("hour 18:00 (after business hours) → 422", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [{ barber_id: 1, specialty_id: 2 }],
		})

		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send({ ...validPayload, startAt: `${futureDate(2)}T18:00:00-03:00` })

		expect(res.status).toBe(422)
	})

	it("non-aligned minutes (09:15) → 422", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [{ barber_id: 1, specialty_id: 2 }],
		})

		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send({ ...validPayload, startAt: `${futureDate(2)}T09:15:00-03:00` })

		expect(res.status).toBe(422)
	})

	it("booking more than 90 days ahead → 422", async () => {
		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send({ ...validPayload, startAt: `${futureDate(120)}T10:00:00-03:00` })

		expect(res.status).toBe(422)
	})

	it("no auth → 401", async () => {
		const res = await request(app)
			.post("/api/appointments")
			.send(validPayload)

		expect(res.status).toBe(401)
	})

	it("invalid payload → 422", async () => {
		const res = await request(app)
			.post("/api/appointments")
			.set(customerHeaders())
			.send({})

		expect(res.status).toBe(422)
	})
})

// ── GET /api/appointments ──────────────────────────────────────

describe("GET /api/appointments", () => {
	beforeEach(() => mockQuery.mockReset())

	it("returns only the customer's appointments → 200", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					status: "scheduled",
					start_at: new Date("2026-06-15T13:00:00.000Z"),
					end_at: new Date("2026-06-15T13:30:00.000Z"),
					specialty_id: 2,
					specialty_name: "Corte",
					barber_id: 1,
					barber_name: "Rafael",
				},
			],
		})

		const res = await request(app)
			.get("/api/appointments")
			.set(customerHeaders(5))

		expect(res.status).toBe(200)
		expect(res.body).toBeInstanceOf(Array)
		expect(res.body[0]).toHaveProperty("specialty")
		expect(res.body[0]).toHaveProperty("barber")
		expect(mockQuery).toHaveBeenCalledWith(
			expect.any(String),
			expect.arrayContaining([5]),
		)
	})

	it("no auth → 401", async () => {
		const res = await request(app).get("/api/appointments")
		expect(res.status).toBe(401)
	})
})

// ── PATCH /api/appointments/:appointmentId/cancel ──────────────

describe("PATCH /api/appointments/:appointmentId/cancel", () => {
	beforeEach(() => mockQuery.mockReset())

	it("cancel own appointment >2h ahead → 200", async () => {
		const futureStart = new Date(Date.now() + 3 * ONE_HOUR_MS)
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					customer_id: 1,
					status: "scheduled",
					start_at: futureStart,
				},
			],
		})
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					status: "cancelled",
					cancelled_at: new Date(),
					cancellation_reason: "Imprevisto",
				},
			],
		})

		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.set(customerHeaders(1))
			.send({ reason: "Imprevisto" })

		expect(res.status).toBe(200)
		expect(res.body.status).toBe("cancelled")
		expect(res.body).toHaveProperty("cancelledAt")
		expect(mockQuery).toHaveBeenLastCalledWith(expect.stringContaining("WHERE id = $1 AND customer_id = $2 AND status = 'scheduled'"), [10, 1, "Imprevisto"])
	})

	it("appointment of another customer → 403", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					customer_id: 99,
					status: "scheduled",
					start_at: new Date(Date.now() + 5 * ONE_HOUR_MS),
				},
			],
		})

		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.set(customerHeaders(1))
			.send({})

		expect(res.status).toBe(403)
	})

	it("cancel <2h before → 409", async () => {
		const soonStart = new Date(Date.now() + 1 * ONE_HOUR_MS)
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					customer_id: 1,
					status: "scheduled",
					start_at: soonStart,
				},
			],
		})

		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.set(customerHeaders(1))
			.send({})

		expect(res.status).toBe(409)
	})

	it("already cancelled → 409", async () => {
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					customer_id: 1,
					status: "cancelled",
					start_at: new Date(Date.now() + 5 * ONE_HOUR_MS),
				},
			],
		})

		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.set(customerHeaders(1))
			.send({})

		expect(res.status).toBe(409)
	})

	it("non-existent appointment → 404", async () => {
		mockQuery.mockResolvedValueOnce({ rows: [] })

		const res = await request(app)
			.patch("/api/appointments/999/cancel")
			.set(customerHeaders(1))
			.send({})

		expect(res.status).toBe(404)
	})

	it("no auth → 401", async () => {
		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.send({})

		expect(res.status).toBe(401)
	})

	it("cancel without reason → 200 (reason optional)", async () => {
		const futureStart = new Date(Date.now() + 3 * ONE_HOUR_MS)
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					customer_id: 1,
					status: "scheduled",
					start_at: futureStart,
				},
			],
		})
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					status: "cancelled",
					cancelled_at: new Date(),
					cancellation_reason: null,
				},
			],
		})

		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.set(customerHeaders(1))
			.send({})

		expect(res.status).toBe(200)
	})

	it("cancel loses race before update → 409", async () => {
		const futureStart = new Date(Date.now() + 3 * ONE_HOUR_MS)
		mockQuery.mockResolvedValueOnce({
			rows: [
				{
					id: 10,
					customer_id: 1,
					status: "scheduled",
					start_at: futureStart,
				},
			],
		})
		mockQuery.mockResolvedValueOnce({ rows: [] })

		const res = await request(app)
			.patch("/api/appointments/10/cancel")
			.set(customerHeaders(1))
			.send({})

		expect(res.status).toBe(409)
	})
})
