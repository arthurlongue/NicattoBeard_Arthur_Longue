import { Scissors } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function NotFound() {
	return (
		<div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-muted/40 px-4 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-lg">
				<Scissors className="h-10 w-10 text-primary" />
			</div>
			<h1 className="mt-6 font-bold text-4xl tracking-tighter sm:text-5xl">404</h1>
			<h2 className="mt-2 font-semibold text-2xl tracking-tight">Página não encontrada</h2>
			<p className="mt-4 max-w-[500px] text-muted-foreground md:text-lg">
				Desculpe, o barbeiro parece ter se perdido. A página que você está procurando não existe ou foi movida.
			</p>
			<div className="mt-8">
				<Button render={<Link to="/" />} size="lg">
					Voltar para o Início
				</Button>
			</div>
		</div>
	)
}
