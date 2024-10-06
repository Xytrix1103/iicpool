import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ProfileNotificationSettings } from '../../database/schema'

interface NotificationSettingsContextType {
	notificationSettings: ProfileNotificationSettings;
	setNotificationSettings: Dispatch<SetStateAction<ProfileNotificationSettings>>;
}

const NotificationSettingsContext = createContext<
	NotificationSettingsContextType | undefined
>(undefined)

const NOTIFICATION_SETTINGS_KEY = 'NOTIFICATION_SETTINGS'

interface NotificationSettingsProviderProps {
	children: ReactNode;
}

const NotificationSettingsProvider: React.FC<
	NotificationSettingsProviderProps
> = ({ children }) => {
	const [notificationSettings, setNotificationSettings] =
		useState<ProfileNotificationSettings>({
			new_messages: false,
			new_passengers: false,
			booking_confirmation: false,
			ride_cancellation: false,
		})
	
	useEffect(() => {
		(async () => {
			try {
				const storedSettings = await AsyncStorage.getItem(
					NOTIFICATION_SETTINGS_KEY,
				)
				
				if (storedSettings) {
					//check if storedSettings matches the ProfileNotificationSettings interface
					const parsedSettings = JSON.parse(storedSettings)
					
					if (JSON.stringify(Object.keys(parsedSettings).sort()) === JSON.stringify(Object.keys(notificationSettings).sort())) {
						setNotificationSettings(parsedSettings)
					} else {
						console.error('Stored settings do not match the ProfileNotificationSettings interface')
						
						setNotificationSettings({
							new_messages: false,
							new_passengers: false,
							booking_confirmation: false,
							ride_cancellation: false,
						})
					}
				}
			} catch (error) {
				console.error('Failed to load notification settings', error)
			}
		})()
	}, [])
	
	useEffect(() => {
		const saveSettings = async () => {
			try {
				const oldSettings = await AsyncStorage.getItem(
					NOTIFICATION_SETTINGS_KEY,
				)
				
				if (oldSettings) {
					const parsedOldSettings = JSON.parse(oldSettings)
					
					if (JSON.stringify(parsedOldSettings) === JSON.stringify(notificationSettings)) {
						return
					}
				}
				
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
	
	return (
		<NotificationSettingsContext.Provider
			value={{ notificationSettings, setNotificationSettings }}
		>
			{children}
		</NotificationSettingsContext.Provider>
	)
}

const useNotificationSettings = () => {
	const context = useContext(NotificationSettingsContext)
	
	if (!context) {
		throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider')
	}
	
	return context
}

export { NotificationSettingsProvider, useNotificationSettings, NotificationSettingsContext }
