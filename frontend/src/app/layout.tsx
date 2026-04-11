import { Outlet } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Header } from "@/components/layout/header"

export default function RootLayout() {
	return (
		<TooltipProvider>
			<div className="flex min-h-screen flex-col">
				<Header />
				<main className="flex flex-1 flex-col">
					<Outlet />
				</main>
			</div>
		</TooltipProvider>
	)
}
