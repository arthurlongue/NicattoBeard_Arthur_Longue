import { Navigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export function GuestRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading, user } = useAuth()

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		)
	}

	if (isAuthenticated) {
		const destination = user?.role === "admin" ? "/admin" : "/dashboard"
		return <Navigate to={destination} replace />
	}

	return <>{children}</>
}
