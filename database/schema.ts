import { Timestamp } from '@firebase/firestore'

type Profile = {
	roles: Role[];
	full_name: string;
	mobile_number: string;
	photo_url?: string;
	deleted: boolean;
	expoPushToken?: string;
	created_at: Timestamp;
	deleted_at?: Timestamp;
}

type Car = {
	id?: string
	owner: string
	brand: string
	model: string
	color: string
	plate: string
	photo_url: string | null
	created_at: Timestamp
	deleted_at: Timestamp | null
}

type Ride = {
	driver: string
	passengers: string[]
	to_campus: boolean
	car: string
	available_seats: number
	datetime: Timestamp
	created_at: Timestamp
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
}

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}

export { Profile, Car, Ride, Role }
