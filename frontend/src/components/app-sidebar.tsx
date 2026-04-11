import { CalendarDays, PlusCircle, Scissors, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
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
	const items = userRole === "admin" ? adminItems : customerItems

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
			<SidebarFooter className="p-4">
				<span className="text-muted-foreground text-sm">
					Logado como {userRole === "admin" ? "Administrador" : "Cliente"}
				</span>
			</SidebarFooter>
		</Sidebar>
	)
}
