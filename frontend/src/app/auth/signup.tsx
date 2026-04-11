import { SignupForm } from "@/components/signup-form"

export function SignupPage() {
	return (
		<div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<SignupForm />
			</div>
		</div>
	)
}
