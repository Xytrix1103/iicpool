import { Timestamp } from '@firebase/firestore'

type ProfileNotificationSettings = {
	new_messages: boolean;
	ride_updates: boolean;
}

type Profile = {
	id?: string;
	roles: Role[];
	full_name: string;
	mobile_number: string;
	photo_url: string;
	expoPushToken?: string;
	notification_settings: ProfileNotificationSettings;
	created_at: Timestamp;
	deleted_at: Timestamp | null;
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

enum MessageType {
	MESSAGE = 'message',
	NEW_PASSENGER = 'new_passenger',
	PASSENGER_CANCELLATION = 'passenger_cancellation',
	RIDE_CANCELLATION = 'ride_cancellation',
	RIDE_COMPLETION = 'ride_completion',
	SOS = 'sos',
	SOS_RESPONSE = 'sos_response',
}

type Message = {
	id?: string
	sender: string | null
	user?: string
	message: string | null
	timestamp: Timestamp
	type: MessageType
	read_by: string[]
}

type Ride = {
	id?: string
	driver: string
	passengers: string[]
	to_campus: boolean
	car: string
	available_seats: number
	datetime: Timestamp
	created_at: Timestamp
	completed_at: Timestamp | null
	cancelled_at: Timestamp | null
	started_at: Timestamp | null
	sos: {
		triggered_at: Timestamp | null
		responded_at: Timestamp | null
		responded_by: string | null
		started_at: Timestamp | null
		car: string | null
	} | null
	fare: number
	location: {
		place_id: string
		formatted_address: string
		name: string
		geometry: {
			location: {
				lat: number
				lng: number
			},
		},
	}
	deleted_at: Timestamp | null
}

type RideLocation = {
	place_id: string
	formatted_address: string
	name: string
	geometry: {
		location: {
			lat: number
			lng: number
		},
	},
}

type Signal = {
	id?: string
	user: string
	latitude: number
	longitude: number
	timestamp: Timestamp
}

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}

export { Role, MessageType }
export type { Profile, Car, Ride, ProfileNotificationSettings, Message, Signal, RideLocation }

