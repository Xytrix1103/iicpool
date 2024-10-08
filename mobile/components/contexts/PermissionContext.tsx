import { createContext, ReactElement, useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import { Alert } from 'react-native'

enum PermissionStatus {
	GRANTED = 'granted',
	DENIED = 'denied',
	UNDETERMINED = 'undetermined',
}

const PermissionContext = createContext<{
	permissionStatus: {
		camera: PermissionStatus;
		notifications: PermissionStatus;
		location: PermissionStatus;
		backgroundLocation: PermissionStatus;
	};
	setPermissionStatus: (status: {
		camera: PermissionStatus;
		notifications: PermissionStatus;
		location: PermissionStatus;
		backgroundLocation: PermissionStatus;
	}) => void;
	renderToken: string;
	setRenderToken: (token: string) => void;
	wrapPermissions: (
		{
			operation,
			type,
			message,
		}: {
			operation: () => Promise<void>;
			type: 'notifications' | 'location' | 'camera' | 'backgroundLocation';
			message: string;
		},
	) => Promise<void>;
	loading: boolean;
}>({
	permissionStatus: {
		camera: PermissionStatus.UNDETERMINED,
		notifications: PermissionStatus.UNDETERMINED,
		location: PermissionStatus.UNDETERMINED,
		backgroundLocation: PermissionStatus.UNDETERMINED,
	},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setPermissionStatus: () => {
	},
	renderToken: '',
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setRenderToken: () => {
	},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	wrapPermissions: async () => {
	},
	loading: true,
})

const PermissionProvider = ({ children }: { children: ReactElement }) => {
	const [permissionStatus, setPermissionStatus] = useState<{
		camera: PermissionStatus;
		notifications: PermissionStatus;
		location: PermissionStatus;
		backgroundLocation: PermissionStatus;
	}>({
		camera: PermissionStatus.UNDETERMINED,
		notifications: PermissionStatus.UNDETERMINED,
		location: PermissionStatus.UNDETERMINED,
		backgroundLocation: PermissionStatus.UNDETERMINED,
	})
	const [renderToken, setRenderToken] = useState('')
	const [loading, setLoading] = useState(true)
	
	useEffect(() => {
		(async () => {
			setLoading(true)
			
			const finalStatus = {
				camera: permissionStatus.camera,
				notifications: permissionStatus.notifications,
				location: permissionStatus.location,
				backgroundLocation: permissionStatus.backgroundLocation,
			}
			
			await Notifications.requestPermissionsAsync()
				.then(({ status }) => {
					finalStatus.notifications = status
				})
				.catch((error) => {
					console.error(
						'Error getting notifications permissions:',
						error,
					)
				})
			
			await Location.enableNetworkProviderAsync()
				.then(async () => {
					console.log('Network provider enabled')
					
					await Location.requestForegroundPermissionsAsync()
						.then(({ status }) => {
							finalStatus.location = status
						})
						.catch((error) => {
							console.error('Error getting location permissions:', error)
						})
				})
				.catch((error) => {
					console.error('Error enabling network provider:', error)
				})
			
			await ImagePicker.requestCameraPermissionsAsync()
				.then(({ status }) => {
					finalStatus.camera = status
				})
				.catch((error) => {
					console.error('Error getting camera permissions:', error)
				})
			
			await Location.requestBackgroundPermissionsAsync()
				.then(({ status }) => {
					finalStatus.backgroundLocation = status
				})
				.catch((error) => {
					console.error('Error getting background location permissions:', error)
				})
			
			if (finalStatus !== permissionStatus) {
				setPermissionStatus(finalStatus)
			}
			
			setLoading(false)
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	
	useEffect(() => {
		setRenderToken(Math.random().toString())
		console.log('Checking permissions:', permissionStatus)
	}, [permissionStatus])
	
	const wrapPermissions = async (
		{
			operation,
			type,
			message,
		}: {
			operation: () => Promise<void>;
			type: 'notifications' | 'location' | 'camera' | 'backgroundLocation';
			message: string;
		}) => {
		let { status } = await (
			type === 'notifications'
				? Notifications.getPermissionsAsync()
				: type === 'location'
					? Location.enableNetworkProviderAsync()
						.then(() => Location.getForegroundPermissionsAsync())
					: type === 'camera'
						? ImagePicker.getCameraPermissionsAsync()
						: type === 'backgroundLocation'
							? Location.enableNetworkProviderAsync()
								.then(() => Location.getBackgroundPermissionsAsync())
							: Promise.reject(new Error('Invalid permission type'))
		)
		
		console.log('wrapPermissions -> status', status)
		
		if (status === 'undetermined') {
			console.log('Requesting permissions as they are undetermined')
			const { status: newStatus } = await (type === 'notifications'
				? Notifications.requestPermissionsAsync()
				: type === 'location'
					? Location.enableNetworkProviderAsync()
						.then(() => Location.requestForegroundPermissionsAsync()
							.then(({ status }) => {
								console.log('Location permissions:', status)
								return { status }
							})
							.catch((error) => {
								console.error('Error getting location permissions:', error)
								return { status: PermissionStatus.DENIED }
							}),
						)
						.catch((error) => {
							console.error('Error getting location permissions:', error)
							return { status: PermissionStatus.DENIED }
						})
					: type === 'camera'
						? ImagePicker.requestCameraPermissionsAsync()
						: type === 'backgroundLocation'
							? Location.enableNetworkProviderAsync()
								.then(() => Location.requestBackgroundPermissionsAsync()
									.then(({ status }) => {
										console.log('Background location permissions:', status)
										return { status }
									})
									.catch((error) => {
										console.error('Error getting background location permissions:', error)
										return { status: PermissionStatus.DENIED }
									}),
								)
								.catch((error) => {
									console.error('Error getting background location permissions:', error)
									return { status: PermissionStatus.DENIED }
								})
							: Promise.reject(new Error('Invalid permission type')))
			status = newStatus
		}
		
		if (status === 'denied') {
			Alert.alert(
				type === 'notifications'
					? 'Notification Permissions Required'
					: type === 'location'
						? 'Location Permissions Required'
						: 'Camera Permissions Required',
				`${message}. Please enable ${type} permissions in your settings to continue.`,
				[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
			)
		}
		
		if (status === 'granted') {
			await operation()
		}
	}
	
	return (
		<PermissionContext.Provider
			value={{
				permissionStatus,
				setPermissionStatus,
				renderToken,
				setRenderToken,
				wrapPermissions,
				loading,
			}}
		>
			{children}
		</PermissionContext.Provider>
	)
}

export { PermissionContext, PermissionProvider, PermissionStatus }
