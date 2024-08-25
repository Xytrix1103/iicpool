import { useNavigation } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, StyleSheet, View } from 'react-native'
import { Button, HelperText, TextInput, useTheme } from 'react-native-paper'
import { googleLogin, login } from '../api/auth'
import CustomTextDivider from '../components/themed/CustomTextDivider'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import CustomTextInput from '../components/themed/CustomTextInput'
import CustomLayout from '../components/themed/CustomLayout'

const onSubmit = async (data: any) => {
	const { email, password } = data
	login(email, password)
}

const Login = () => {
	const { colors } = useTheme()
	
	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
	})
	
	const [showPassword, setShowPassword] = useState(false)
	const navigation = useNavigation()
	
	// Reset form state when navigating to the page
	useEffect(() => {
		return navigation.addListener('focus', () => {
			reset({
				email: '',
				password: '',
			})
		})
	}, [navigation, reset])
	
	return (
		<CustomLayout>
			<View style={style.content}>
				<Image
					source={require('../assets/logo.png')}
					tintColor={colors.primary}
					style={{ height: 120 }}
					resizeMethod="scale"
					resizeMode="contain"
				/>
				<View style={{ width: '100%' }}>
					<View id="login-form" style={style.loginForm}>
						<View style={style.inputs}>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<CustomTextInput
										label="Username"
										inputMode="email"
										autoCapitalize="none"
										style={{
											width: '100%',
										}}
										error={errors.email !== undefined}
										onBlur={onBlur}
										onChangeText={onChange}
										value={value}
										right={
											value ? (
												<TextInput.Icon
													icon="close"
													onPress={() => onChange('')}
												/>
											) : null
										}
									/>
								)}
								name="email"
								rules={{ required: 'Username is required' }}
							/>
							<HelperText type="error" style={{ marginLeft: '10%' }}>
								{errors.email && errors.email.message}
							</HelperText>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<CustomTextInput
										mode="outlined"
										label="Password"
										autoCapitalize="none"
										secureTextEntry={!showPassword}
										inputMode="text"
										style={{ width: '100%' }}
										error={errors.password !== undefined}
										onBlur={onBlur}
										onChangeText={onChange}
										value={value}
										right={
											<TextInput.Icon
												onPress={() =>
													setShowPassword(!showPassword)
												}
												icon={
													showPassword ? 'eye-off' : 'eye'
												}
											/>
										}
									/>
								)}
								name="password"
								rules={{ required: 'Password is required' }}
							/>
							<HelperText type="error" style={{ marginLeft: '10%' }}>
								{errors.password && errors.password.message}
							</HelperText>
						</View>
						<View style={style.outlinedButtonContainer}>
							<CustomOutlinedButton
								onPress={() => {
									console.log('Register')
									// @ts-expect-error navigation route error
									navigation.navigate('Register')
								}}>
								Register
							</CustomOutlinedButton>
							<CustomSolidButton
								onPress={handleSubmit(onSubmit)}>
								Login
							</CustomSolidButton>
						</View>
					</View>
					<CustomTextDivider text="OR" vmargin={12} />
					<View style={style.buttonContainer}>
						<Button
							mode="elevated"
							icon="google"
							onPress={googleLogin}
							buttonColor={colors.primary}
							labelStyle={{
								marginVertical: 10,
							}}
							style={style.googleLoginButton}>
							Login with Google
						</Button>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

const style = StyleSheet.create({
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		width: '80%',
		flexDirection: 'column',
		gap: 50,
	},
	loginForm: {
		width: '100%',
	},
	inputs: {
		width: '100%',
		alignItems: 'center',
	},
	googleLoginButton: {
		width: '100%',
		paddingVertical: 5,
		color: 'darkred',
		backgroundColor: 'white',
	},
	buttonContainer: {
		width: '100%',
		alignItems: 'center',
		flexDirection: 'row',
	},
	outlinedButtonContainer: {
		width: '100%',
		alignItems: 'center',
		flexDirection: 'row',
		gap: 10,
		marginTop: 20,
	},
})

export default Login
