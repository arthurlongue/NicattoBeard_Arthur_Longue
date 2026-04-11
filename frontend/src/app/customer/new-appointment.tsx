import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Barber, Specialty } from "@/lib/types";

const MOCK_SPECIALTIES: Specialty[] = [
	{ id: "s1", name: "Corte Social", active: true },
	{ id: "s2", name: "Barba Terapia", active: true },
	{ id: "s3", name: "Degradê", active: true },
];

const MOCK_BARBERS: Barber[] = [
	{
		id: "b1",
		name: "Arthur Longue",
		age: 28,
		hireDate: "2024-01-15",
		active: true,
		specialties: [MOCK_SPECIALTIES[0], MOCK_SPECIALTIES[2]],
	},
	{
		id: "b2",
		name: "Diego Fernandes",
		age: 32,
		hireDate: "2023-11-20",
		active: true,
		specialties: [MOCK_SPECIALTIES[1]],
	},
];

const TIME_SLOTS = [
	"08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
	"11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
	"15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export function NewAppointment() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1);
	const [selection, setSelection] = useState({
		specialty: null as Specialty | null,
		barber: null as Barber | null,
		date: undefined as Date | undefined,
		time: "" as string,
	});

	const handleConfirm = () => {
		toast.success("Agendamento realizado com sucesso!");
		navigate("/dashboard");
	};

	const filteredBarbers = MOCK_BARBERS.filter((barber) =>
		selection.specialty ? barber.specialties.some((s) => s.id === selection.specialty?.id) : true
	);

	return (
		<div className="max-w-4xl mx-auto space-y-8">
			<div className="flex items-center justify-between">
				<Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div className="flex items-center gap-2">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`h-2 w-12 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`}
						/>
					))}
				</div>
			</div>

			<div className="text-center">
				<h1 className="text-3xl font-bold tracking-tight">
					{step === 1 && "Selecione o Serviço"}
					{step === 2 && "Escolha o Profissional"}
					{step === 3 && "Data e Horário"}
				</h1>
				<p className="mt-2 text-muted-foreground">
					{step === 1 && "Qual procedimento você deseja realizar hoje?"}
					{step === 2 && "Temos profissionais especializados para cada serviço."}
					{step === 3 && "Selecione o melhor momento para seu atendimento."}
				</p>
			</div>

			{step === 1 && (
				<div className="grid gap-4 md:grid-cols-3">
					{MOCK_SPECIALTIES.map((spec) => (
						<Card
							key={spec.id}
							className={`cursor-pointer transition-all hover:border-primary ${selection.specialty?.id === spec.id ? "border-primary bg-primary/5" : ""}`}
							onClick={() => {
								setSelection({ ...selection, specialty: spec, barber: null });
								setStep(2);
							}}
						>
							<CardHeader>
								<CardTitle className="text-lg">{spec.name}</CardTitle>
								<CardDescription>Atendimento especializado</CardDescription>
							</CardHeader>
							<CardContent className="flex justify-end">
								{selection.specialty?.id === spec.id && <Check className="h-5 w-5 text-primary" />}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{step === 2 && (
				<div className="grid gap-4 md:grid-cols-2">
					{filteredBarbers.map((barber) => (
						<Card
							key={barber.id}
							className={`cursor-pointer transition-all hover:border-primary ${selection.barber?.id === barber.id ? "border-primary bg-primary/5" : ""}`}
							onClick={() => {
								setSelection({ ...selection, barber });
								setStep(3);
							}}
						>
							<CardHeader className="flex flex-row items-center gap-4">
								<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
									{barber.name.charAt(0)}
								</div>
								<div>
									<CardTitle className="text-lg">{barber.name}</CardTitle>
									<CardDescription>{barber.age} anos</CardDescription>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-1">
									{barber.specialties.map(s => (
										<Badge key={s.id} variant="secondary" className="text-[10px]">{s.name}</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{step === 3 && (
				<div className="grid gap-8 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CalendarIcon className="h-5 w-5" />
								Data
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Calendar
								mode="single"
								selected={selection.date}
								onSelect={(d) => setSelection({ ...selection, date: d })}
								className="rounded-md border"
								locale={ptBR}
								disabled={(date) => date < new Date() || date.getDay() === 0}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Horários Disponíveis
							</CardTitle>
							<CardDescription>
								{selection.date ? format(selection.date, "PPPP", { locale: ptBR }) : "Selecione uma data primeiro"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-2">
								{TIME_SLOTS.map((slot) => (
									<Button
										key={slot}
										variant={selection.time === slot ? "default" : "outline"}
										className="text-xs"
										onClick={() => setSelection({ ...selection, time: slot })}
										disabled={!selection.date}
									>
										{slot}
									</Button>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{step === 3 && selection.time && (
				<div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:relative md:bg-transparent md:border-t-0 md:p-0">
					<Card className="bg-primary text-primary-foreground max-w-lg mx-auto md:max-w-none">
						<CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
							<div>
								<p className="text-sm opacity-90">Resumo do Agendamento:</p>
								<p className="font-bold">
									{selection.specialty?.name} com {selection.barber?.name}
								</p>
								<p className="text-xs opacity-90">
									{selection.date && format(selection.date, "dd/MM/yyyy")} às {selection.time}
								</p>
							</div>
							<Button variant="secondary" size="lg" onClick={handleConfirm} className="w-full md:w-auto">
								Confirmar Agendamento
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
