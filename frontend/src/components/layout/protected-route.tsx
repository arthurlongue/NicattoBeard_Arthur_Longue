import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"

interface ProtectedRouteProps {
	children: React.ReactNode
	requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading, user } = useAuth()
	const location = useLocation()

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		)
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	if (requiredRole && user?.role !== requiredRole) {
		const fallback = user?.role === "admin" ? "/admin" : "/dashboard"
		return <Navigate to={fallback} replace />
	}

	return <>{children}</>
}
