import { Timestamp } from '@firebase/firestore'

type ProfileNotificationSettings = {
	new_messages: boolean;
	new_passengers: boolean;
	booking_confirmation: boolean;
	ride_cancellation: boolean;
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
	NEW_PASSENGER = 'new_passenger',
	RIDE_UPDATE = 'ride_update',
	RIDE_CANCELLATION = 'ride_cancellation',
	PASSENGER_CANCELLATION = 'passenger_cancellation',
	MESSAGE = 'message',
	
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

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}

export { Profile, Car, Ride, Role, ProfileNotificationSettings, Message, MessageType }
