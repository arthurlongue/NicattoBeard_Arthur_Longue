import { CalendarDays } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function HomePage() {
	return (
		<div className="flex flex-1 flex-col bg-muted/40">
			<main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center md:px-6 md:py-16 lg:py-24">
				<div className="max-w-[800px] space-y-4">
					<h1 className="font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
						A sua barbearia de confiança, agora digital.
					</h1>
					<p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
						Agende seu horário com os melhores profissionais na NicattoBeard sem complicações.
					</p>
					<div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
						<Button render={<Link to="/signup" />} size="lg" className="w-full sm:w-auto">
							<CalendarDays className="mr-2 h-5 w-5" />
							Agendar agora
						</Button>
						<Button
							render={<Link to="/login" />}
							variant="outline"
							size="lg"
							className="w-full sm:w-auto"
						>
							Já tenho conta
						</Button>
					</div>
				</div>
			</main>
			<footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t bg-background px-4 py-4 sm:flex-row md:px-6">
				<p className="text-muted-foreground text-xs">
					© 2026 NicattoBeard. Todos os direitos reservados.
				</p>
			</footer>
		</div>
	)
}
