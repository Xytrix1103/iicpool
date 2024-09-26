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
			new_rides: false,
			ride_updates: false,
			new_messages: false,
			new_passengers: false,
			booking_confirmation: false,
			driver_registration: false,
		})
	
	useEffect(() => {
		(async () => {
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
		})()
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
