import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	ArrowLeft,
	ArrowRight,
	Calendar as CalendarIcon,
	Check,
	Clock,
	Loader2,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError } from "@/lib/api"
import { useAvailability, useBarbers, useCreateAppointment, useSpecialties } from "@/lib/queries"
import type { Barber, Specialty } from "@/lib/types"

export function NewAppointment() {
	const navigate = useNavigate()
	const [step, setStep] = useState(1)
	const [selection, setSelection] = useState({
		specialty: null as Specialty | null,
		barber: null as Barber | null,
		date: undefined as Date | undefined,
		startAt: "" as string, // full ISO string from API slot
		timeLabel: "" as string, // display label like "08:00"
	})

	// Step 1: fetch specialties
	const { data: specialties = [], isLoading: loadingSpecs } = useSpecialties()

	// Step 2: fetch barbers filtered by specialty
	const { data: barbers = [], isLoading: loadingBarbers } = useBarbers(selection.specialty?.id)

	// Step 3: fetch availability for selected barber + date + specialty
	const dateStr = selection.date ? format(selection.date, "yyyy-MM-dd") : undefined
	const { data: availability, isLoading: loadingSlots } = useAvailability(
		selection.barber?.id,
		dateStr,
		selection.specialty?.id,
	)

	const createAppointment = useCreateAppointment()

	const handleConfirm = () => {
		if (!selection.specialty || !selection.barber || !selection.startAt) return

		createAppointment.mutate(
			{
				barberId: selection.barber.id,
				specialtyId: selection.specialty.id,
				startAt: selection.startAt,
			},
			{
				onSuccess: () => {
					toast.success("Agendamento realizado com sucesso!")
					navigate("/dashboard")
				},
				onError: (err) => {
					const message = err instanceof ApiError ? err.body.message : "Erro ao criar agendamento."
					toast.error(message)
				},
			},
		)
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					onClick={() => (step > 1 ? setStep(step - 1) : navigate("/dashboard"))}
				>
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
				<h1 className="font-bold text-3xl tracking-tight">
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
				<>
					{loadingSpecs ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-3">
							{specialties.map((spec) => (
								<Card
									key={spec.id}
									className={`cursor-pointer transition-all hover:border-primary ${selection.specialty?.id === spec.id ? "border-primary bg-primary/5" : ""}`}
									onClick={() => {
										setSelection({ ...selection, specialty: spec, barber: null })
										setStep(2)
									}}
								>
									<CardHeader>
										<CardTitle className="text-lg">{spec.name}</CardTitle>
										<CardDescription>
											{spec.description || "Atendimento especializado"}
										</CardDescription>
									</CardHeader>
									<CardContent className="flex justify-end">
										{selection.specialty?.id === spec.id && (
											<Check className="h-5 w-5 text-primary" />
										)}
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</>
			)}

			{step === 2 && (
				<>
					{loadingBarbers ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : barbers.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground">
							Nenhum barbeiro disponível para esta especialidade.
						</p>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{barbers.map((barber) => (
								<Card
									key={barber.id}
									className={`cursor-pointer transition-all hover:border-primary ${selection.barber?.id === barber.id ? "border-primary bg-primary/5" : ""}`}
									onClick={() => {
										setSelection({ ...selection, barber })
										setStep(3)
									}}
								>
									<CardHeader className="flex flex-row items-center gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-bold text-lg">
											{barber.name.charAt(0)}
										</div>
										<div>
											<CardTitle className="text-lg">{barber.name}</CardTitle>
											<CardDescription>{barber.age} anos</CardDescription>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-1">
											{barber.specialties.map((s) => (
												<Badge key={s.id} variant="secondary" className="text-[10px]">
													{s.name}
												</Badge>
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</>
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
								onSelect={(d) =>
									setSelection({ ...selection, date: d, startAt: "", timeLabel: "" })
								}
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
								{selection.date
									? format(selection.date, "PPPP", { locale: ptBR })
									: "Selecione uma data primeiro"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!selection.date ? (
								<p className="py-4 text-center text-muted-foreground text-sm">
									Selecione uma data para ver os horários.
								</p>
							) : loadingSlots ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : !availability || availability.slots.length === 0 ? (
								<p className="py-4 text-center text-muted-foreground text-sm">
									Nenhum horário disponível nesta data.
								</p>
							) : (
								<div className="grid grid-cols-3 gap-2">
									{availability.slots.map((slot) => {
										const label = new Date(slot.startAt).toLocaleTimeString("pt-BR", {
											hour: "2-digit",
											minute: "2-digit",
										})
										return (
											<Button
												key={slot.startAt}
												variant={selection.startAt === slot.startAt ? "default" : "outline"}
												className="text-xs"
												onClick={() =>
													setSelection({
														...selection,
														startAt: slot.startAt,
														timeLabel: label,
													})
												}
											>
												{label}
											</Button>
										)
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{step === 3 && selection.startAt && (
				<div className="fixed right-0 bottom-0 left-0 border-t bg-background p-4 md:relative md:border-t-0 md:bg-transparent md:p-0">
					<Card className="mx-auto max-w-lg bg-primary text-primary-foreground md:max-w-none">
						<CardContent className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row">
							<div>
								<p className="text-sm opacity-90">Resumo do Agendamento:</p>
								<p className="font-bold">
									{selection.specialty?.name} com {selection.barber?.name}
								</p>
								<p className="text-xs opacity-90">
									{selection.date && format(selection.date, "dd/MM/yyyy")} às {selection.timeLabel}
								</p>
							</div>
							<Button
								variant="secondary"
								size="lg"
								onClick={handleConfirm}
								disabled={createAppointment.isPending}
								className="w-full md:w-auto"
							>
								{createAppointment.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Confirmando...
									</>
								) : (
									<>
										Confirmar Agendamento
										<ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
