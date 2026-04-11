import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Acesse sua conta</CardTitle>
					<CardDescription>Insira seu e-mail abaixo para acessar sua conta</CardDescription>
				</CardHeader>
				<CardContent>
					<form>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input id="email" type="email" placeholder="m@example.com" required />
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">Senha</FieldLabel>
									<button
										type="button"
										className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
									>
										Esqueceu sua senha?
									</button>
								</div>
								<Input id="password" type="password" required />
							</Field>
							<Field>
								<Button type="submit">Entrar</Button>
								<Button variant="outline" type="button">
									Entrar com Google
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
