import React, { ReactElement, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, DefaultTheme, Provider as PaperProvider } from 'react-native-paper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NavigationContainer from '@react-navigation/native/src/NavigationContainer'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Linking, LogBox, Platform, StyleSheet } from 'react-native'

import { AuthContext, AuthProvider } from './components/AuthContext'
import Loading from './screens/Loading'
import Home from './screens/Home'
import Login from './screens/Login'
import Register from './screens/Register'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RideToCampus from './screens/RideToCampus'
import Profile from './screens/Profile'

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
	},
})

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1'

const App = (): ReactElement => {
	const [isReady, setIsReady] = useState(Platform.OS === 'web') // Don't persist state on web since it's based on URL
	const [initialState, setInitialState] = useState()
	LogBox.ignoreAllLogs()
	
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
	
	
	if (!isReady) {
		return <ActivityIndicator />
	}
	
	return (
		<SafeAreaView style={style.safeArea}>
			<SafeAreaProvider>
				<PaperProvider theme={theme}>
					<QueryClientProvider client={queryClient}>
						<AuthProvider>
							<NavigationContainer
								initialState={initialState}
								onStateChange={state => {
									AsyncStorage.setItem(
										PERSISTENCE_KEY,
										JSON.stringify(state),
									).then(r => r)
								}}>
								<Routes />
							</NavigationContainer>
						</AuthProvider>
					</QueryClientProvider>
				</PaperProvider>
			</SafeAreaProvider>
		</SafeAreaView>
	)
}

const Routes = () => {
	const { loading, user } = useContext(AuthContext)
	
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			{loading ? (
				<Stack.Screen name="Loading" component={Loading} />
			) : user ? (
				<>
					<Stack.Screen name="Home" component={Home} />
					<Stack.Screen name="RideToCampus" component={RideToCampus} />
					<Stack.Screen name="Profile" component={Profile} />
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
