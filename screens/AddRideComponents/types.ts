import { LatLng } from 'react-native-maps'

type RideFormTypeSingle = {
	place_id: string
	formatted_address: string
	geometry: {
		location: {
			lat: number
			lng: number
		}
	}
}

//create type for GooglePlaceDetail that specifies only the fields we need
type RideFormType = {
	campus: RideFormTypeSingle
	not_campus: RideFormTypeSingle
	departure_time?: Date
	available_seats?: number
	to_campus: boolean
}

type DirectionsObject = {
	path: LatLng[]
	bounds: DirectionsBounds
}

type DirectionsBounds = {
	northeast: LatLngLiteral
	southwest: LatLngLiteral
}

type LatLngLiteral = {
	lat: number
	lng: number
}

export {
	RideFormTypeSingle,
	RideFormType,
	DirectionsObject,
	DirectionsBounds,
	LatLngLiteral,
}
