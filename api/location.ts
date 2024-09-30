import axios from 'axios'
import { LatLng } from 'react-native-maps'

const GMAPS_API_KEY = 'AIzaSyAZJLOFhRAzXUdviZBokuuKv4pfqyEpyxs'
const CAMPUS_ADDRESS = '1-Z, Lebuh Bukit Jambul, Bukit Jambul, 11900 Bayan Lepas, Pulau Pinang'
const CAMPUS_NAME = 'INTI International College Penang'

const getDirections = async ({ origin, destination }: {
	origin: string,
	destination: string
}): Promise<DirectionsResponse | null> => {
	console.log('getDirections:', origin, destination)
	const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json'
	const params = `origin=place_id:${origin}&destination=place_id:${destination}&mode=driving`
	
	const result = await axios.get<DirectionsResponse>(`${baseUrl}?${params}&key=${GMAPS_API_KEY}`, {
		headers: {
			'Content-Type': 'application/json',
		},
	})
	
	if (result.data.status === 'OK') {
		return result.data
	} else {
		console.error('Error fetching directions:', result.data)
		return null
	}
}

function decodePolyline(encoded: string): LatLng[] {
	let index = 0
	const len = encoded.length
	const coordinates = []
	let lat = 0
	let lng = 0
	
	while (index < len) {
		let b
		let shift = 0
		let result = 0
		
		// Decode latitude
		do {
			b = encoded.charCodeAt(index++) - 63
			result |= (b & 0x1f) << shift
			shift += 5
		} while (b >= 0x20)
		const dlat = (result & 1) ? ~(result >> 1) : (result >> 1)
		lat += dlat
		
		// Reset for longitude
		shift = 0
		result = 0
		
		// Decode longitude
		do {
			b = encoded.charCodeAt(index++) - 63
			result |= (b & 0x1f) << shift
			shift += 5
		} while (b >= 0x20)
		const dlng = (result & 1) ? ~(result >> 1) : (result >> 1)
		lng += dlng
		
		coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
	}
	
	return coordinates
}

const fetchCampusLocation = async (
	{
		address,
		callback,
	}: {
		address: string,
		callback?: (location: any) => void,
	},
) => {
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GMAPS_API_KEY}`
	
	try {
		const response = await axios.get(url, {
			headers: {
				'Content-Type': 'application/json',
			},
		})
		
		if (response) {
			console.log('Campus location:', response.data.results[0])
			
			if (callback) {
				callback(response.data.results[0])
			}
		}
	} catch (error) {
		console.error('Error fetching address:', error)
	}
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
	traffic_speed_entry: any[];
	via_waypoint: any[];
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
	waypoint_order: any[];
}

interface DirectionsResponse {
	geocoded_waypoints: GeocodedWaypoint[];
	routes: Route[];
	status: string;
}

export {
	GMAPS_API_KEY,
	CAMPUS_ADDRESS,
	CAMPUS_NAME,
	getDirections,
	decodePolyline,
	DirectionsResponse,
	fetchCampusLocation,
}
