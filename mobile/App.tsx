import React, { ReactElement, useContext, useEffect, useRef, useState } from 'react'
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NavigationContainer from '@react-navigation/native/src/NavigationContainer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { AppState, Linking, LogBox, Platform, StyleSheet } from 'react-native'
import { Profile as ProfileType, ProfileNotificationSettings, Signal } from './database/schema'
import {
	Poppins_400Regular as Poppins,
	Poppins_500Medium as Poppins_Medium,
	Poppins_600SemiBold as Poppins_SemiBold,
	Poppins_700Bold as Poppins_Bold,
	useFonts,
} from '@expo-google-fonts/poppins'

import { AuthContext, AuthProvider } from './components/contexts/AuthContext'
import Loading from './screens/Loading'
import Home from './screens/Home'
import Login from './screens/Login'
import Register from './screens/Register'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AddRide from './screens/AddRide'
import Profile from './screens/Profile'
import { PermissionProvider } from './components/contexts/PermissionContext'
import { NotificationSettingsProvider, useNotificationSettings } from './components/contexts/NotificationContext'
import { LoadingOverlayProvider } from './components/contexts/LoadingOverlayContext'
import UpdatePassword from './screens/UpdatePassword'
import Cars from './screens/Cars'
import ManageCar from './screens/ManageCar'
import { ModeProvider } from './components/contexts/ModeContext'
import AccountSetup from './screens/AccountSetup'
import VerifyEmail from './screens/VerifyEmail'
import FirebaseApp from './components/FirebaseApp'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import * as Device from 'expo-device'
import * as Location from 'expo-location'
import * as SecureStore from 'expo-secure-store'
import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore'
import Settings from './screens/Settings'
import { StatusBar, StatusBarStyle } from 'expo-status-bar'
import FindRides from './screens/FindRides'
import MyRides from './screens/MyRides'
import ViewRide from './screens/ViewRide'
import Messages from './screens/Messages'
import Chat from './screens/Chat'
import ManageLicense from './screens/ManageLicense'
import { BACKGROUND_UPDATE_LOCATION_TASK, RideProvider } from './components/contexts/RideContext'
import { Timestamp } from '@firebase/firestore'
import Activity from './screens/Activity'
import EmergencyRides from './screens/EmergencyRides'

const Stack = createNativeStackNavigator()

const { db } = FirebaseApp

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: true,
			refetchOnMount: true,
			refetchOnReconnect: true,
			networkMode: 'online',
		},
	},
})

const theme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: 'darkred',
		background: 'white',
		primaryContainer: 'white',
		secondaryContainer: 'lightgray',
		text: 'black',
		transparent: 'transparent',
	},
}

const style = StyleSheet.create({
	safeArea: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
})

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK'

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
})

function handleRegistrationError(errorMessage: string) {
	alert(errorMessage)
	throw new Error(errorMessage)
}

const registerForPushNotificationsAsync = async () => {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		})
	}
	
	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync()
		let finalStatus = existingStatus
		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync()
			finalStatus = status
		}
		if (finalStatus !== 'granted') {
			handleRegistrationError(
				'Permission not granted to get push token for push notification!',
			)
			return
		}
		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ??
			Constants?.easConfig?.projectId
		
		if (!projectId) {
			handleRegistrationError('Project ID not found')
		}
		
		try {
			const pushTokenString = (
				await Notifications.getExpoPushTokenAsync({
					projectId,
				})
			).data
			console.log(pushTokenString)
			return pushTokenString
		} catch (e: unknown) {
			handleRegistrationError(`${e}`)
		}
	} else {
		handleRegistrationError(
			'Must use physical device for push notifications',
		)
	}
}

TaskManager.defineTask(
	BACKGROUND_NOTIFICATION_TASK,
	async ({ data, error }) => {
		console.log(
			`${Platform.OS} BACKGROUND-NOTIFICATION-TASK: App in ${AppState.currentState} state.`,
		)
		
		if (error) {
			console.log(
				`${
					Platform.OS
				} BACKGROUND-NOTIFICATION-TASK: Error! ${JSON.stringify(error)}`,
			)
			
			return
		}
		
		console.log(
			`${
				Platform.OS
			} BACKGROUND-NOTIFICATION-TASK: Received a notification in the background! ${JSON.stringify(
				data,
				null,
				2,
			)}`,
		)
		
		if (data) {
			await Notifications.scheduleNotificationAsync({
				content: {
					data: data,
				},
				trigger: null,
			})
		}
	},
)

