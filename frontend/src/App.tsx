import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { AuthProvider } from "./lib/auth-context"
import { router } from "./routes"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,
			refetchOnWindowFocus: true,
			retry: 1,
		},
	},
})

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<RouterProvider router={router} />
			</AuthProvider>
		</QueryClientProvider>
	)
}

export default App
