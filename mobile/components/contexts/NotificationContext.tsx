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

interface AreObjectsEqualProps<T extends object> {
	obj1: T;
	obj2: T;
}

const areObjectsEqual = <T extends object>({ obj1, obj2 }: AreObjectsEqualProps<T>): boolean => {
	const keys1 = Object.keys(obj1) as (keyof T)[]
	const keys2 = Object.keys(obj2) as (keyof T)[]
	
	if (keys1.length !== keys2.length) {
		return false
	}
	
	for (const key of keys1) {
		if (obj1[key] !== obj2[key]) {
			return false
		}
	}
	
	return true
}

const NotificationSettingsProvider: React.FC<
	NotificationSettingsProviderProps
> = ({ children }) => {
	const [notificationSettings, setNotificationSettings] =
		useState<ProfileNotificationSettings>({
			new_messages: false,
			ride_updates: false,
		})
	
	useEffect(() => {
		(async () => {
			try {
				const storedSettings = await AsyncStorage.getItem(
					NOTIFICATION_SETTINGS_KEY,
				)
				
				if (storedSettings) {
					console.log('Loaded settings:', storedSettings)
					//check if storedSettings matches the ProfileNotificationSettings interface
					const parsedSettings = JSON.parse(storedSettings)
					
					if (!areObjectsEqual<ProfileNotificationSettings>({
						obj1: parsedSettings,
						obj2: notificationSettings,
					})) {
						console.log('Settings match the ProfileNotificationSettings interface')
						setNotificationSettings(parsedSettings)
					} else {
						console.error('Stored settings do not match the ProfileNotificationSettings interface')
						
						setNotificationSettings({
							new_messages: false,
							ride_updates: false,
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
