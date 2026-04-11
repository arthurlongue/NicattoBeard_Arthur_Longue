import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Appointment } from "@/lib/types";

const MOCK_USER_APPOINTMENTS: Appointment[] = [
	{
		id: "1",
		customerId: "user-123",
		customerName: "Você",
		barberId: "b1",
		barberName: "Arthur Longue",
		specialtyId: "s1",
		specialtyName: "Corte Social",
		date: new Date(Date.now() + 3600000 * 3).toISOString(), // Em 3 horas
		status: "scheduled",
	},
	{
		id: "2",
		customerId: "user-123",
		customerName: "Você",
		barberId: "b2",
		barberName: "Diego Fernandes",
		specialtyId: "s2",
		specialtyName: "Barba Terapia",
		date: new Date(Date.now() - 86400000).toISOString(), // Ontem
		status: "completed",
	},
];

export function CustomerDashboard() {
	const [appointments, setAppointments] = useState<Appointment[]>(
		MOCK_USER_APPOINTMENTS,
	);

	const handleCancel = (id: string) => {
		const app = appointments.find((a) => a.id === id);
		if (!app) return;

		const appDate = new Date(app.date);
		const now = new Date();
		const diffInHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 2) {
			toast.error(
				"Cancelamento bloqueado: Horário deve ser cancelado com no mínimo 2 horas de antecedência.",
			);
			return;
		}

		setAppointments(
			appointments.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
		);
		toast.success("Agendamento cancelado com sucesso.");
	};

	const upcoming = appointments.filter((a) => new Date(a.date) > new Date());
	const past = appointments.filter((a) => new Date(a.date) <= new Date());

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Meus Agendamentos
					</h1>
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
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<Clock className="h-5 w-5 text-primary" />
					Próximos Atendimentos
				</h2>
				<div className="rounded-md border bg-background">
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
											{new Date(app.date).toLocaleDateString("pt-BR")} às{" "}
											{new Date(app.date).toLocaleTimeString("pt-BR", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</TableCell>
										<TableCell>{app.specialtyName}</TableCell>
										<TableCell>{app.barberName}</TableCell>
										<TableCell>
											<Badge
												variant={
													app.status === "scheduled" ? "default" : "destructive"
												}
											>
												{app.status === "scheduled" ? "Agendado" : "Cancelado"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											{app.status === "scheduled" && (
												<AlertDialog>
													<AlertDialogTrigger render={<Button
															variant="ghost"
															size="sm"
															className="text-destructive hover:text-destructive hover:bg-destructive/10"
														/>}
													>
														<XCircle className="mr-2 h-4 w-4" />
														Cancelar
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Confirmar cancelamento?
															</AlertDialogTitle>
															<AlertDialogDescription>
																Esta ação não pode ser desfeita. O horário
																ficará disponível para outros clientes.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Voltar</AlertDialogCancel>
															<AlertDialogAction
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																onClick={() => handleCancel(app.id)}
															>
																Confirmar Cancelamento
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<div className="space-y-4">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<Calendar className="h-5 w-5 text-muted-foreground" />
					Histórico
				</h2>
				<div className="rounded-md border bg-background opacity-70">
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
										<TableCell>
											{new Date(app.date).toLocaleDateString("pt-BR")}
										</TableCell>
										<TableCell>{app.specialtyName}</TableCell>
										<TableCell>{app.barberName}</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{app.status === "completed"
													? "Concluído"
													: app.status === "cancelled"
														? "Cancelado"
														: "Agendado"}
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
	);
}
