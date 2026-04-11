export type UserRole = "admin" | "customer";

export interface Specialty {
	id: string;
	name: string;
	active: boolean;
}

export interface Barber {
	id: string;
	name: string;
	age: number;
	hireDate: string;
	active: boolean;
	specialties: Specialty[];
}

export type AppointmentStatus = "scheduled" | "cancelled" | "completed";

export interface Appointment {
	id: string;
	customerId: string;
	customerName: string;
	barberId: string;
	barberName: string;
	specialtyId: string;
	specialtyName: string;
	date: string; // ISO 8601
	status: AppointmentStatus;
}
