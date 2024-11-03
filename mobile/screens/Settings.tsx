import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { ToastAndroid, View } from 'react-native'
import style from '../styles/shared'
import CustomText from '../components/themed/CustomText'
import { Switch } from 'react-native-paper'
import { useNotificationSettings } from '../components/contexts/NotificationContext'
import { ProfileNotificationSettings } from '../database/schema'
import { useNavigation } from '@react-navigation/native'
import { forgotPassword, logout } from '../api/auth'
import CustomIconButton from '../components/themed/CustomIconButton'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import React, { useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthContext } from '../components/contexts/AuthContext'

const Settings = () => {
	const { notificationSettings, setNotificationSettings } = useNotificationSettings()
	const navigation = useNavigation()
	const [canResend, setCanResend] = useState(true)
	const [remainingTime, setRemainingTime] = useState(0)
	const cooldownPeriod = 60 * 1000 // 1 minute in milliseconds
	const { user } = useContext(AuthContext)
	
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
	
	const handleSendPasswordResetEmail = async () => {
		if (canResend) {
			// Send verification email logic here
			await forgotPassword(user?.email || '')
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
	
	const handleToggleAllNotifications = async () => {
		const isOldTrue = Object.values(notificationSettings).some((value) => value)
		
		setNotificationSettings(Object.keys(notificationSettings).reduce((acc: ProfileNotificationSettings, key: string) => {
			acc[key as keyof ProfileNotificationSettings] = !isOldTrue
			return acc
		}, {} as ProfileNotificationSettings))
	}
	
	return (
		<CustomLayout
			scrollable={true}
			header={
				<CustomHeader
					title="Settings"
					navigation={navigation}
					rightNode={
						<CustomIconButton
							icon="logout"
							onPress={logout}
						/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 30 }]}>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<View style={[style.row, { justifyContent: 'space-between' }]}>
								<CustomText bold>Notifications</CustomText>
								<Switch
									value={Object.values(notificationSettings).some((value) => value)}
									onValueChange={handleToggleAllNotifications}
								/>
							</View>
							<View style={[style.column, { gap: 5 }]}>
								{
									Object.entries(notificationSettings).map(([key, value]) => (
										<View key={key} style={[style.row, { justifyContent: 'space-between' }]}>
											<CustomText
												size={14}>{key.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</CustomText>
											<Switch
												value={value}
												onValueChange={() => {
													setNotificationSettings((prevSettings) => ({
														...prevSettings,
														[key as keyof ProfileNotificationSettings]: !value,
													}))
												}}
											/>
										</View>
									))
								}
							</View>
						</View>
					</View>
					<View style={style.row}>
						<CustomOutlinedButton
							onPress={handleSendPasswordResetEmail}
							disabled={!canResend}
						>
							{canResend ? 'Send Password Reset Email' : `Resend in ${remainingTime}s`}
						</CustomOutlinedButton>
					</View>
					<View style={style.row}>
						<CustomOutlinedButton
							//@ts-ignore
							onPress={() => navigation.navigate('DeleteAccount')}
						>
							Delete Account
						</CustomOutlinedButton>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default Settings
