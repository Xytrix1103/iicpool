import { Timestamp } from 'firebase-admin/firestore'

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

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}

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

enum MessageType {
	NEW_PASSENGER = 'new_passenger',
	RIDE_COMPLETION = 'ride_completion',
	SOS_RESPONSE = 'sos_response',
	RIDE_CANCELLATION = 'ride_cancellation',
	PASSENGER_CANCELLATION = 'passenger_cancellation',
	SOS = 'sos',
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

export { Ride, Role, Profile, ProfileNotificationSettings, MessageType, Message }
