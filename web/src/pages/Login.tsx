import { Controller, useForm } from 'react-hook-form'
import logo from '../assets/logo.png'
import { login } from '../api/auth.ts'
import { useToast } from '../components/themed/ui-kit/use-toast.ts'
import { Toaster } from '../components/themed/ui-kit/toaster.tsx'

type LoginProps = {
	email: string;
	password: string;
}

const Login = () => {
	const form = useForm<LoginProps>({
		defaultValues: {
			email: '',
			password: '',
		},
	})
	const { toast } = useToast()

	const { control, handleSubmit } = form

	return (
		<div className="flex w-full h-full items-center justify-center">
			<form
				className="flex flex-col space-y-6 w-1/6"
				onSubmit={handleSubmit((data) => {
					login(data.email, data.password, toast)
				})}
			>
				<div className="flex flex-col w-full space-y-2 content-center justify-center">
					<img src={logo} alt="Logo" className="w-3/5 h-auto self-center" />
					<h1 className="text-2xl text-primary font-extrabold text-center">IICPool (Admin)</h1>
				</div>
				<div className="flex flex-col w-full space-y-4 content-center justify-center">
					<h1 className="text-3xl text-center">Login</h1>
					<div className="flex flex-col space-y-5">
						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<input
									{...field}
									type="email"
									placeholder="Email"
									className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-100 w-full mt-6"
								/>
							)}
						/>
						<Controller
							name="password"
							control={control}
							render={({ field }) => (
								<input
									{...field}
									type="password"
									placeholder="Password"
									className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-100 w-full mt-6"
								/>
							)}
						/>
						<button
							type="submit"
							className="p-3 bg-primary text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200 w-full"
						>
							Login
						</button>
					</div>
				</div>
			</form>
			<Toaster />
		</div>
	)
}

export default Login
