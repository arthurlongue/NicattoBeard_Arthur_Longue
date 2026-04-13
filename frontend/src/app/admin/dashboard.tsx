import { Calendar, CheckCircle2, Clock, Users } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { Appointment } from "@/lib/types"

const MOCK_APPOINTMENTS: Appointment[] = [
	{
		id: "1",
		customerId: "c1",
		customerName: "Lucas Ferreira",
		barberId: "b1",
		barberName: "Arthur Longue",
		specialtyId: "s1",
		specialtyName: "Degradê",
		date: new Date().toISOString(), // Hoje
		status: "scheduled",
	},
	{
		id: "2",
		customerId: "c2",
		customerName: "Gabriel Santos",
		barberId: "b2",
		barberName: "Diego Fernandes",
		specialtyId: "s2",
		specialtyName: "Barba Terapia",
		date: new Date().toISOString(), // Hoje
		status: "completed",
	},
	{
		id: "3",
		customerId: "c3",
		customerName: "Rafael Oliveira",
		barberId: "b1",
		barberName: "Arthur Longue",
		specialtyId: "s3",
		specialtyName: "Corte Social",
		date: new Date(Date.now() + 86400000).toISOString(), // Amanhã
		status: "scheduled",
	},
]

export function AdminDashboard() {
	const [view, setView] = useState<"today" | "future">("today")

	const today = new Date().toISOString().split("T")[0]
	const filteredAppointments = MOCK_APPOINTMENTS.filter((app) => {
		const appDate = app.date.split("T")[0]
		return view === "today" ? appDate === today : appDate > today
	})

	const stats = {
		totalToday: MOCK_APPOINTMENTS.filter((a) => a.date.split("T")[0] === today).length,
		completedToday: MOCK_APPOINTMENTS.filter(
			(a) => a.date.split("T")[0] === today && a.status === "completed",
		).length,
		future: MOCK_APPOINTMENTS.filter((a) => a.date.split("T")[0] > today).length,
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Agenda Geral</h1>
				<p className="mt-2 text-muted-foreground">
					Acompanhe o movimento da barbearia em tempo real.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total de Hoje</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalToday}</div>
						<p className="text-muted-foreground text-xs">atendimentos</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Concluídos</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">{stats.completedToday}</div>
						<p className="text-muted-foreground text-xs">atendimentos</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Pendentes/Futuros</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.future}</div>
						<p className="text-muted-foreground text-xs">agendamentos salvos</p>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-4">
				<div className="flex border-b">
					<Button
						variant={view === "today" ? "default" : "ghost"}
						className={`h-10 rounded-none border-b-2 px-4 ${view === "today" ? "border-primary" : "border-transparent"}`}
						onClick={() => setView("today")}
					>
						Hoje
					</Button>
					<Button
						variant={view === "future" ? "default" : "ghost"}
						className={`h-10 rounded-none border-b-2 px-4 ${view === "future" ? "border-primary" : "border-transparent"}`}
						onClick={() => setView("future")}
					>
						Próximos Dias
					</Button>
				</div>

				<div className="rounded-md border bg-background">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Horário</TableHead>
								<TableHead>Cliente</TableHead>
								<TableHead>Barbeiro</TableHead>
								<TableHead>Serviço</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAppointments.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										Nenhum agendamento encontrado para este período.
									</TableCell>
								</TableRow>
							) : (
								filteredAppointments.map((app) => (
									<TableRow key={app.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-muted-foreground" />
												{new Date(app.date).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
												})}
												{view === "future" && (
													<span className="ml-1 text-muted-foreground text-xs">
														({new Date(app.date).toLocaleDateString("pt-BR")})
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="font-medium">{app.customerName}</TableCell>
										<TableCell>{app.barberName}</TableCell>
										<TableCell>{app.specialtyName}</TableCell>
										<TableCell>
											<Badge
												variant={
													app.status === "scheduled"
														? "default"
														: app.status === "completed"
															? "secondary"
															: "destructive"
												}
											>
												{app.status === "scheduled"
													? "Agendado"
													: app.status === "completed"
														? "Concluído"
														: "Cancelado"}
											</Badge>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	)
}
