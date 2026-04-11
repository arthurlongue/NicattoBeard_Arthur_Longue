import { createBrowserRouter } from "react-router-dom"
import { AdminBarbers } from "./app/admin/barbers"
// Admin Pages
import { AdminDashboard } from "./app/admin/dashboard"
import { AdminSpecialties } from "./app/admin/specialties"
// Auth Pages
import { LoginPage } from "./app/auth/login"
import { SignupPage } from "./app/auth/signup"
// Customer Pages
import { CustomerDashboard } from "./app/customer/dashboard"
import { NewAppointment } from "./app/customer/new-appointment"
import RootLayout from "./app/layout"
import NotFound from "./app/not-found"
// Home Page
import { HomePage } from "./app/page"
import { AuthLayout } from "./components/layout/auth-layout"
import { DashboardLayout } from "./components/layout/dashboard-layout"

export const router = createBrowserRouter([
	{
		element: <RootLayout />,
		children: [
			{
				path: "/",
				element: <HomePage />,
			},
			{
				element: <AuthLayout />,
				children: [
					{
						path: "login",
						element: <LoginPage />,
					},
					{
						path: "signup",
						element: <SignupPage />,
					},
				],
			},
			{
				// TODO: Guard de autenticacao pendente. Durante a montagem inicial do frontend,
				// a area do cliente permanece aberta ate a camada de auth/context ser integrada.
				path: "/dashboard",
				element: <DashboardLayout userRole="customer" />,
				children: [
					{
						index: true,
						element: <CustomerDashboard />,
					},
					{
						path: "new",
						element: <NewAppointment />,
					},
				],
			},
			{
				// TODO: Guard de autorizacao pendente. Esta rota ainda nao valida JWT/role
				// porque a navegacao base do frontend esta sendo implementada antes da auth.
				path: "/admin",
				element: <DashboardLayout userRole="admin" />,
				children: [
					{
						index: true,
						element: <AdminDashboard />,
					},
					{
						path: "barbers",
						element: <AdminBarbers />,
					},
					{
						path: "specialties",
						element: <AdminSpecialties />,
					},
				],
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
])
