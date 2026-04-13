import { Outlet } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "../app-sidebar"

export function DashboardLayout() {
	const { user } = useAuth()
	const userRole = user?.role ?? "customer"

	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full">
				<AppSidebar userRole={userRole} />
				<main className="w-full flex-1 bg-muted/40">
					<div className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
						<SidebarTrigger />
						<div className="w-full flex-1"></div>
					</div>
					<div className="p-4 lg:p-6">
						<Outlet />
					</div>
				</main>
			</div>
		</SidebarProvider>
	)
}
