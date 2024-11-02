import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Ride } from '../../database/schema'
import { ModeContext } from './ModeContext'
import { doc, onSnapshot } from 'firebase/firestore'
import FirebaseApp from '../FirebaseApp'
import * as Location from 'expo-location'
import * as SecureStore from 'expo-secure-store'
import { AuthContext } from './AuthContext'
import { PermissionContext } from './PermissionContext'

export const BACKGROUND_UPDATE_LOCATION_TASK = 'BACKGROUND_UPDATE_LOCATION_TASK'

export const RideContext = createContext<RideContextType>({
	currentRide: null,
	setCurrentRide: () => {
	},
})

export type RideContextType = {
	currentRide: Ride | null,
	setCurrentRide: (ride: Ride | null) => void,
}

const { db } = FirebaseApp

export const RideProvider = ({ children }: { children: ReactNode }) => {
	const [currentRide, setCurrentRide] = useState<Ride | null>(null)
	const { isInRide, mode } = useContext(ModeContext)
	const { user } = useContext(AuthContext)
	const { wrapPermissions } = useContext(PermissionContext)
	
	useEffect(() => {
		let unsubscribe: () => void
		
		if (isInRide) {
			unsubscribe = onSnapshot(doc(db, 'rides', isInRide), (doc) => {
				setCurrentRide({
					id: doc.id,
					...doc.data(),
				} as Ride)
			})
		} else {
			setCurrentRide(null)
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [isInRide])
	
	//update secure storage with the current ride
	useEffect(() => {
		(async () => {
			if (isInRide) {
				await SecureStore.setItemAsync('currentRide', isInRide)
			} else {
				await SecureStore.deleteItemAsync('currentRide')
			}
		})()
	}, [isInRide])
	
	
	//use Location.startLocationUpdatesAsync and Location.stopLocationUpdatesAsync to update the ride's location in real time
	useEffect(() => {
		if (currentRide && isInRide) {
			if (currentRide.sos) {
				if (currentRide.sos.responded_by === user?.uid) {
					(async () => {
						await wrapPermissions({
							operation: async () => {
								console.log('Starting location updates')
								await Location.startLocationUpdatesAsync(BACKGROUND_UPDATE_LOCATION_TASK, {
									accuracy: Location.Accuracy.BestForNavigation,
									timeInterval: 1000,
									distanceInterval: 1,
									deferredUpdatesDistance: 1,
									deferredUpdatesInterval: 1000,
									mayShowUserSettingsDialog: true,
								})
							},
							type: 'backgroundLocation',
							message: 'We need background location permissions to update your ride location in real time',
						})
					})()
				}
			} else {
				if (currentRide.driver === user?.uid && mode === 'driver' && currentRide.started_at !== null && currentRide.completed_at === null && currentRide.cancelled_at === null) {
					(async () => {
						console.log('Starting location updates')
						await wrapPermissions({
							operation: async () => {
								await Location.startLocationUpdatesAsync(BACKGROUND_UPDATE_LOCATION_TASK, {
									accuracy: Location.Accuracy.BestForNavigation,
									timeInterval: 1000,
									distanceInterval: 1,
									deferredUpdatesDistance: 1,
									deferredUpdatesInterval: 1000,
									mayShowUserSettingsDialog: true,
								})
							},
							type: 'backgroundLocation',
							message: 'We need background location permissions to update your ride location in real time',
						})
					})()
				} else {
					console.log('Stopping location updates')
				}
			}
		} else {
			(async () => {
				console.log('Stopping location updates')
				await wrapPermissions({
					operation: async () => {
						await Location.stopLocationUpdatesAsync(BACKGROUND_UPDATE_LOCATION_TASK)
					},
					type: 'backgroundLocation',
					message: 'We need background location permissions to update your ride location in real time',
				})
			})()
		}
	}, [currentRide, isInRide])
	
	return (
		<RideContext.Provider value={{ currentRide, setCurrentRide }}>
			{children}
		</RideContext.Provider>
	)
}
