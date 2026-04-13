import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import type {
	AdminAppointment,
	AvailabilityResponse,
	Barber,
	CancelAppointmentResponse,
	CreateAppointmentResponse,
	CustomerAppointment,
	Specialty,
} from "./types"

// ── Query Keys ──────────────────────────────────────────────────────

export const keys = {
	specialties: ["specialties"] as const,
	barbers: (specialtyId?: number) => ["barbers", { specialtyId }] as const,
	availability: (barberId: number, date: string, specialtyId: number) =>
		["availability", barberId, date, specialtyId] as const,
	myAppointments: ["my-appointments"] as const,
	adminAppointments: (scope: string) => ["admin-appointments", scope] as const,
}

// ── Specialties ─────────────────────────────────────────────────────

export function useSpecialties() {
	return useQuery({
		queryKey: keys.specialties,
		queryFn: () => api.get<Specialty[]>("/specialties"),
	})
}

export function useCreateSpecialty() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: { name: string; description?: string }) =>
			api.post<Specialty>("/specialties", data),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.specialties }),
	})
}

export function useUpdateSpecialty() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...data }: { id: number; name?: string; description?: string; active?: boolean }) =>
			api.patch<Specialty>(`/specialties/${id}`, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: keys.specialties }),
	})
}

// ── Barbers ─────────────────────────────────────────────────────────

export function useBarbers(specialtyId?: number) {
	const qs = specialtyId ? `?specialtyId=${specialtyId}` : ""
	return useQuery({
		queryKey: keys.barbers(specialtyId),
		queryFn: () => api.get<Barber[]>(`/barbers${qs}`),
	})
}

export function useCreateBarber() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: { name: string; age: number; hireDate: string; specialtyIds: number[] }) =>
			api.post<Barber>("/barbers", data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["barbers"] }),
	})
}

export function useUpdateBarber() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...data }: { id: number; name?: string; age?: number; active?: boolean }) =>
			api.patch<Barber>(`/barbers/${id}`, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["barbers"] }),
	})
}

export function useSetBarberSpecialties() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ barberId, specialtyIds }: { barberId: number; specialtyIds: number[] }) =>
			api.put<{ barberId: number; specialties: { id: number; name: string }[] }>(
				`/barbers/${barberId}/specialties`,
				{ specialtyIds },
			),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["barbers"] }),
	})
}

// ── Availability ────────────────────────────────────────────────────

export function useAvailability(barberId: number | undefined, date: string | undefined, specialtyId: number | undefined) {
	return useQuery({
		queryKey: keys.availability(barberId!, date!, specialtyId!),
		queryFn: () =>
			api.get<AvailabilityResponse>(
				`/barbers/${barberId}/availability?date=${date}&specialtyId=${specialtyId}`,
			),
		enabled: !!barberId && !!date && !!specialtyId,
	})
}

// ── Customer Appointments ───────────────────────────────────────────

export function useMyAppointments() {
	return useQuery({
		queryKey: keys.myAppointments,
		queryFn: () => api.get<CustomerAppointment[]>("/appointments"),
	})
}

export function useCreateAppointment() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: { barberId: number; specialtyId: number; startAt: string }) =>
			api.post<CreateAppointmentResponse>("/appointments", data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.myAppointments })
			qc.invalidateQueries({ queryKey: ["availability"] })
		},
	})
}

export function useCancelAppointment() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
			api.patch<CancelAppointmentResponse>(`/appointments/${id}/cancel`, reason ? { reason } : {}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: keys.myAppointments })
			qc.invalidateQueries({ queryKey: ["admin-appointments"] })
			qc.invalidateQueries({ queryKey: ["availability"] })
		},
	})
}

// ── Admin Appointments ──────────────────────────────────────────────

export function useAdminAppointments(scope: "today" | "future") {
	return useQuery({
		queryKey: keys.adminAppointments(scope),
		queryFn: () => api.get<AdminAppointment[]>(`/admin/appointments?scope=${scope}`),
	})
}
