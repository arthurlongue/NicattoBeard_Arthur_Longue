import { Outlet } from "react-router-dom"

export function AuthLayout() {
	return (
		<div className="flex min-h-screen flex-col justify-center bg-muted/40">
			<Outlet />
		</div>
	)
}
