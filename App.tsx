import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, DefaultTheme, Provider as PaperProvider } from 'react-native-paper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NavigationContainer from '@react-navigation/native/src/NavigationContainer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Linking, LogBox, Platform, StyleSheet } from 'react-native'
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
import NotificationSettingsProvider from './components/contexts/NotificationContext'
import { LoadingOverlayProvider } from './components/contexts/LoadingOverlayContext'
import UpdatePassword from './screens/UpdatePassword'
import Cars from './screens/Cars'

const Stack = createNativeStackNavigator()

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

const App = (): ReactElement => {
	const [isReady, setIsReady] = useState(Platform.OS === 'web') // Don't persist state on web since it's based on URL
	const [initialState, setInitialState] = useState()
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
		return <ActivityIndicator />
	}
	
	return (
		<SafeAreaProvider>
			<PaperProvider theme={theme}>
				<PermissionProvider>
					<NotificationSettingsProvider>
						<QueryClientProvider client={queryClient}>
							<LoadingOverlayProvider>
								<AuthProvider>
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
											<Routes />
										</SafeAreaView>
									</NavigationContainer>
								</AuthProvider>
							</LoadingOverlayProvider>
						</QueryClientProvider>
					</NotificationSettingsProvider>
				</PermissionProvider>
			</PaperProvider>
		</SafeAreaProvider>
	)
}

const Routes = () => {
	const { loading, user } = useContext(AuthContext)
	
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
			{loading ? (
				<Stack.Screen name="Loading" component={Loading} />
			) : user ? (
				<>
					<Stack.Screen name="Home" component={Home} />
					<Stack.Screen name="AddRide" component={AddRide} />
					<Stack.Screen name="Profile" component={Profile} />
					<Stack.Screen name="UpdatePassword" component={UpdatePassword} initialParams={{ type: 'update' }} />
					<Stack.Screen name="Cars" component={Cars} />
				</>
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
