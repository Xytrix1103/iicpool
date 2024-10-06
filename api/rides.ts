import FirebaseApp from '../components/FirebaseApp'
import { Message, MessageType, Profile, Ride } from '../database/schema'
import { arrayRemove, arrayUnion, collection, doc, getDoc, runTransaction } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Alert, ToastAndroid } from 'react-native'
import { Timestamp } from '@firebase/firestore'

const { db } = FirebaseApp

const BASE_FARE = 1
const RATE_PER_KM = 0.2
const RATE_PER_MINUTE = 0.1

const getPassengers = async (rideId: string): Promise<(Profile | null)[]> => {
	const passengers: (Profile | null)[] = []
	
	const snapshot = await getDoc(doc(db, 'rides', rideId))
	if (snapshot.exists()) {
		const diff = snapshot.data()?.available_seats - snapshot.data()?.passengers.length
		
		for (const passenger of snapshot.data()?.passengers) {
			passengers.push(await getDoc(doc(db, 'users', passenger)).then((result) => {
				if (result.exists()) {
					return {
						...result.data(),
						id: result.id,
					} as Profile
				} else {
					return null
				}
			}))
		}
		
		if (diff > 0) {
			for (let i = 0; i < diff; i++) {
				passengers.push(null)
			}
		}
	}
	
	return passengers
}

const handleBookRide = ({ ride, user, isInRide }: { ride: Ride, user: User | null, isInRide: string | null }) => {
	Alert.alert(
		'Book Ride',
		'Are you sure you want to book this ride?' + (isInRide ? ' This will cancel your current booking.' : ''),
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Book',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (isInRide) {
							//cancel the current ride
							const currentRideRef = doc(db, 'rides', isInRide)
							
							transaction.update(currentRideRef, {
								passengers: arrayRemove(user?.uid),
							})
							
							//check if there is a messages sub-collection
							const messageRef = doc(collection(currentRideRef, 'messages'))
							
							transaction.set(messageRef, {
								message: null,
								user: user?.uid,
								sender: null,
								timestamp: Timestamp.now(),
								type: MessageType.PASSENGER_CANCELLATION,
							} as Message)
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							passengers: arrayUnion(user?.uid),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: null,
							user: user?.uid,
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.NEW_PASSENGER,
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('Ride booked successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to book ride', ToastAndroid.SHORT)
							console.error('Failed to book ride', error)
						})
				},
			},
		],
	)
}

const handleCancelBooking = ({ ride, user }: { ride: Ride, user: User | null }) => {
	Alert.alert(
		'Cancel Booking',
		'Are you sure you want to cancel your booking?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Cancel Booking',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							passengers: arrayRemove(user?.uid),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: null,
							user: user?.uid,
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.PASSENGER_CANCELLATION,
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('Booking cancelled successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to cancel booking', ToastAndroid.SHORT)
							console.error('Failed to cancel booking', error)
						})
				},
			},
		],
	)
}

export {
	getPassengers,
	handleBookRide,
	handleCancelBooking,
	BASE_FARE,
	RATE_PER_KM,
	RATE_PER_MINUTE,
}
