import { Outlet } from "react-router-dom"

export function AuthLayout() {
	return (
		<div className="flex flex-1 flex-col justify-center bg-muted/40">
			<Outlet />
		</div>
	)
}
