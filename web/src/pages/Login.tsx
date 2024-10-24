import { Controller, useForm } from 'react-hook-form'
import logo from '../assets/logo.png'
import { login } from '../api/auth.ts'
import { useToast } from '../components/themed/ui-kit/use-toast.ts'
import { Toaster } from '../components/themed/ui-kit/toaster.tsx'
import { Label } from '../components/themed/ui-kit/label.tsx'
import { Input } from '../components/themed/ui-kit/input.tsx'
import { Button } from '../components/themed/ui-kit/button.tsx'

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
				className="flex flex-col space-y-6 w-1/5"
				onSubmit={handleSubmit((data) => {
					login(data.email, data.password, toast)
				})}
			>
				<div className="flex flex-col w-full space-y-2 content-center justify-center">
					<img src={logo} alt="Logo" className="w-3/5 h-auto self-center" />
					<h1 className="text-2xl text-primary font-extrabold text-center">IICPool (Admin)</h1>
				</div>
				<div className="flex flex-col w-full space-y-4 content-center justify-center gap-[3rem]">
					<h1 className="text-3xl text-center">Login</h1>
					<div className="flex flex-col gap-[2.5rem]">
						<div className="flex flex-col gap-[2rem]">
							<div className="grid w-full max-w-sm items-center gap-1.5">
								<Controller
									name="email"
									control={control}
									render={({ field }) => (
										<>
											<Label htmlFor="email" className="px-1">Email</Label>
											<Input
												{...field}
												type="text"
												id="email"
												className="rounded-2xl"
												placeholder=""
											/>
										</>
									)}
								/>
							</div>
							<div className="grid w-full max-w-sm items-center gap-1.5">
								<Controller
									name="password"
									control={control}
									render={({ field }) => (
										<>
											<Label htmlFor="password"
											       className="px-1">Password</Label>
											<Input
												{...field}
												type="password"
												id="password"
												className="rounded-2xl"
												placeholder=""
											/>
										</>
									)}
								/>
							</div>
						</div>
						<div className="flex flex-row gap-3">
							<Button
								type="submit"
								className="p-3 bg-primary text-white rounded-lg hover:bg-primary-darkred focus:outline-none focus:ring focus:ring-primary-darkred w-full"
							>
								Login
							</Button>
						</div>
					</div>
				</div>
			</form>
			<Toaster />
		</div>
	)
}

export default Login