TaskManager.defineTask(
	BACKGROUND_UPDATE_LOCATION_TASK,
	async ({ data, error }) => {
		if (error) {
			console.error(error)
			return
		}
		if (data) {
			const { locations } = data as { locations: Location.LocationObject[] }
			const location = locations[0]
			console.log('Location:', location)
			
			// Update the ride's location in the database
			const rideId = await SecureStore.getItemAsync('currentRide')
			const userId = await SecureStore.getItemAsync('userId')
			
			if (!rideId || !userId) {
				console.error('Ride ID or user ID is missing, but location updates still running')
				return
			} else {
				console.log('Updating location for ride:', rideId, 'and user:', userId)
			}
			
			await runTransaction(db, async (transaction) => {
				//create new signal object in the signals subcollection of the ride document
				const signalRef = doc(db, 'rides', rideId, 'signals', Timestamp.now().toMillis().toString())
				const signalDoc = await transaction.get(signalRef)
				
				console.log('Signal doc:', signalDoc.data())
				
				if (!signalDoc.exists()) {
					transaction.set(signalRef, {
						user: userId,
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
						timestamp: Timestamp.fromMillis(location.timestamp),
					} as Signal)
				}
			})
		}
	},
)

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

const compareNotificationSettings = async (userId: string, localSettings: ProfileNotificationSettings) => {
	const userRef = doc(db, 'users', userId)
	const userDoc = await getDoc(userRef)
	
	if (userDoc.exists()) {
		const dbSettings = userDoc.data().notification_settings as ProfileNotificationSettings | undefined
		
		if (!dbSettings) {
			return false
		}
		
		const areSettingsEqual = areObjectsEqual({ obj1: localSettings, obj2: dbSettings })
		
		console.log('Are notification settings equal:', areSettingsEqual)
		return areSettingsEqual
	} else {
		console.error('No such document!')
		return false
	}
}

const App = (): ReactElement => {
	const [isReady, setIsReady] = useState(Platform.OS === 'web') // Don't persist state on web since it's based on URL
	const [initialState, setInitialState] = useState()
	const [expoPushToken, setExpoPushToken] = useState('')
	const [, setNotification] = useState<
		Notifications.Notification | undefined
	>(undefined)
	const notificationListener = useRef<Notifications.Subscription>()
	const responseListener = useRef<Notifications.Subscription>()
	
	useEffect(() => {
		registerForPushNotificationsAsync()
			.then((token) => {
				setExpoPushToken(token ?? '')
				console.log({ token })
			})
			.catch((error: string) => setExpoPushToken(`${error}`))
		
		notificationListener.current =
			Notifications.addNotificationReceivedListener((notification) => {
				setNotification(notification)
			})
		
		responseListener.current =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					console.log(response)
				},
			)
		
		let isMounted = true
		
		const redirect = async (notification: Notifications.Notification) => {
			const url = notification.request.content.data?.url
			if (url) {
				await Linking.openURL(url)
			}
		}
		
		Notifications.getLastNotificationResponseAsync().then((response) => {
			if (!isMounted || !response?.notification) {
				return
			}
			
			redirect(response?.notification).then((r) => r)
		})
		
		const subscription =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					redirect(response.notification).then((r) => r)
				},
			)
		
		Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
			.then(() =>
				console.log('Background notification task registered successfully'),
			)
			.catch((error) =>
				console.error('Error registering background notification task:', error),
			)
		
		return () => {
			isMounted = false
			subscription.remove()
		}
	}, [])
	
	LogBox.ignoreAllLogs()
	
	const [fontsLoaded] = useFonts({
		Poppins,
		Poppins_Medium,
		Poppins_SemiBold,
		Poppins_Bold,
	})
	
	useEffect(() => {
		const restoreState = async () => {
			try {
				const initialUrl = await Linking.getInitialURL()
				
				if (initialUrl == null) {
					// Only restore state if there's no deep link
					const savedStateString = await AsyncStorage.getItem(
						PERSISTENCE_KEY,
					)
					const state = savedStateString
						? JSON.parse(savedStateString)
						: undefined
					
					if (state !== undefined) {
						setInitialState(state)
					}
				}
			} finally {
				setIsReady(true)
			}
		}
		
		if (!isReady) {
			restoreState().then(r => r)
		}
	}, [isReady])
	
	
	if (!isReady || !fontsLoaded) {
		return <Loading />
	}
	
	return (
		<SafeAreaProvider>
			<PaperProvider theme={theme}>
				<PermissionProvider>
					<NotificationSettingsProvider>
						<QueryClientProvider client={queryClient}>
							<LoadingOverlayProvider>
								<AuthProvider>
									<ModeProvider>
										<RideProvider>
											<NavigationContainer
												initialState={initialState}
												onStateChange={(state) => {
													AsyncStorage.setItem(
														PERSISTENCE_KEY,
														JSON.stringify(state),
													).then((r) => r)
												}}
											>
												<SafeAreaView
													style={style.safeArea}
												>
													<StatusBar
														style={
															'dark' as StatusBarStyle
														}
														hidden={false}
														translucent={false}
														backgroundColor={
															'transparent'
														}
													/>
													<Routes
														expoPushToken={
															expoPushToken
														}
													/>
												</SafeAreaView>
											</NavigationContainer>
										</RideProvider>
									</ModeProvider>
								</AuthProvider>
							</LoadingOverlayProvider>
						</QueryClientProvider>
					</NotificationSettingsProvider>
				</PermissionProvider>
			</PaperProvider>
		</SafeAreaProvider>
	)
}

