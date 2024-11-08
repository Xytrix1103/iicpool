import FirebaseApp from '../components/FirebaseApp'
import { Car, Message, MessageType, Profile, Ride } from '../database/schema'
import { arrayRemove, arrayUnion, collection, doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { Alert, ToastAndroid } from 'react-native'

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
							read_by: [user?.uid],
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
							read_by: [user?.uid],
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

const handleCancelRide = ({ ride, user }: { ride: Ride, user: User | null }) => {
	//check if the ride is 30 minutes away
	const now = new Date()
	
	if (ride.datetime.toDate().getTime() - now.getTime() < 30 * 60 * 1000) {
		Alert.alert(
			'Cancel Ride',
			'You cannot cancel a ride that is less than 30 minutes away',
			[
				{
					text: 'OK',
					style: 'cancel',
				},
			],
		)
		
		return
	}
	
	Alert.alert(
		'Cancel Ride',
		'Are you sure you want to cancel this ride?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Cancel Ride',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							cancelled_at: Timestamp.now(),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: null,
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.RIDE_CANCELLATION,
							read_by: [user?.uid as string],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('Ride cancelled successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to cancel ride', ToastAndroid.SHORT)
							console.error('Failed to cancel ride', error)
						})
				},
			},
		],
	)
}

const handleStartRide = ({ ride, user }: { ride: Ride, user: User | null }) => {
	Alert.alert(
		'Start Ride',
		'Are you sure you want to start this ride?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Start Ride',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							started_at: Timestamp.now(),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: null,
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.RIDE_COMPLETION,
							read_by: [user?.uid],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('Ride started successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to start ride', ToastAndroid.SHORT)
							console.error('Failed to start ride', error)
						})
				},
			},
		],
	)
}

const handleCompleteRide = ({ ride, user }: { ride: Ride, user: User | null }) => {
	Alert.alert(
		'Complete Ride',
		'Are you sure you want to complete this ride?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Complete Ride',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							completed_at: Timestamp.now(),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: 'Ride has been completed',
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.RIDE_COMPLETION,
							read_by: [user?.uid],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('Ride completed successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to complete ride', ToastAndroid.SHORT)
							console.error('Failed to complete ride', error)
						})
				},
			},
		],
	)
}

const handleTriggerSOS = ({ ride, user }: { ride: Ride, user: User | null }) => {
	Alert.alert(
		'SOS',
		'Are you sure you want to send an SOS?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Send SOS',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							sos: {
								triggered_at: Timestamp.now(),
							},
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: 'SOS has been sent as there has been an emergency',
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.SOS,
							read_by: [user?.uid],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('SOS sent successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to send SOS', ToastAndroid.SHORT)
							console.error('Failed to send SOS', error)
						})
				},
			},
		],
	)
}

const handleRespondSOS = ({ ride, user, car }: { ride: Ride, user: User | null, car: Car }) => {
	Alert.alert(
		'Respond SOS',
		'Are you sure you want to respond to the SOS?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Respond SOS',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							'sos.responded_at': Timestamp.now(),
							'sos.responded_by': user?.uid,
							'sos.car': car.id,
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: 'SOS has been responded to',
							user: user?.uid,
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.SOS_RESPONSE,
							read_by: [user?.uid],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('SOS responded successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to respond to SOS', ToastAndroid.SHORT)
							console.error('Failed to respond to SOS', error)
						})
				},
			},
		],
	)
}

const handleStartSOSRide = ({ ride, user }: { ride: Ride, user: User | null }) => {
	Alert.alert(
		'Start SOS Ride',
		'Are you sure you want to start this SOS ride?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Start SOS Ride',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							'sos.started_at': Timestamp.now(),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: 'SOS ride has started',
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.SOS,
							read_by: [user?.uid],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('SOS ride started successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to start SOS ride', ToastAndroid.SHORT)
							console.error('Failed to start SOS ride', error)
						})
				},
			},
		],
	)
}

const handleCompleteSOSRide = ({ ride, user }: { ride: Ride, user: User | null }) => {
	Alert.alert(
		'Complete SOS Ride',
		'Are you sure you want to complete this SOS ride?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Complete SOS Ride',
				onPress: async () => {
					await runTransaction(db, async (transaction) => {
						if (!ride.id) {
							throw new Error('Ride ID is missing')
						}
						
						const rideRef = doc(db, 'rides', ride?.id || '')
						
						transaction.update(rideRef, {
							completed_at: Timestamp.now(),
						})
						
						//check if there is a messages sub-collection
						const messageRef = doc(collection(rideRef, 'messages'))
						
						transaction.set(messageRef, {
							message: 'SOS ride has been completed',
							sender: null,
							timestamp: Timestamp.now(),
							type: MessageType.SOS,
							read_by: [user?.uid],
						} as Message)
					})
						.then(() => {
							ToastAndroid.show('SOS ride completed successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							ToastAndroid.show('Failed to complete SOS ride', ToastAndroid.SHORT)
							console.error('Failed to complete SOS ride', error)
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
	handleCancelRide,
	handleStartRide,
	handleCompleteRide,
	handleTriggerSOS,
	handleRespondSOS,
	handleStartSOSRide,
	handleCompleteSOSRide,
	BASE_FARE,
	RATE_PER_KM,
	RATE_PER_MINUTE,
}
