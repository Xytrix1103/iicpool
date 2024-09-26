import React, { useContext, useEffect, useState } from 'react'
import { ToastAndroid, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import CustomLayout from '../components/themed/CustomLayout'
import CustomText from '../components/themed/CustomText'
import CustomHeader from '../components/themed/CustomHeader'
import CustomInput from '../components/themed/CustomInput'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import { AuthContext } from '../components/contexts/AuthContext'
import { useNavigation } from '@react-navigation/native'
import style from '../styles/shared'
import { sendVerificationEmail } from '../api/auth'
import FirebaseApp from '../components/FirebaseApp'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const { auth } = FirebaseApp

const VerifyEmail = () => {
	const { user } = useContext(AuthContext)
	const navigation = useNavigation()
	const [canResend, setCanResend] = useState(true)
	const [remainingTime, setRemainingTime] = useState(0)
	const cooldownPeriod = 60 * 1000 // 1 minute in milliseconds
	
	useEffect(() => {
		(async () => {
			await auth.currentUser?.reload()
			const lastSent = await AsyncStorage.getItem('lastVerificationEmailSent')
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
	
	const handleSendVerificationEmail = async () => {
		if (canResend) {
			// Send verification email logic here
			await sendVerificationEmail()
				.then(async () => {
					console.log('Verification email sent')
					setRemainingTime(cooldownPeriod / 1000)
					setCanResend(false)
					await AsyncStorage.setItem('lastVerificationEmailSent', Date.now().toString())
				})
				.catch((error) => {
					console.log('Error sending verification email:', error)
					ToastAndroid.show(error.message, ToastAndroid.LONG)
				})
				.finally(async () => {
					console.log('Reloading user...')
					auth.currentUser && await auth.currentUser.reload()
				})
		}
	}
	
	useEffect(() => {
		//once the user is verified, go back after 3 seconds while showing loading overlay
		if (user?.emailVerified) {
			setTimeout(() => {
				navigation.goBack()
			}, 3000)
		}
	}, [user?.emailVerified])
	
	return (
		<CustomLayout
			scrollable={true}
			contentPadding={20}
			header={<CustomHeader title="Verify Email" navigation={navigation} />}
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
							<CustomInput
								editable={false}
								value={user?.email || ''}
								onChangeText={() => null}
								rightIcon={
									auth.currentUser?.emailVerified ? (
										<Icon name="check" size={24} color="green" />
									) : (
										<Icon name="alert-circle" size={24} color="darkred" />
									)
								}
							/>
						</View>
						<View style={style.row}>
							{
								auth.currentUser?.emailVerified ? (
									<CustomText size={12} color="green">
										Email verified
									</CustomText>
								) : (
									<CustomOutlinedButton
										onPress={handleSendVerificationEmail}
										disabled={!canResend || user?.emailVerified}
									>
										{canResend ? 'Resend Verification Email' : `Resend in ${remainingTime} seconds`}
									</CustomOutlinedButton>
								)
							}
						</View>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default VerifyEmail
