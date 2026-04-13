import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { ApiError, api } from "./api"
import type { LoginResponse, RegisterResponse, User } from "./types"

// ── Context shape ───────────────────────────────────────────────────

interface AuthState {
	user: User | null
	token: string | null
	isAuthenticated: boolean
	isLoading: boolean
}

interface AuthActions {
	login: (email: string, password: string) => Promise<User>
	register: (name: string, email: string, password: string) => Promise<void>
	logout: () => void
}

type AuthContextValue = AuthState & AuthActions

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────────────

const TOKEN_KEY = "token"
const USER_KEY = "user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Rehydrate from localStorage on mount
	useEffect(() => {
		const savedToken = localStorage.getItem(TOKEN_KEY)
		const savedUser = localStorage.getItem(USER_KEY)

		if (savedToken && savedUser) {
			try {
				setToken(savedToken)
				setUser(JSON.parse(savedUser))
			} catch {
				localStorage.removeItem(TOKEN_KEY)
				localStorage.removeItem(USER_KEY)
			}
		}
		setIsLoading(false)
	}, [])

	const persist = useCallback((t: string, u: User) => {
		localStorage.setItem(TOKEN_KEY, t)
		localStorage.setItem(USER_KEY, JSON.stringify(u))
		setToken(t)
		setUser(u)
	}, [])

	const login = useCallback(
		async (email: string, password: string): Promise<User> => {
			const data = await api.post<LoginResponse>("/auth/login", { email, password })
			persist(data.token, data.user)
			return data.user
		},
		[persist],
	)

	const register = useCallback(async (name: string, email: string, password: string) => {
		await api.post<RegisterResponse>("/auth/register", { name, email, password })
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY)
		localStorage.removeItem(USER_KEY)
		setToken(null)
		setUser(null)
	}, [])

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			token,
			isAuthenticated: !!token,
			isLoading,
			login,
			register,
			logout,
		}),
		[user, token, isLoading, login, register, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used within AuthProvider")
	return ctx
}

export { ApiError }
