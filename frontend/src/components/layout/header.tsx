import { Scissors } from "lucide-react"
import { Link } from "react-router-dom"

export function Header() {
	return (
		<header className="flex h-16 items-center border-b bg-background px-4 lg:px-6">
			<Link className="flex items-center justify-center gap-2" to="/">
				<Scissors className="h-6 w-6" />
				<span className="font-bold text-xl">NicattoBeard</span>
			</Link>
			<nav className="ml-auto flex gap-4 sm:gap-6">
				<Link className="font-medium text-sm underline-offset-4 hover:underline" to="/login">
					Login
				</Link>
				<Link className="font-medium text-sm underline-offset-4 hover:underline" to="/signup">
					Criar conta
				</Link>
			</nav>
		</header>
	)
}
