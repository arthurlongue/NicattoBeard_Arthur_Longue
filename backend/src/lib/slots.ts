const BUSINESS_START = 8
const BUSINESS_END = 18
const SLOT_MINUTES = 30
const TZ = "America/Sao_Paulo"

export interface Slot {
	startAt: string
	endAt: string
}

/**
 * Get the exact UTC offset in minutes for a given date in São Paulo.
 * Positive = ahead of UTC, negative = behind.
 */
function getSPOffsetMinutes(date: Date): number {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(date)

	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
	const isoLocalStr = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
	
	const mockUtcDate = new Date(`${isoLocalStr}Z`)
	return Math.round((mockUtcDate.getTime() - date.getTime()) / 60000)
}

/**
 * Format a Date to ISO 8601 with the São Paulo offset.
 */
export function toSaoPauloISO(date: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(date)

	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
	const iso = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`

	const offsetMin = getSPOffsetMinutes(date)
	const sign = offsetMin >= 0 ? "+" : "-"
	const absMin = Math.abs(offsetMin)
	const hh = String(Math.floor(absMin / 60)).padStart(2, "0")
	const mm = String(absMin % 60).padStart(2, "0")

	return `${iso}${sign}${hh}:${mm}`
}

/**
 * Get start of day in São Paulo as UTC Date.
 */
export function startOfDaySP(dateStr: string): Date {
	// Determine SP offset for noon on that date (avoids DST edge at midnight)
	const noonUTC = new Date(`${dateStr}T12:00:00Z`)
	const offsetMin = getSPOffsetMinutes(noonUTC)

	const [year, month, day] = dateStr.split("-").map(Number)
	// midnight SP = midnight UTC minus offset
	return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMin * 60000)
}

/**
 * Get end of day in São Paulo as UTC Date.
 */
export function endOfDaySP(dateStr: string): Date {
	const start = startOfDaySP(dateStr)
	return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

/**
 * Get today's date string in SP timezone (YYYY-MM-DD).
 */
function todaySP(): string {
	return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date())
}

/**
 * Generate available 30-min slots for a barber on a given date.
 * Filters out booked slots and past slots (if date is today).
 */
export function generateAvailableSlots(dateStr: string, bookedStartTimes: Date[]): Slot[] {
	const dayStart = startOfDaySP(dateStr)
	const now = new Date()
	const isToday = dateStr === todaySP()

	const bookedSet = new Set(bookedStartTimes.map((d) => d.getTime()))

	const slots: Slot[] = []

	for (let hour = BUSINESS_START; hour < BUSINESS_END; hour++) {
		for (const minute of [0, 30]) {
			const startMs = dayStart.getTime() + (hour * 60 + minute) * 60000
			const endMs = startMs + SLOT_MINUTES * 60000

			// Skip past slots if today
			if (isToday && startMs <= now.getTime()) continue

			// Skip booked slots
			if (bookedSet.has(startMs)) continue

			const startAt = new Date(startMs)
			const endAt = new Date(endMs)

			slots.push({
				startAt: toSaoPauloISO(startAt),
				endAt: toSaoPauloISO(endAt),
			})
		}
	}

	return slots
}

/**
 * Check if a given Date (considering its SP local time equivalent) is within business hours (08:00 - 17:30).
 */
export function isBusinessHour(date: Date): boolean {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		hour: "numeric",
		minute: "numeric",
		hour12: false,
	}).formatToParts(date)

	const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
	const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)

	if (hour < BUSINESS_START || hour >= BUSINESS_END) return false
	if (hour === BUSINESS_END - 1 && minute > 30) return false
	return true
}

/**
 * Check if a given Date's minute is aligned to 30-min slots.
 */
export function isValidSlotMinute(date: Date): boolean {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		minute: "numeric",
	}).formatToParts(date)

	const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
	return minute === 0 || minute === 30
}
