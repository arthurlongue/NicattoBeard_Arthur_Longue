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
import { GuestRoute } from "./components/layout/guest-route"
import { ProtectedRoute } from "./components/layout/protected-route"

export const router = createBrowserRouter([
	{
		element: <RootLayout />,
		children: [
			{
				path: "/",
				element: <HomePage />,
			},
			{
				element: (
					<GuestRoute>
						<AuthLayout />
					</GuestRoute>
				),
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
				path: "/dashboard",
				element: (
					<ProtectedRoute requiredRole="customer">
						<DashboardLayout />
					</ProtectedRoute>
				),
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
				path: "/admin",
				element: (
					<ProtectedRoute requiredRole="admin">
						<DashboardLayout />
					</ProtectedRoute>
				),
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