const Routes = ({ expoPushToken }: { expoPushToken: string }) => {
	const { loading, user, profile } = useContext(AuthContext)
	const needsAccountSetup = !profile?.full_name || !profile?.mobile_number || !profile?.photo_url
	const { notificationSettings } = useNotificationSettings()
	
	//add expo push token to user profile in firestore if it is not empty and user is logged in
	useEffect(() => {
		if (user && profile && expoPushToken) {
			const userId = user.uid.toString()
			const userRef = doc(db, 'users', userId);
			
			(async () => {
				await runTransaction(db, async (transaction) => {
					const userDoc = await getDoc(userRef)
					
					if (userDoc.exists()) {
						const userDocData = userDoc.data() as ProfileType
						
						if (userDocData) {
							const oldExpoPushToken = userDocData.expoPushToken
							if (oldExpoPushToken !== expoPushToken) {
								transaction.update(userRef, {
									expoPushToken,
								})
								console.log('Expo push token updated')
							}
						}
					}
				})
					.catch((error) => {
						console.error(
							'Error adding expo push token to user profile:',
							error,
						)
					})
			})()
		}
	}, [user, expoPushToken, profile])
	
	useEffect(() => {
		if (!user || !profile) {
			return
		}
		
		(async () => {
			await compareNotificationSettings(user.uid, notificationSettings)
				.then((areEqual) => {
					if (!areEqual) {
						updateDoc(doc(db, 'users/' + user.uid), {
							notification_settings: notificationSettings,
						})
							.then(() => {
								console.log('Notification settings updated')
							})
							.catch((error) => {
								console.error(
									'Error updating notification settings:',
									error,
								)
							})
					}
				})
				.catch((error) => {
					console.error('Error comparing notification settings:', error)
				})
		})()
	}, [notificationSettings, profile, user])
	
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
			{loading ? (
				<Stack.Screen name="Loading" component={Loading} />
			) : user && profile ? (
				!needsAccountSetup ?
					<>
						<Stack.Screen name="Home" component={Home} />
						<Stack.Screen name="AddRide" component={AddRide} />
						<Stack.Screen name="Profile" component={Profile} />
						<Stack.Screen name="UpdatePassword" component={UpdatePassword}
						              initialParams={{ type: 'update' }} />
						<Stack.Screen name="Cars" component={Cars} />
						<Stack.Screen name="ManageCar" component={ManageCar} />
						<Stack.Screen name="VerifyEmail" component={VerifyEmail} />
						<Stack.Screen name="Settings" component={Settings} />
						<Stack.Screen name="MyRides" component={MyRides} />
						<Stack.Screen name="FindRides" component={FindRides} />
						<Stack.Screen name="ViewRide" component={ViewRide} />
						<Stack.Screen name="Messages" component={Messages} />
						<Stack.Screen name="Chat" component={Chat} />
						<Stack.Screen name="ManageLicense" component={ManageLicense} />
						<Stack.Screen name="Activity" component={Activity} />
						<Stack.Screen name="EmergencyRides" component={EmergencyRides} />
					</> :
					<Stack.Screen name="AccountSetup" component={AccountSetup} />
			) : (
				<>
					<Stack.Screen name="Login" component={Login} />
					<Stack.Screen name="Register" component={Register} />
				</>
			)}
		</Stack.Navigator>
	)
}

export default App
