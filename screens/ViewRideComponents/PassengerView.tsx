import React from 'react'
import { View } from 'react-native'
import style from '../../styles/shared'
import { Car, Profile, Ride } from '../../database/schema'
import { CustomDirectionsResponse } from '../AddRideComponents/types'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import MapViewComponent from './MapViewComponent'
import DriverInfoComponent from './DriverInfoComponent'
import CarInfoComponent from './CarInfoComponent'
import PassengersListComponent from './PassengersListComponent'
import MapView from 'react-native-maps'

type PassengerViewProps = {
	ride: Ride,
	car: Car | null,
	colors: MD3Colors,
	driver: Profile | null,
	directions: CustomDirectionsResponse | null,
	campusLocation: GooglePlaceDetail | null,
	mapRef: React.MutableRefObject<MapView | null>,
	passengers: (Profile | null)[],
};

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
	return (
		<View style={[style.column, { gap: 10 }]}>
			<MapViewComponent ride={ride} directions={directions} campusLocation={campusLocation} colors={colors}
			                  mapRef={mapRef} />
			<DriverInfoComponent driver={driver} />
			<CarInfoComponent car={car} />
			<PassengersListComponent ride={ride} passengers={passengers} />
		</View>
	)
}

export default PassengerView
