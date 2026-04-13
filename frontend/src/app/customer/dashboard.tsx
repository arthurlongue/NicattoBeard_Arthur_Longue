import { Calendar, Clock, Loader2, Plus, XCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import { useCancelAppointment, useMyAppointments } from "@/lib/queries"
import type { CustomerAppointment } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"

export function CustomerDashboard() {
	const { data: appointments = [], isLoading } = useMyAppointments()
	const cancelMutation = useCancelAppointment()
	const isMobile = useIsMobile()

	const handleCancel = (app: CustomerAppointment) => {
		cancelMutation.mutate(
			{ id: app.id },
			{
				onSuccess: () => toast.success("Agendamento cancelado com sucesso."),
				onError: (err) => {
					const message =
						err instanceof ApiError ? err.body.message : "Erro ao cancelar agendamento."
					toast.error(message)
				},
			},
		)
	}

	const now = new Date()
	const upcoming = appointments.filter((a) => new Date(a.startAt) > now && a.status === "scheduled")
	const past = appointments.filter((a) => new Date(a.startAt) <= now || a.status === "cancelled")

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Meus Agendamentos</h1>
					<p className="mt-2 text-muted-foreground">
						Gerencie seus horários marcados na NicattoBeard.
					</p>
				</div>
				<Button render={<Link to="/dashboard/new" />}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Agendamento
				</Button>
			</div>

			<div className="space-y-4">
				<h2 className="flex items-center gap-2 font-semibold text-lg">
					<Clock className="h-5 w-5 text-primary" />
					Próximos Atendimentos
				</h2>
				{isMobile ? (
					<div className="space-y-3">
						{upcoming.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground">
								Você não possui agendamentos futuros.
							</p>
						) : (
							upcoming.map((app) => (
								<div key={app.id} className="rounded-lg border bg-background p-4 space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-medium">{app.specialty.name}</span>
										<Badge variant="default">Agendado</Badge>
									</div>
									<div className="text-muted-foreground text-sm space-y-1">
										<p>
											{new Date(app.startAt).toLocaleDateString("pt-BR")} às{" "}
											{new Date(app.startAt).toLocaleTimeString("pt-BR", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
										<p>Barbeiro: {app.barber.name}</p>
									</div>
									<AlertDialog>
										<AlertDialogTrigger
											render={
												<Button
													variant="outline"
													size="sm"
													className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
												/>
											}
										>
											<XCircle className="mr-2 h-4 w-4" />
											Cancelar
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Confirmar cancelamento?</AlertDialogTitle>
												<AlertDialogDescription>
													Esta ação não pode ser desfeita. O horário ficará disponível para outros
													clientes.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Voltar</AlertDialogCancel>
												<AlertDialogAction
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													onClick={() => handleCancel(app)}
												>
													Confirmar Cancelamento
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							))
						)}
					</div>
				) : (
					<div className="overflow-x-auto rounded-md border bg-background">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data e Hora</TableHead>
									<TableHead>Serviço</TableHead>
									<TableHead>Barbeiro</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{upcoming.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="h-24 text-center">
											Você não possui agendamentos futuros.
										</TableCell>
									</TableRow>
								) : (
									upcoming.map((app) => (
										<TableRow key={app.id}>
											<TableCell className="font-medium">
												{new Date(app.startAt).toLocaleDateString("pt-BR")} às{" "}
												{new Date(app.startAt).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</TableCell>
											<TableCell>{app.specialty.name}</TableCell>
											<TableCell>{app.barber.name}</TableCell>
											<TableCell>
												<Badge variant="default">Agendado</Badge>
											</TableCell>
											<TableCell className="text-right">
												<AlertDialog>
													<AlertDialogTrigger
														render={
															<Button
																variant="ghost"
																size="sm"
																className="text-destructive hover:bg-destructive/10 hover:text-destructive"
															/>
														}
													>
														<XCircle className="mr-2 h-4 w-4" />
														Cancelar
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Confirmar cancelamento?</AlertDialogTitle>
															<AlertDialogDescription>
																Esta ação não pode ser desfeita. O horário ficará disponível para
																outros clientes.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Voltar</AlertDialogCancel>
															<AlertDialogAction
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																onClick={() => handleCancel(app)}
															>
																Confirmar Cancelamento
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			<div className="space-y-4">
				<h2 className="flex items-center gap-2 font-semibold text-lg">
					<Calendar className="h-5 w-5 text-muted-foreground" />
					Histórico
				</h2>
				{isMobile ? (
					<div className="space-y-3 opacity-70">
						{past.length === 0 ? (
							<p className="py-4 text-center text-muted-foreground">
								Nenhum atendimento realizado anteriormente.
							</p>
						) : (
							past.map((app) => (
								<div key={app.id} className="rounded-lg border bg-background p-4 space-y-2">
									<div className="flex items-center justify-between">
										<span className="font-medium">{app.specialty.name}</span>
										<Badge variant={app.status === "cancelled" ? "destructive" : "secondary"}>
											{app.status === "cancelled" ? "Cancelado" : "Agendado"}
										</Badge>
									</div>
									<div className="text-muted-foreground text-sm">
										<p>
											{new Date(app.startAt).toLocaleDateString("pt-BR")} • {app.barber.name}
										</p>
									</div>
								</div>
							))
						)}
					</div>
				) : (
					<div className="overflow-x-auto rounded-md border bg-background opacity-70">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Data</TableHead>
									<TableHead>Serviço</TableHead>
									<TableHead>Barbeiro</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{past.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-16 text-center">
											Nenhum atendimento realizado anteriormente.
										</TableCell>
									</TableRow>
								) : (
									past.map((app) => (
										<TableRow key={app.id}>
											<TableCell>{new Date(app.startAt).toLocaleDateString("pt-BR")}</TableCell>
											<TableCell>{app.specialty.name}</TableCell>
											<TableCell>{app.barber.name}</TableCell>
											<TableCell>
												<Badge variant={app.status === "cancelled" ? "destructive" : "secondary"}>
													{app.status === "cancelled" ? "Cancelado" : "Agendado"}
												</Badge>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</div>
	)
}
