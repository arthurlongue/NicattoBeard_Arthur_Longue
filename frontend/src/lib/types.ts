// ── Domain types aligned with API contract (docs/API.md) ────────────

export type UserRole = "admin" | "customer"

export interface User {
	id: number
	name: string
	email: string
	role: UserRole
}

export interface LoginResponse {
	token: string
	user: User
}

export interface RegisterResponse {
	user: User
}

// ── Specialties ─────────────────────────────────────────────────────

export interface Specialty {
	id: number
	name: string
	description?: string
	active?: boolean
}

// ── Barbers ─────────────────────────────────────────────────────────

export interface Barber {
	id: number
	name: string
	age: number
	hireDate: string
	active?: boolean
	specialties: Pick<Specialty, "id" | "name">[]
}

// ── Availability ────────────────────────────────────────────────────

export interface Slot {
	startAt: string // ISO 8601
	endAt: string
}

export interface AvailabilityResponse {
	barberId: number
	date: string
	specialtyId: number
	slots: Slot[]
}

// ── Appointments ────────────────────────────────────────────────────

export type AppointmentStatus = "scheduled" | "cancelled"

/** Shape returned by GET /api/appointments (customer) */
export interface CustomerAppointment {
	id: number
	status: AppointmentStatus
	startAt: string
	endAt: string
	specialty: Pick<Specialty, "id" | "name">
	barber: Pick<Barber, "id" | "name">
}

/** Shape returned by GET /api/admin/appointments (admin) */
export interface AdminAppointment extends CustomerAppointment {
	customer: Pick<User, "id" | "name">
}

/** Shape returned by POST /api/appointments */
export interface CreateAppointmentResponse {
	id: number
	status: AppointmentStatus
	startAt: string
	endAt: string
	customerId: number
	barberId: number
	specialtyId: number
}

/** Shape returned by PATCH /api/appointments/:id/cancel */
export interface CancelAppointmentResponse {
	id: number
	status: "cancelled"
	cancelledAt: string
	cancellationReason?: string
}
