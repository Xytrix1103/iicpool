import { Car, Profile, Ride, RideLocation } from '../components/firebase/schema.ts'
import { get, post } from './axios_component.ts'

const refreshRides = async (callback?: (admins: RideTableRow[]) => void) => {
	try {
		return await get<RideTableRow[]>('/rides').then(callback ? callback : (rides) => rides)
	} catch (error) {
		console.error(error)
		return []
	}
}

const refreshRide = async (id: string, callback?: (ride: RideTableRow) => void) => {
	try {
		return await get<RideTableRow>(`/rides/${id}`)
			.then(callback ? callback : (ride) => {
				console.log('Ride:', ride)
				return ride
			})
			.catch((error) => {
				console.error('Error fetching ride:', error)
				return null
			})
	} catch (error) {
		console.error(error)
		return null
	}
}

const fetchCampusLocation = async (
	{
		address,
		callback,
	}: {
		address: string,
		callback?: (location: RideLocation) => void,
	},
) => {
	return await post<RideLocation>(`/rides/location`, { address })
		.then(callback ? callback : (location) => {
			console.log('Campus location:', location)
			return location
		})
		.catch((error) => {
			console.error('Error fetching address:', error)
			return null
		})
}

const getDirectionsByCoordinates = async ({ origin, destination, departure_time, waypoints }: {
	origin: { lat: number, lng: number },
	destination: { lat: number, lng: number },
	departure_time?: Date,
	waypoints?: { lat: number, lng: number }[],
}): Promise<DirectionsResponse | null> => {
	return await post<DirectionsResponse>('/rides/directions', {
		origin,
		destination,
		departure_time,
		waypoints,
	})
		.then((response) => {
			console.log('Directions:', response)
			return response
		})
		.catch((error) => {
			console.error('Error fetching directions:', error)
			return null
		})
}

type RideTableRow = Ride & {
	passengersData: Profile[]
	driverData: Profile
	driverCarData: Car
	sosResponderData: Profile | null
	sosResponderCarData: Car | null
}


interface GeocodedWaypoint {
	geocoder_status: string;
	place_id: string;
	types: string[];
}

interface Location {
	lat: number;
	lng: number;
}

interface Distance {
	text: string;
	value: number;
}

interface Duration {
	text: string;
	value: number;
}

interface Polyline {
	points: string;
}

interface Step {
	distance: Distance;
	duration: Duration;
	end_location: Location;
	html_instructions: string;
	polyline: Polyline;
	start_location: Location;
	travel_mode: string;
	maneuver?: string;
}

interface Leg {
	distance: Distance;
	duration: Duration;
	end_address: string;
	end_location: Location;
	start_address: string;
	start_location: Location;
	steps: Step[];
}

interface Route {
	bounds: {
		northeast: Location;
		southwest: Location;
	};
	copyrights: string;
	legs: Leg[];
	overview_polyline: Polyline;
	summary: string;
	warnings: string[];
}

interface DirectionsResponse {
	geocoded_waypoints: GeocodedWaypoint[];
	routes: Route[];
	status: string;
}

export type { RideTableRow, DirectionsResponse }
export { refreshRides, refreshRide, fetchCampusLocation, getDirectionsByCoordinates }
