import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
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
import type { Specialty } from "@/lib/types"

const MOCK_SPECIALTIES: Specialty[] = [
	{ id: "1", name: "Corte Social", active: true },
	{ id: "2", name: "Barba Terapia", active: true },
	{ id: "3", name: "Degradê", active: true },
	{ id: "4", name: "Coloração", active: true },
]

export function AdminSpecialties() {
	const [specialties, setSpecialties] = useState<Specialty[]>(MOCK_SPECIALTIES)
	const [isAddOpen, setIsAddOpen] = useState(false)
	const [newName, setNewName] = useState("")

	const handleAdd = () => {
		if (!newName.trim()) return
		const newSpec: Specialty = {
			id: Math.random().toString(36).substr(2, 9),
			name: newName,
			active: true,
		}
		setSpecialties([...specialties, newSpec])
		setNewName("")
		setIsAddOpen(false)
	}

	const handleDelete = (id: string) => {
		setSpecialties(specialties.filter((s) => s.id !== id))
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
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsAddOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleAdd}>Salvar</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-md border bg-background">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{specialties.length === 0 ? (
							<TableRow>
								<TableCell colSpan={3} className="h-24 text-center">
									Nenhuma especialidade cadastrada.
								</TableCell>
							</TableRow>
						) : (
							specialties.map((specialty) => (
								<TableRow key={specialty.id}>
									<TableCell className="font-medium">{specialty.name}</TableCell>
									<TableCell>
										<Badge variant={specialty.active ? "default" : "secondary"}>
											{specialty.active ? "Ativo" : "Inativo"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(specialty.id)}
											className="text-destructive hover:bg-destructive/10 hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
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
