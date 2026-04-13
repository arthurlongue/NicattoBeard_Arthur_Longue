import { Calendar, CheckCircle2, Clock, Loader2, Users } from "lucide-react"
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
import { useAdminAppointments } from "@/lib/queries"

export function AdminDashboard() {
	const [scope, setScope] = useState<"today" | "future">("today")
	const { data: appointments = [], isLoading } = useAdminAppointments(scope)

	// Since we don't have a separate stats endpoint in the API contract,
	// we calculate stats based on the data we have for the current scope.
	// Note: For real stats, we might need a dedicated endpoint or fetch both scopes.
	// For now, let's just use what we have in view.
	const stats = {
		total: appointments.length,
		completed: appointments.filter(
			(a) => a.status === "scheduled" && new Date(a.endAt) < new Date(),
		).length, // Heuristic for v1
		future: scope === "future" ? appointments.length : 0,
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
						<CardTitle className="font-medium text-sm">Total no Período</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.total}</div>
						<p className="text-muted-foreground text-xs">agendamentos</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Escopo Atual</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-primary capitalize">
							{scope === "today" ? "Hoje" : "Futuro"}
						</div>
						<p className="text-muted-foreground text-xs">visão selecionada</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Status</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{appointments.filter((a) => a.status === "scheduled").length}
						</div>
						<p className="text-muted-foreground text-xs">ativos</p>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-4">
				<div className="flex border-b">
					<Button
						variant={scope === "today" ? "default" : "ghost"}
						className={`h-10 rounded-none border-b-2 px-4 ${scope === "today" ? "border-primary" : "border-transparent"}`}
						onClick={() => setScope("today")}
					>
						Hoje
					</Button>
					<Button
						variant={scope === "future" ? "default" : "ghost"}
						className={`h-10 rounded-none border-b-2 px-4 ${scope === "future" ? "border-primary" : "border-transparent"}`}
						onClick={() => setScope("future")}
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
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
									</TableCell>
								</TableRow>
							) : appointments.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										Nenhum agendamento encontrado para este período.
									</TableCell>
								</TableRow>
							) : (
								appointments.map((app) => (
									<TableRow key={app.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-muted-foreground" />
												{new Date(app.startAt).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
												})}
												{scope === "future" && (
													<span className="ml-1 text-muted-foreground text-xs">
														({new Date(app.startAt).toLocaleDateString("pt-BR")})
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="font-medium">{app.customer.name}</TableCell>
										<TableCell>{app.barber.name}</TableCell>
										<TableCell>{app.specialty.name}</TableCell>
										<TableCell>
											<Badge variant={app.status === "scheduled" ? "default" : "destructive"}>
												{app.status === "scheduled" ? "Agendado" : "Cancelado"}
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
