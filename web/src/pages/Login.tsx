import { Controller, useForm } from 'react-hook-form'
import logo from '../assets/logo.png'
import { login } from '../api/auth.ts'
import { useState } from 'react'

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
	const [showPassword, setShowPassword] = useState<boolean>(false)
	
	const { control, handleSubmit } = form
	
	return (
		<div className="flex w-full h-full items-center justify-center">
			<form
				className="flex flex-col space-y-6 w-1/6"
				onSubmit={handleSubmit((data) => {
					login(data.email, data.password)
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
								>
									<i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-500 absolute right-4 top-4 cursor-pointer`}
									   onClick={() => setShowPassword(!showPassword)}
									></i>
								</input>
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
		</div>
	)
}

export default Login
