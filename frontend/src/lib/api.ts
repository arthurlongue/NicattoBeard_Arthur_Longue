// ── Thin fetch wrapper with JWT injection ───────────────────────────

const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "")

function getToken(): string | null {
	return localStorage.getItem("token")
}

/** Standard error shape returned by the backend */
export interface ApiErrorBody {
	error: string
	message: string
	details?: Record<string, unknown>
}

export class ApiError extends Error {
	status: number
	body: ApiErrorBody

	constructor(status: number, body: ApiErrorBody) {
		super(body.message)
		this.name = "ApiError"
		this.status = status
		this.body = body
	}
}

type ParsedBody =
	| { kind: "empty" }
	| { kind: "json"; value: unknown }
	| { kind: "text"; value: string }

function isApiErrorBody(value: unknown): value is ApiErrorBody {
	if (!value || typeof value !== "object") return false

	const maybeError = value as Record<string, unknown>
	return typeof maybeError.error === "string" && typeof maybeError.message === "string"
}

async function parseBody(res: Response): Promise<ParsedBody> {
	const raw = await res.text()

	if (!raw) {
		return { kind: "empty" }
	}

	const contentType = res.headers.get("content-type") || ""

	if (contentType.includes("application/json")) {
		try {
			return { kind: "json", value: JSON.parse(raw) }
		} catch {
			return { kind: "text", value: raw }
		}
	}

	return { kind: "text", value: raw }
}

function textToMessage(text: string): string {
	const trimmed = text.trim()

	if (!trimmed) {
		return "API retornou erro sem corpo."
	}

	if (trimmed.includes("<html") || trimmed.includes("<!DOCTYPE")) {
		return "API retornou HTML em vez de JSON. Verifique rota, proxy ou VITE_API_BASE_URL."
	}

	return trimmed
}

function buildHttpErrorBody(res: Response, parsed: ParsedBody): ApiErrorBody {
	if (parsed.kind === "json" && isApiErrorBody(parsed.value)) {
		return parsed.value
	}

	if (parsed.kind === "text") {
		return {
			error: res.statusText || "HTTP_ERROR",
			message: textToMessage(parsed.value),
		}
	}

	return {
		error: res.statusText || "HTTP_ERROR",
		message: `Requisição falhou com status ${res.status}.`,
	}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	}

	const token = getToken()
	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	let res: Response

	try {
		res = await fetch(`${BASE}${path}`, {
			method,
			headers,
			body: body != null ? JSON.stringify(body) : undefined,
		})
	} catch (error) {
		throw new ApiError(0, {
			error: "NETWORK_ERROR",
			message: "Falha de conexão com a API. Verifique backend, proxy e CORS.",
			...(error instanceof Error ? { details: { cause: error.message } } : {}),
		})
	}

	// 204 No Content
	if (res.status === 204) return undefined as T

	const parsed = await parseBody(res)

	if (!res.ok) {
		throw new ApiError(res.status, buildHttpErrorBody(res, parsed))
	}

	if (parsed.kind !== "json") {
		throw new ApiError(res.status, {
			error: "INVALID_RESPONSE",
			message: "API retornou resposta inválida. Esperado JSON.",
			...(parsed.kind === "text" ? { details: { response: textToMessage(parsed.value) } } : {}),
		})
	}

	return parsed.value as T
}

export const api = {
	get: <T>(path: string) => request<T>("GET", path),
	post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
	patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
	put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
}
