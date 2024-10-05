import { Timestamp } from '@firebase/firestore'

type ProfileNotificationSettings = {
	new_rides: boolean;
	ride_updates: boolean;
	new_messages: boolean;
	new_passengers: boolean;
	booking_confirmation: boolean;
}

type Profile = {
	id?: string;
	roles: Role[];
	driver_license?: string;
	full_name: string;
	mobile_number: string;
	photo_url: string;
	deleted: boolean;
	expoPushToken?: string;
	notification_settings: ProfileNotificationSettings;
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
	started_at: Timestamp | null
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
	messages?: Message[]
}

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}

export { Profile, Car, Ride, Role, ProfileNotificationSettings, Message, MessageType }
