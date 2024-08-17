import React, { ReactElement, useEffect, useState } from 'react'
import { Controller, useForm, UseFormTrigger } from 'react-hook-form'
import { Appbar, Button, HelperText, TextInput } from 'react-native-paper'
import { Alert, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import CustomText from '../components/themed/CustomText'
import { register } from '../api/auth'

const handleNext = (step: number, setStep: (step: number) => void, trigger: UseFormTrigger<RegisterProps>, steps: StepProps[]) => {
	console.log('Next')
	if (step !== steps.length) {
		if (step === 1) {
			trigger('email').then(r => {
				if (r) {
					setStep(step + 1)
				}
			})
		}
	}
}

const handleBack = (step: number, setStep: (step: number) => void, trigger: UseFormTrigger<RegisterProps>) => {
	if (step > 1) {
		setStep(step - 1)
	}
}

export type RegisterProps = {
	email: string;
	password: string;
	password_confirmation: string;
}

type StepProps = {
	header: string;
	component: ReactElement;
}

const Register = () => {
	const form = useForm<RegisterProps>({
		defaultValues: {
			email: '',
			password: '',
			password_confirmation: '',
		},
	})
	
	const {
		handleSubmit,
		formState: { errors },
		reset,
		trigger,
	} = form
	
	const navigation = useNavigation()
	
	const [step, setStep] = useState(1)
	
	// Reset form state when navigating to the page
	useEffect(() => {
		return navigation.addListener('focus', () => {
			reset()
		})
	}, [navigation, reset])
	
	useEffect(() => {
		console.log(step)
	}, [step])
	
	const steps: StepProps[] = [
		{
			header: 'Get Started',
			component: <RegisterStep1 form={form} />,
		},
		{
			header: 'Create Password',
			component: <RegisterStep2 form={form} />,
		},
	]
	
	return (
		<View style={style.container}>
			<Appbar.Header style={style.appbar}>
				<Appbar.BackAction onPress={() => {
					Alert.alert(
						'Cancel Registration',
						'Are you sure you want to cancel the registration?',
						[
							{
								text: 'No',
								style: 'cancel',
							},
							{
								text: 'Yes',
								onPress: () => navigation.goBack(),
							},
						],
					)
				}} />
				<Appbar.Content
					title={steps?.[step - 1]?.header}
					titleStyle={{
						fontSize: 20,
						fontWeight: 'bold',
					}}
				/>
			</Appbar.Header>
			<View style={style.content}>
				<View style={style.stepContainer}>
					{steps?.[step - 1]?.component}
				</View>
				<View style={style.buttonContainer}>
					{
						step > 1 && (
							<Button
								mode="outlined"
								style={style.buttonOutlined}
								onPress={() => handleBack(step, setStep, trigger)}
							>
								Back
							</Button>
						)
					}
					{
						step === steps.length ?
							<Button
								mode="contained"
								style={style.button}
								onPress={handleSubmit(register)}
							>
								Register
							</Button> :
							<Button
								mode="contained"
								style={style.button}
								onPress={() => handleNext(step, setStep, trigger, steps)}
							>
								Next
							</Button>
					}
				</View>
			</View>
		</View>
	)
}

const RegisterStep1 = ({ form }: { form: any }) => {
	const {
		control,
		formState: { errors },
		watch,
	} = form
	
	const email = watch('email')
	
	return (
		<View style={style.row}>
			<CustomText size={16}>Enter your email to get started</CustomText>
			<Controller
				control={control}
				render={({ field: { onChange, onBlur, value } }) => (
					<TextInput
						label="Email"
						mode="outlined"
						style={style.input}
						onBlur={onBlur}
						onChangeText={onChange}
						value={value}
						error={errors.email}
						autoCapitalize="none"
						inputMode="email"
						right={
							email.length > 0 ?
								email.match(/newinti.edu.my$/) ?
									<TextInput.Icon
										icon="check"
										color="green"
										pointerEvents="none"
									/> :
									<TextInput.Icon
										icon="close"
										color="darkred"
										pointerEvents="none"
									/>
								: null
						}
					/>
				)}
				name="email"
				rules={{
					required: 'Email is required',
					pattern: {
						value: /newinti.edu.my$/,
						message: 'Please use your INTI email to register.',
					},
				}}
			/>
			{errors.email && <HelperText
				type="error"
				style={style.helperText}
			>
				{errors.email.message}
			</HelperText>}
		</View>
	)
}

const RegisterStep2 = ({ form }: { form: any }) => {
	const {
		control,
		formState: { errors },
		watch,
	} = form
	
	const password = watch('password')
	
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	
	return (
		<View style={style.column}>
			<View style={style.row}>
				<CustomText size={16}>Enter your password</CustomText>
				<Controller
					control={control}
					render={({ field: { onChange, onBlur, value } }) => (
						<TextInput
							label="Password"
							mode="outlined"
							style={style.input}
							onBlur={onBlur}
							onChangeText={onChange}
							value={value}
							error={errors.password}
							autoCapitalize="none"
							secureTextEntry={!showPassword}
							right={
								<TextInput.Icon
									icon={showPassword ? 'eye-off' : 'eye'}
									onPress={() => setShowPassword(!showPassword)}
								/>
							}
						/>
					)}
					name="password"
					rules={{
						required: 'Password is required',
						minLength: {
							value: 8,
							message: 'Password must be at least 8 characters long.',
						},
					}}
				/>
				{errors.password && <HelperText
					type="error"
					style={style.helperText}
				>
					{errors.password.message}
				</HelperText>}
			</View>
			<View style={style.row}>
				<CustomText size={16}>Confirm your password</CustomText>
				<Controller
					control={control}
					render={({ field: { onChange, onBlur, value } }) => (
						<TextInput
							label="Confirm Password"
							mode="outlined"
							style={style.input}
							onBlur={onBlur}
							onChangeText={onChange}
							value={value}
							error={errors.password_confirmation}
							autoCapitalize="none"
							secureTextEntry={!showConfirmPassword}
							right={
								<TextInput.Icon
									icon={showConfirmPassword ? 'eye-off' : 'eye'}
									onPress={() => setShowConfirmPassword(!showConfirmPassword)}
								/>
							}
						/>
					)}
					name="password_confirmation"
					rules={{
						required: 'Confirm Password is required',
						validate: value => value === password || 'Passwords do not match.',
					}}
				/>
				{errors.password_confirmation && <HelperText
					type="error"
					style={style.helperText}
				>
					{errors.password_confirmation.message}
				</HelperText>}
			</View>
		</View>
	)
}

const style = StyleSheet.create({
	container: {
		width: '100%',
		height: '100%',
	},
	content: {
		flex: 1,
		padding: 20,
	},
	appbar: {
		width: '100%',
	},
	stepContainer: {
		flex: 1,
	},
	buttonContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
		gap: 10,
	},
	buttonOutlined: {
		flex: 1,
		marginVertical: 10,
		paddingVertical: 5,
		borderColor: 'darkred',
	},
	button: {
		flex: 1,
		marginVertical: 10,
		paddingVertical: 5,
		backgroundColor: 'darkred',
		color: 'white',
	},
	input: {
		width: '100%',
	},
	helperText: {
		marginLeft: '10%',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
	},
	column: {
		flexWrap: 'wrap',
		width: '100%',
		flexDirection: 'column',
		gap: 30,
	},
})

export default Register
