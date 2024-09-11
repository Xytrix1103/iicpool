import { DocumentReference, Timestamp } from '@firebase/firestore'

type Profile = {
	roles: Role[];
	full_name: string;
	mobile_number: string;
	photo_url: string;
	deleted: boolean;
}

type Ride = {
	driver: DocumentReference
	passengers: DocumentReference[]
	to_campus: boolean
	location?: {
		place_id: string
		formatted_address: string
		geometry: {
			location: {
				lat: number
				lng: number
			},
		},
	}
	departure_time: Timestamp
	available_seats: number
	created_at: Timestamp
}

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}


export {
	Profile,
	Role,
}
