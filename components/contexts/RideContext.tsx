import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Ride } from '../../database/schema'
import { ModeContext } from './ModeContext'
import { doc, onSnapshot } from 'firebase/firestore'
import FirebaseApp from '../FirebaseApp'

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
	
	//use Location.startLocationUpdatesAsync and Location.stopLocationUpdatesAsync to update the ride's location in real time
	useEffect(() => {
		if (currentRide) {
			console.log('currentRide', currentRide)
		}
	}, [])
	
	return (
		<RideContext.Provider value={{ currentRide, setCurrentRide }}>
			{children}
		</RideContext.Provider>
	)
}

export const useRide = () => {
	const context = useContext(RideContext)
	
	if (!context) {
		throw new Error('useRide must be used within a RideProvider')
	}
	
	return context
}
