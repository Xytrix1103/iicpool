import React, { useContext, useEffect, useState } from 'react'
import { View } from 'react-native'
import style from '../../styles/shared'
import { Car, Profile, Ride } from '../../database/schema'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import MapViewComponent from './MapViewComponent'
import DriverInfoComponent from './DriverInfoComponent'
import CarInfoComponent from './CarInfoComponent'
import PassengersListComponent from './PassengersListComponent'
import MapView from 'react-native-maps'
import { AuthContext } from '../../components/contexts/AuthContext'
import { ModeContext } from '../../components/contexts/ModeContext'
import { doc, onSnapshot } from 'firebase/firestore'
import FirebaseApp from '../../components/FirebaseApp'
import { DirectionsResponse } from '../../api/location'

type PassengerViewProps = {
	ride: Ride,
	car: Car | null,
	colors: MD3Colors,
	driver: Profile | null,
	directions: DirectionsResponse | null,
	campusLocation: GooglePlaceDetail | null,
	mapRef: React.MutableRefObject<MapView | null>,
	passengers: (Profile | null)[],
};

const { db } = FirebaseApp

const PassengerView: React.FC<PassengerViewProps> = (
	{
		ride,
		car,
		colors,
		driver,
		directions,
		campusLocation,
		mapRef,
		passengers,
	},
) => {
	const { user } = useContext(AuthContext)
	const { isInRide, mode } = useContext(ModeContext)
	const [currentRide, setCurrentRide] = useState<Ride | null>(null)
	
	useEffect(() => {
		let unsubscribe: () => void
		
		if (user && isInRide) {
			unsubscribe = onSnapshot(doc(db, 'rides', isInRide), (doc) => {
				setCurrentRide({
					id: doc.id,
					...doc.data(),
				} as Ride)
			})
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [user, isInRide])
	
	return (
		<View style={[style.column, { gap: 20 }]}>
			<MapViewComponent ride={ride} directions={directions} campusLocation={campusLocation} colors={colors}
			                  mapRef={mapRef} passengers={passengers} isInRide={isInRide} currentRide={currentRide}
			                  user={user} mode={mode} />
			<DriverInfoComponent driver={driver} />
			<CarInfoComponent car={car} />
			<PassengersListComponent ride={ride} passengers={passengers} isInRide={isInRide} />
		</View>
	)
}

export default PassengerView
