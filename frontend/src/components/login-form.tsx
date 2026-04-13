import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ApiError, useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)

		try {
			const user = await login(email, password)
			toast.success("Login realizado com sucesso!")
			navigate(user.role === "admin" ? "/admin" : "/dashboard")
		} catch (err) {
			const message =
				err instanceof ApiError ? err.body.message : "Erro ao fazer login. Tente novamente."
			toast.error(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Acesse sua conta</CardTitle>
					<CardDescription>Insira seu e-mail abaixo para acessar sua conta</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isSubmitting}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Senha</FieldLabel>
								<Input
									id="password"
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isSubmitting}
								/>
							</Field>
							<Field>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? "Entrando..." : "Entrar"}
								</Button>
								<FieldDescription className="text-center">
									Não tem uma conta? <Link to="/signup">Cadastre-se</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
