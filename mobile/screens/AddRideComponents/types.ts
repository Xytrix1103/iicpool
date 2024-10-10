import { LatLng } from 'react-native-maps'

type RideFormTypeSingle = {
	place_id: string
	formatted_address: string
	name: string
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
	datetime?: Date
	car?: string
	available_seats?: number
	to_campus: boolean
	is_free: boolean
	fare: number
}


type TimeZoneTextValueObject = {
	text: string;
	time_zone: string;
	value: number;
};

type DirectionsStep = {
	duration: TextValueObject;
	end_location: LatLngLiteral;
	html_instructions: string;
	polyline: DirectionsPolyline;
	start_location: LatLngLiteral;
	travel_mode: string;
	distance?: TextValueObject;
	maneuver?: string;
	steps?: DirectionsStep[];
};

type DirectionsLeg = {
	end_address: string;
	end_location: LatLngLiteral;
	start_address: string;
	start_location: LatLngLiteral;
	steps: DirectionsStep[];
	arrival_time?: TimeZoneTextValueObject;
	departure_time?: TimeZoneTextValueObject;
	distance?: TextValueObject;
	duration?: TextValueObject;
	duration_in_traffic?: TextValueObject;
};

type TextValueObject = {
	text: string;
	value: number;
};

type DirectionsPolyline = {
	points: string;
};

type Bounds = {
	northeast: LatLngLiteral;
	southwest: LatLngLiteral;
};

type DirectionsRoute = {
	bounds: Bounds;
	copyrights: string;
	legs: DirectionsLeg[];
	overview_polyline: DirectionsPolyline;
	summary: string;
	warnings: string[];
	waypoint_order: number[];
};

type CustomDirectionsResponse = {
	routes: DirectionsRoute[];
	error_message?: string;
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
	CustomDirectionsResponse,
}
