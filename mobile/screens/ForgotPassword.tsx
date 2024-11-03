import React, { useContext, useEffect, useState } from 'react'
import { ToastAndroid, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import CustomLayout from '../components/themed/CustomLayout'
import CustomText from '../components/themed/CustomText'
import CustomHeader from '../components/themed/CustomHeader'
import CustomInput from '../components/themed/CustomInput'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import { useNavigation } from '@react-navigation/native'
import style from '../styles/shared'
import { forgotPassword } from '../api/auth'
import { Controller, useForm } from 'react-hook-form'
import { AuthContext } from '../components/contexts/AuthContext'

const ForgotPassword = () => {
	const navigation = useNavigation()
	const [canResend, setCanResend] = useState(true)
	const [remainingTime, setRemainingTime] = useState(0)
	const cooldownPeriod = 60 * 1000 // 1 minute in milliseconds
	const form = useForm({
		defaultValues: {
			email: '',
		},
	})
	const { user } = useContext(AuthContext)
	
	useEffect(() => {
		if (user) {
			form.setValue('email', user.email || '')
		}
	}, [user])
	
	useEffect(() => {
		(async () => {
			const lastSent = await AsyncStorage.getItem('lastPasswordResetEmailSent')
			if (lastSent) {
				const timeElapsed = Date.now() - parseInt(lastSent, 10)
				if (timeElapsed < cooldownPeriod) {
					setCanResend(false)
					setRemainingTime(Math.ceil((cooldownPeriod - timeElapsed) / 1000))
				}
			}
		})()
		
		const interval = setInterval(() => {
			setRemainingTime(prev => {
				if (prev > 1) return prev - 1
				setCanResend(true)
				return 0
			})
		}, 1000)
		
		return () => clearInterval(interval)
	}, [])
	
	const handleSendPasswordResetEmail = async ({ email }: { email: string }) => {
		if (canResend) {
			// Send verification email logic here
			await forgotPassword(email)
				.then(async () => {
					console.log('Verification email sent')
					ToastAndroid.show('Password reset email sent', ToastAndroid.LONG)
					setRemainingTime(cooldownPeriod / 1000)
					setCanResend(false)
					await AsyncStorage.setItem('lastPasswordResetEmailSent', Date.now().toString())
				})
				.catch((error) => {
					console.log('Error sending verification email:', error)
					ToastAndroid.show(error.message, ToastAndroid.LONG)
				})
		}
	}
	
	return (
		<CustomLayout
			scrollable={true}
			contentPadding={20}
			header={<CustomHeader title="Forgot Password" navigation={navigation} />}
		>
			<View style={style.mainContent}>
				<View style={style.row}>
					<View style={[style.column, { gap: 10 }]}>
						<View style={style.row}>
							<CustomText bold size={14}>
								Email
							</CustomText>
						</View>
						<View style={style.row}>
							<Controller
								control={form.control}
								render={({ field: { onChange, value } }) => (
									<CustomInput
										label="Email"
										inputMode="email"
										keyboardType="email-address"
										autoCapitalize="none"
										errorMessage={form.formState.errors.email && form.formState.errors.email.message}
										onChangeText={onChange}
										value={value}
										editable={!user}
									/>
								)}
								name="email"
								rules={{
									required: 'Email is required',
									pattern: {
										value: /newinti.edu.my$/,
										message: 'Please enter your INTI email address',
									},
								}}
							/>
						</View>
						<View style={style.row}>
							<CustomOutlinedButton
								onPress={form.handleSubmit(handleSendPasswordResetEmail)}
								disabled={!canResend}
							>
								{canResend ? 'Send Password Reset Email' : `Resend in ${remainingTime}s`}
							</CustomOutlinedButton>
						</View>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default ForgotPassword
