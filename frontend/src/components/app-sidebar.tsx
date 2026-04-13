import { CalendarDays, LogOut, PlusCircle, Scissors, Users } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

const customerItems = [
	{ title: "Meus Agendamentos", url: "/dashboard", icon: CalendarDays },
	{ title: "Novo Agendamento", url: "/dashboard/new", icon: PlusCircle },
]

const adminItems = [
	{ title: "Agenda Geral", url: "/admin", icon: CalendarDays },
	{ title: "Barbeiros", url: "/admin/barbers", icon: Users },
	{ title: "Especialidades", url: "/admin/specialties", icon: Scissors },
]

export function AppSidebar({ userRole }: { userRole: "admin" | "customer" }) {
	const location = useLocation()
	const navigate = useNavigate()
	const { logout, user } = useAuth()
	const items = userRole === "admin" ? adminItems : customerItems

	const handleLogout = () => {
		logout()
		navigate("/login")
	}

	return (
		<Sidebar>
			<SidebarHeader className="p-4">
				<h2 className="font-bold text-lg">NicattoBeard</h2>
			</SidebarHeader>
			<Separator />
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										isActive={location.pathname === item.url}
										render={<Link to={item.url} />}
									>
										<item.icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="space-y-2 p-4">
				<span className="text-muted-foreground text-sm">
					{user?.name ?? (userRole === "admin" ? "Administrador" : "Cliente")}
				</span>
				<Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
					<LogOut className="mr-2 h-4 w-4" />
					Sair
				</Button>
			</SidebarFooter>
		</Sidebar>
	)
}
