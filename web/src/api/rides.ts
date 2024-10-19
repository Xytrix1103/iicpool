import { Timestamp } from '@firebase/firestore'

type RideTableRow = {}

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