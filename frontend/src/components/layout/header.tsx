import { LogOut, Scissors } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"

export function Header() {
	const { isAuthenticated, user, logout } = useAuth()
	const navigate = useNavigate()

	const handleLogout = () => {
		logout()
		navigate("/")
	}

	return (
		<header className="flex h-16 items-center border-b bg-background px-4 lg:px-6">
			<Link className="flex items-center justify-center gap-2" to="/">
				<Scissors className="h-6 w-6" />
				<span className="font-bold text-xl">NicattoBeard</span>
			</Link>
			<nav className="ml-auto flex items-center gap-4 sm:gap-6">
				{isAuthenticated ? (
					<>
						<span className="text-muted-foreground text-sm truncate max-w-[100px] sm:max-w-none">
							{user?.name}
						</span>
						<button
							onClick={handleLogout}
							className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 font-medium text-sm min-h-[44px] min-w-[44px] hover:text-destructive"
						>
							<LogOut className="h-4 w-4" />
							Sair
						</button>
					</>
				) : (
					<>
						<Link
							className="inline-flex items-center justify-center rounded-md px-3 py-2 font-medium text-sm underline-offset-4 min-h-[44px] hover:underline"
							to="/login"
						>
							Entrar
						</Link>
						<Link
							className="inline-flex items-center justify-center rounded-md px-3 py-2 font-medium text-sm underline-offset-4 min-h-[44px] hover:underline"
							to="/signup"
						>
							Criar conta
						</Link>
					</>
				)}
			</nav>
		</header>
	)
}
