import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import * as TaskManager from 'expo-task-manager'
import { PermissionContext } from './PermissionContext'

interface NotificationSettings {
	receiveNotificationsTruck: boolean;
	receiveNotificationsReport: boolean;
}

interface NotificationSettingsContextType {
	notificationSettings: NotificationSettings;
	setNotificationSettings: React.Dispatch<
		React.SetStateAction<NotificationSettings>
	>;
}

const NotificationSettingsContext = createContext<
	NotificationSettingsContextType | undefined
>(undefined)

const NOTIFICATION_SETTINGS_KEY = 'NOTIFICATION_SETTINGS'

interface NotificationSettingsProviderProps {
	children: ReactNode;
}

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK'

export const NotificationSettingsProvider: React.FC<
	NotificationSettingsProviderProps
> = ({ children }) => {
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>({
			receiveNotificationsTruck: false,
			receiveNotificationsReport: false,
		})
	const { wrapPermissions } = useContext(PermissionContext)
	
	
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const storedSettings = await AsyncStorage.getItem(
					NOTIFICATION_SETTINGS_KEY,
				)
				if (storedSettings) {
					setNotificationSettings(JSON.parse(storedSettings))
				}
			} catch (error) {
				console.error('Failed to load notification settings', error)
			}
		}
		
		loadSettings().then((r) => r)
	}, [])
	
	useEffect(() => {
		const saveSettings = async () => {
			try {
				await AsyncStorage.setItem(
					NOTIFICATION_SETTINGS_KEY,
					JSON.stringify(notificationSettings),
				)
				console.log('Saved settings:', notificationSettings)
			} catch (error) {
				console.error('Failed to save notification settings', error)
			}
		}
		saveSettings().then((r) => r)
	}, [notificationSettings])
	
	useEffect(() => {
		// Register the background notification task
		// Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
		// 	.then(() =>
		// 		console.log(
		// 			'Background notification task registered successfully'
		// 		)
		// 	)
		// 	.catch((error) =>
		// 		console.error(
		// 			'Error registering background notification task:',
		// 			error
		// 		)
		// 	);
		
		(async () => {
			await wrapPermissions({
				operation: async () => {
					await Notifications.registerTaskAsync(
						BACKGROUND_NOTIFICATION_TASK,
					)
						.then(() =>
							console.log(
								'Background notification task registered successfully',
							),
						)
						.catch((error) =>
							console.error(
								'Error registering background notification task:',
								error,
							),
						)
				},
				type: 'notifications',
				message: 'Notification permissions are required to receive background notifications',
			})
		})()
		
		TaskManager.defineTask(
			BACKGROUND_NOTIFICATION_TASK,
			async ({ data, error }) => {
				if (error) {
					console.error(
						'Error in background notification task:',
						error,
					)
					return
				}
				if (data) {
					await wrapPermissions({
						operation: async () => {
							await Notifications.scheduleNotificationAsync({
								content: {
									data,
								},
								trigger: null,
							})
						},
						type: 'notifications',
						message: 'Notification permissions are required to receive background notifications',
					})
				}
			},
		);
		
		// Notifications.setNotificationHandler({
		// 	handleNotification: async () => ({
		// 		shouldShowAlert: true,
		// 		shouldPlaySound: true,
		// 		shouldSetBadge: true,
		// 	}),
		// });
		
		(async () => {
			await wrapPermissions({
				operation: async () => {
					Notifications.setNotificationHandler({
						handleNotification: async () => ({
							shouldShowAlert: true,
							shouldPlaySound: true,
							shouldSetBadge: true,
						}),
					})
				},
				type: 'notifications',
				message: 'Notification permissions are required to receive push notifications',
			})
		})()
	}, [])
	
	return (
		<NotificationSettingsContext.Provider
			value={{ notificationSettings, setNotificationSettings }}
		>
			{children}
		</NotificationSettingsContext.Provider>
	)
}

export const useNotificationSettings = () => {
	const context = useContext(NotificationSettingsContext)
	
	if (!context) {
		throw new Error(
			'useNotificationSettings must be used within a NotificationSettingsProvider',
		)
	}
	return context
}

function handleRegistrationError(errorMessage: string) {
	alert(errorMessage)
	throw new Error(errorMessage)
}

export async function registerForPushNotificationsAsync(
	wrapPermissions: ({
		                  operation,
		                  type,
		                  message,
	                  }: {
		operation: () => Promise<void>;
		type: 'notifications' | 'location' | 'camera';
		message: string;
	}) => Promise<void>,
	projectId: string | undefined,
	translations: any,
) {
	
	if (Platform.OS === 'android') {
		// await Notifications.setNotificationChannelAsync('default', {
		// 	name: 'default',
		// 	importance: Notifications.AndroidImportance.MAX,
		// 	vibrationPattern: [0, 250, 250, 250],
		// 	lightColor: '#FF231F7C',
		// });
		
		await wrapPermissions({
			operation: async () => {
				await Notifications.setNotificationChannelAsync('default', {
					name: 'default',
					importance: Notifications.AndroidImportance.MAX,
					vibrationPattern: [0, 250, 250, 250],
					lightColor: '#FF231F7C',
				})
			},
			type: 'notifications',
			message: 'Notification permissions are required to receive push notifications',
		})
	}
	
	if (Device.isDevice) {
		if (!projectId) {
			handleRegistrationError(translations.Notification.idNotFound)
		}
		try {
			return (await Notifications.getDevicePushTokenAsync())
				.data
		} catch (e: unknown) {
			handleRegistrationError(`${e}`)
			return
		}
	} else {
		handleRegistrationError(
			'Must use physical device for push notifications',
		)
		return
	}
}

export const triggerPushNotification = async (
	token: string,
	title: string,
	body: string,
	data: any,
) => {
	try {
		const message = {
			to: token, // The expoPushToken obtained from registerForPushNotificationsAsync
			sound: 'default',
			title,
			body,
			data,
		}
		
		const response = await fetch('https://exp.host/--/api/v2/push/send', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization:
					'Bearer RQ9HGsmzzGkrSs4maOryC4eRwUnGJPyIIPhqxIDn',
			},
			body: JSON.stringify(message),
		})
		
		const res = await response.json()
		console.log('Push notification response:', res)
	} catch (e) {
		console.log('Error sending push notification:', e)
	}
}

export default NotificationSettingsProvider
