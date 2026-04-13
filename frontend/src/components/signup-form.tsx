import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ApiError, useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
	const navigate = useNavigate()
	const { register } = useAuth()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()

		if (password !== confirmPassword) {
			toast.error("As senhas não coincidem.")
			return
		}

		setIsSubmitting(true)

		try {
			await register(name, email, password)
			toast.success("Conta criada com sucesso! Faça login para continuar.")
			navigate("/login")
		} catch (err) {
			const message =
				err instanceof ApiError ? err.body.message : "Erro ao criar conta. Tente novamente."
			toast.error(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Card {...props}>
			<CardHeader>
				<CardTitle>Criar uma conta</CardTitle>
				<CardDescription>Insira suas informações abaixo para criar sua conta</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="name">Nome Completo</FieldLabel>
							<Input
								id="name"
								type="text"
								placeholder="João da Silva"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={isSubmitting}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="email">E-mail</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="email@exemplo.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isSubmitting}
							/>
							<FieldDescription>
								Usaremos isso para entrar em contato. Não compartilharemos seu e-mail com ninguém.
							</FieldDescription>
						</Field>
						<Field>
							<FieldLabel htmlFor="password">Senha</FieldLabel>
							<Input
								id="password"
								type="password"
								required
								minLength={8}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isSubmitting}
							/>
							<FieldDescription>Deve ter pelo menos 8 caracteres.</FieldDescription>
						</Field>
						<Field>
							<FieldLabel htmlFor="confirm-password">Confirmar Senha</FieldLabel>
							<Input
								id="confirm-password"
								type="password"
								required
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								disabled={isSubmitting}
							/>
							<FieldDescription>Por favor, confirme sua senha.</FieldDescription>
						</Field>
						<FieldGroup>
							<Field>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Criando..." : "Criar Conta"}
								</Button>
								<FieldDescription className="px-6 text-center">
									Já tem uma conta? <Link to="/login">Entre aqui</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	)
}
