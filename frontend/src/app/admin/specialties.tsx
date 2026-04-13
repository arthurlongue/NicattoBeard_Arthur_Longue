import { Loader2, Plus, Power, PowerOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useCreateSpecialty, useSpecialties, useUpdateSpecialty } from "@/lib/queries"

export function AdminSpecialties() {
	const { data: specialties = [], isLoading } = useSpecialties()
	const createMutation = useCreateSpecialty()
	const updateMutation = useUpdateSpecialty()

	const [isAddOpen, setIsAddOpen] = useState(false)
	const [newName, setNewName] = useState("")
	const [newDescription, setNewDescription] = useState("")

	const handleAdd = async () => {
		if (!newName.trim()) return

		createMutation.mutate(
			{ name: newName, description: newDescription },
			{
				onSuccess: () => {
					toast.success("Especialidade criada com sucesso!")
					setNewName("")
					setNewDescription("")
					setIsAddOpen(false)
				},
				onError: (err) => {
					const message = err instanceof ApiError ? err.body.message : "Erro ao criar especialidade."
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
					toast.success(`Especialidade ${!currentActive ? "ativada" : "desativada"} com sucesso.`)
				},
				onError: (err) => {
					const message = err instanceof ApiError ? err.body.message : "Erro ao atualizar especialidade."
					toast.error(message)
				},
			},
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Especialidades</h1>
					<p className="mt-2 text-muted-foreground">
						Gerencie os serviços oferecidos pela barbearia.
					</p>
				</div>
				<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
					<DialogTrigger render={<Button />}>
						<Plus className="mr-2 h-4 w-4" />
						Nova Especialidade
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Nova Especialidade</DialogTitle>
							<DialogDescription>
								Adicione uma nova especialidade de serviço ao catálogo.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Nome da Especialidade</Label>
								<Input
									id="name"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="Ex: Corte Moderno"
									disabled={createMutation.isPending}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="description">Descrição (opcional)</Label>
								<Input
									id="description"
									value={newDescription}
									onChange={(e) => setNewDescription(e.target.value)}
									placeholder="Ex: Corte com acabamento manual"
									disabled={createMutation.isPending}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={createMutation.isPending}>
								Cancelar
							</Button>
							<Button onClick={handleAdd} disabled={createMutation.isPending}>
								{createMutation.isPending ? "Salvando..." : "Salvar"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-md border bg-background">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									<Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
								</TableCell>
							</TableRow>
						) : specialties.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									Nenhuma especialidade cadastrada.
								</TableCell>
							</TableRow>
						) : (
							specialties.map((specialty) => (
								<TableRow key={specialty.id}>
									<TableCell className="font-medium">{specialty.name}</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{specialty.description || "-"}
									</TableCell>
									<TableCell>
										<Badge variant={specialty.active !== false ? "default" : "secondary"}>
											{specialty.active !== false ? "Ativo" : "Inativo"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleToggleActive(specialty.id, specialty.active !== false)}
											disabled={updateMutation.isPending}
											title={specialty.active !== false ? "Desativar" : "Ativar"}
										>
											{specialty.active !== false ? (
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
		</div>
	)
}
