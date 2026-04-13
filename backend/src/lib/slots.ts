const BUSINESS_START = 8
const BUSINESS_END = 18
const SLOT_MINUTES = 30
const TZ = "America/Sao_Paulo"

export interface Slot {
	startAt: string
	endAt: string
}

/**
 * Format a Date to ISO 8601 with the São Paulo offset.
 */
export function toSaoPauloISO(date: Date): string {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	})

	const parts = formatter.formatToParts(date)
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""

	const iso = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`

	// Calculate offset
	const utcMs = date.getTime()
	const localStr = date.toLocaleString("en-US", { timeZone: TZ })
	const localMs = new Date(localStr).getTime()
	const offsetMin = Math.round((localMs - utcMs) / 60000)
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
	const [year, month, day] = dateStr.split("-").map(Number)
	// Create a date string at 00:00 in SP timezone and convert to UTC
	const spMidnight = new Date(`${dateStr}T00:00:00`)
	// Get the offset for that date in SP
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		timeZoneName: "shortOffset",
	})
	const formatted = formatter.format(new Date(`${dateStr}T12:00:00Z`))
	const match = formatted.match(/GMT([+-]\d+(?::\d+)?)/)
	const offsetStr = match?.[1] ?? "-3"
	const [offsetH, offsetM = "0"] = offsetStr.split(":").map(Number)
	const offsetMs = (offsetH * 60 + Math.sign(offsetH) * Number(offsetM)) * 60000

	// midnight SP in UTC
	const utc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
	return new Date(utc.getTime() - offsetMs)
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

	// Booked times as ISO strings for quick comparison
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
