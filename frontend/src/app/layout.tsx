import { Outlet } from "react-router-dom"
import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout() {
	return (
		<TooltipProvider>
			<div className="flex min-h-screen flex-col">
				<Header />
				<main className="flex flex-1 flex-col">
					<Outlet />
				</main>
			</div>
			<Toaster />
		</TooltipProvider>
	)
}
