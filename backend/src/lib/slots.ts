const BUSINESS_START = 8
const BUSINESS_END = 18
const SLOT_MINUTES = 30
const TZ = "America/Sao_Paulo"
export const MAX_BOOKING_DAYS_AHEAD = 90

export interface Slot {
	startAt: string
	endAt: string
}

/**
 * Format a Date to YYYY-MM-DD in São Paulo timezone.
 */
export function dateStringSP(date: Date): string {
	return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date)
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
 * Accurately handles historical DST transitions where local midnight was skipped or repeated.
 */
export function startOfDaySP(dateStr: string): Date {
	const [year, month, day] = dateStr.split("-").map(Number)
	
	const rawMidnightUTC = Date.UTC(year, month - 1, day, 0, 0, 0, 0)
	// Guess offset using 03:00 UTC (safe fallback since SP is UTC-3 or UTC-2)
	const guessUTC = new Date(rawMidnightUTC + 3 * 3600000)
	const offsetMin = getSPOffsetMinutes(guessUTC)
	
	let startUTC = new Date(rawMidnightUTC - offsetMin * 60000)
	
	// If midnight was skipped (e.g. spring forward 00:00 -> 01:00), format will shift to prev day.
	// We correct it by incrementing/decrementing hour until it matches requested local day.
	const startStr = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(startUTC)
	if (startStr < dateStr) {
		startUTC = new Date(startUTC.getTime() + 60 * 60000)
	} else if (startStr > dateStr) {
		startUTC = new Date(startUTC.getTime() - 60 * 60000)
	}
	
	return startUTC
}

/**
 * Get end of day in São Paulo as UTC Date.
 * Accurately handles historical DST days that are 23 or 25 hours long.
 */
export function endOfDaySP(dateStr: string): Date {
	const [year, month, day] = dateStr.split("-").map(Number)
	// End of day is precisely the start of the next day
	const nextDayUTC = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
	const nextDayStr = nextDayUTC.toISOString().split("T")[0]
	return startOfDaySP(nextDayStr)
}

/**
 * Get today's date string in SP timezone (YYYY-MM-DD).
 */
export function todaySP(): string {
	return dateStringSP(new Date())
}

/**
 * Get the last date allowed for booking/availability queries in SP timezone.
 */
export function maxBookingDateSP(daysAhead = MAX_BOOKING_DAYS_AHEAD): string {
	const [year, month, day] = todaySP().split("-").map(Number)
	const base = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
	base.setUTCDate(base.getUTCDate() + daysAhead)
	return dateStringSP(base)
}

/**
 * Check whether a YYYY-MM-DD date falls within the supported booking window.
 */
export function isWithinBookingWindowSP(
	dateStr: string,
	daysAhead = MAX_BOOKING_DAYS_AHEAD,
): boolean {
	const today = todaySP()
	const maxDate = maxBookingDateSP(daysAhead)
	return dateStr >= today && dateStr <= maxDate
}

/**
 * Generate available 30-min slots for a barber on a given date.
 * Filters out booked slots and past slots (if date is today).
 */
export function generateAvailableSlots(dateStr: string, bookedStartTimes: Date[]): Slot[] {
	const now = new Date()
	const isToday = dateStr === todaySP()

	const bookedSet = new Set(bookedStartTimes.map((d) => d.getTime()))

	const slots: Slot[] = []
	const [year, month, day] = dateStr.split("-").map(Number)

	// Business hours fall safely in the middle of the day, so noon offset applies perfectly
	const noonUTC = new Date(Date.UTC(year, month - 1, day, 15, 0, 0))
	const offsetMin = getSPOffsetMinutes(noonUTC)

	for (let hour = BUSINESS_START; hour < BUSINESS_END; hour++) {
		for (const minute of [0, 30]) {
			// Calculate exact UTC start time for this slot, using the day's constant business hours offset
			const localTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
			const startMs = localTimeAsUtc - offsetMin * 60000
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
