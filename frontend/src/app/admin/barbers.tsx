import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Barber, Specialty } from "@/lib/types";

const MOCK_SPECIALTIES: Specialty[] = [
	{ id: "1", name: "Corte Social", active: true },
	{ id: "2", name: "Barba Terapia", active: true },
	{ id: "3", name: "Degradê", active: true },
];

const MOCK_BARBERS: Barber[] = [
	{
		id: "1",
		name: "Arthur Longue",
		age: 28,
		hireDate: "2024-01-15",
		active: true,
		specialties: [MOCK_SPECIALTIES[0], MOCK_SPECIALTIES[2]],
	},
	{
		id: "2",
		name: "Diego Fernandes",
		age: 32,
		hireDate: "2023-11-20",
		active: true,
		specialties: [MOCK_SPECIALTIES[1]],
	},
];

export function AdminBarbers() {
	const [barbers, setBarbers] = useState<Barber[]>(MOCK_BARBERS);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		age: "",
		hireDate: new Date().toISOString().split("T")[0],
		selectedSpecialties: [] as string[],
	});

	const handleAdd = () => {
		if (!formData.name || !formData.age) return;

		const newBarber: Barber = {
			id: Math.random().toString(36).substr(2, 9),
			name: formData.name,
			age: Number(formData.age),
			hireDate: formData.hireDate,
			active: true,
			specialties: MOCK_SPECIALTIES.filter((s) =>
				formData.selectedSpecialties.includes(s.id),
			),
		};

		setBarbers([...barbers, newBarber]);
		setFormData({
			name: "",
			age: "",
			hireDate: new Date().toISOString().split("T")[0],
			selectedSpecialties: [],
		});
		setIsAddOpen(false);
	};

	const handleDelete = (id: string) => {
		setBarbers(barbers.filter((h) => h.id !== id));
	};

	const toggleSpecialty = (id: string) => {
		setFormData((prev) => ({
			...prev,
			selectedSpecialties: prev.selectedSpecialties.includes(id)
				? prev.selectedSpecialties.filter((s) => s !== id)
				: [...prev.selectedSpecialties, id],
		}));
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
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
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="Ex: João Silva"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="age">Idade</Label>
									<Input
										id="age"
										type="number"
										value={formData.age}
										onChange={(e) =>
											setFormData({ ...formData, age: e.target.value })
										}
										placeholder="25"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="hireDate">Data de Contratação</Label>
									<Input
										id="hireDate"
										type="date"
										value={formData.hireDate}
										onChange={(e) =>
											setFormData({ ...formData, hireDate: e.target.value })
										}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label>Especialidades</Label>
								<div className="grid grid-cols-2 gap-2 mt-2">
									{MOCK_SPECIALTIES.map((specialty) => (
										<div
											key={specialty.id}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`spec-${specialty.id}`}
												checked={formData.selectedSpecialties.includes(
													specialty.id,
												)}
												onCheckedChange={() => toggleSpecialty(specialty.id)}
											/>
											<label
												htmlFor={`spec-${specialty.id}`}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												{specialty.name}
											</label>
										</div>
									))}
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setIsAddOpen(false)}>
								Cancelar
							</Button>
							<Button onClick={handleAdd}>Cadastrar</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-md border bg-background">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Idade</TableHead>
							<TableHead>Especialidades</TableHead>
							<TableHead>Contratação</TableHead>
							<TableHead className="text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{barbers.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
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
									<TableCell>
										{new Date(barber.hireDate).toLocaleDateString("pt-BR")}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(barber.id)}
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
	);
}
