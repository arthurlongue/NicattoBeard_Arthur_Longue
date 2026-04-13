import { Loader2, Power, PowerOff, UserPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBarbers, useCreateBarber, useSpecialties, useUpdateBarber } from "@/lib/queries"

function getTodayDateInputValue() {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Sao_Paulo",
	}).format(new Date())
}

export function AdminBarbers() {
	const isMobile = useIsMobile()
	const { data: barbers = [], isLoading: loadingBarbers } = useBarbers()
	const { data: specialties = [], isLoading: loadingSpecs } = useSpecialties()

	const createMutation = useCreateBarber()
	const updateMutation = useUpdateBarber()

	const [isAddOpen, setIsAddOpen] = useState(false)
	const [formData, setFormData] = useState({
		name: "",
		age: "",
		hireDate: getTodayDateInputValue(),
		selectedSpecialties: [] as number[],
	})

	const handleAdd = () => {
		if (!formData.name || !formData.age || formData.selectedSpecialties.length === 0) {
			toast.error("Preencha todos os campos e selecione ao menos uma especialidade.")
			return
		}

		createMutation.mutate(
			{
				name: formData.name,
				age: Number(formData.age),
				hireDate: formData.hireDate,
				specialtyIds: formData.selectedSpecialties,
			},
			{
				onSuccess: () => {
					toast.success("Barbeiro cadastrado com sucesso!")
					setFormData({
						name: "",
						age: "",
						hireDate: getTodayDateInputValue(),
						selectedSpecialties: [],
					})
					setIsAddOpen(false)
				},
				onError: (err) => {
					const message = err instanceof ApiError ? err.body.message : "Erro ao cadastrar barbeiro."
					toast.error(message)
				},
			},
		)
	}

	const handleToggleActive = (id: number, currentActive: boolean) => {
		updateMutation.mutate(
			{ id, active: !currentActive },
			{
				onSuccess: () => {
					toast.success(`Barbeiro ${!currentActive ? "ativado" : "desativado"} com sucesso.`)
				},
				onError: (err) => {
					const message = err instanceof ApiError ? err.body.message : "Erro ao atualizar barbeiro."
					toast.error(message)
				},
			},
		)
	}

	const toggleSpecialty = (id: number) => {
		setFormData((prev) => ({
			...prev,
			selectedSpecialties: prev.selectedSpecialties.includes(id)
				? prev.selectedSpecialties.filter((s) => s !== id)
				: [...prev.selectedSpecialties, id],
		}))
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Barbeiros</h1>
					<p className="mt-2 text-muted-foreground">
						Gerencie a equipe de profissionais da barbearia.
					</p>
				</div>
				<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
					<DialogTrigger render={<Button />}>
						<UserPlus className="mr-2 h-4 w-4" />
						Novo Barbeiro
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Novo Barbeiro</DialogTitle>
							<DialogDescription>
								Cadastre um novo profissional e suas especialidades.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Nome Completo</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									placeholder="Ex: João Silva"
									disabled={createMutation.isPending}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="age">Idade</Label>
									<Input
										id="age"
										type="number"
										value={formData.age}
										onChange={(e) => setFormData({ ...formData, age: e.target.value })}
										placeholder="25"
										disabled={createMutation.isPending}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="hireDate">Data de Contratação</Label>
									<Input
										id="hireDate"
										type="date"
										value={formData.hireDate}
										onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
										disabled={createMutation.isPending}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Especialidades</Label>
								{loadingSpecs ? (
									<div className="flex items-center justify-center p-4">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								) : (
									<div className="mt-2 grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto pr-2">
										{specialties.map((specialty) => (
											<div key={specialty.id} className="flex items-center space-x-2">
												<Checkbox
													id={`spec-${specialty.id}`}
													checked={formData.selectedSpecialties.includes(specialty.id)}
													onCheckedChange={() => toggleSpecialty(specialty.id)}
													disabled={createMutation.isPending}
												/>
												<label
													htmlFor={`spec-${specialty.id}`}
													className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{specialty.name}
												</label>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsAddOpen(false)}
								disabled={createMutation.isPending}
							>
								Cancelar
							</Button>
							<Button onClick={handleAdd} disabled={createMutation.isPending}>
								{createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{isMobile ? (
				<div className="space-y-3">
					{loadingBarbers ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : barbers.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground">Nenhum barbeiro cadastrado.</p>
					) : (
						barbers.map((barber) => (
							<div key={barber.id} className="rounded-lg border bg-background p-4 space-y-3">
								<div className="flex items-center justify-between">
									<span className="font-medium">{barber.name}</span>
									<div className="flex items-center gap-2">
										<Badge variant={barber.active !== false ? "default" : "secondary"}>
											{barber.active !== false ? "Ativo" : "Inativo"}
										</Badge>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleToggleActive(barber.id, barber.active !== false)}
											disabled={updateMutation.isPending}
											aria-label={barber.active !== false ? "Desativar" : "Ativar"}
										>
											{barber.active !== false ? (
												<PowerOff className="h-4 w-4 text-destructive" />
											) : (
												<Power className="h-4 w-4 text-primary" />
											)}
										</Button>
									</div>
								</div>
								<div className="text-muted-foreground text-sm space-y-1">
									<p>
										{barber.age} anos • Desde{" "}
										{new Date(barber.hireDate).toLocaleDateString("pt-BR")}
									</p>
									<div className="flex flex-wrap gap-1">
										{barber.specialties.map((s) => (
											<Badge key={s.id} variant="secondary">
												{s.name}
											</Badge>
										))}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			) : (
				<div className="overflow-x-auto rounded-md border bg-background">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>Idade</TableHead>
								<TableHead>Especialidades</TableHead>
								<TableHead>Contratação</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loadingBarbers ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
									</TableCell>
								</TableRow>
							) : barbers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										Nenhum barbeiro cadastrado.
									</TableCell>
								</TableRow>
							) : (
								barbers.map((barber) => (
									<TableRow key={barber.id}>
										<TableCell className="font-medium">{barber.name}</TableCell>
										<TableCell>{barber.age} anos</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1">
												{barber.specialties.map((s) => (
													<Badge key={s.id} variant="secondary">
														{s.name}
													</Badge>
												))}
											</div>
										</TableCell>
										<TableCell>{new Date(barber.hireDate).toLocaleDateString("pt-BR")}</TableCell>
										<TableCell>
											<Badge variant={barber.active !== false ? "default" : "secondary"}>
												{barber.active !== false ? "Ativo" : "Inativo"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleToggleActive(barber.id, barber.active !== false)}
												disabled={updateMutation.isPending}
												title={barber.active !== false ? "Desativar" : "Ativar"}
												aria-label={barber.active !== false ? "Desativar" : "Ativar"}
											>
												{barber.active !== false ? (
													<PowerOff className="h-4 w-4 text-destructive" />
												) : (
													<Power className="h-4 w-4 text-primary" />
												)}
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	)
}
