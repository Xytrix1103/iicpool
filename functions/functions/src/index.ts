/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { Message, MessageType, Profile, Ride } from './database'
import { sendPushNotifications } from './notifications'

//set region to asia-southeast2

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Initialize the Firebase Admin SDK
initializeApp()

// Set global options
setGlobalOptions({
	timeoutSeconds: 540,
	memory: '2GiB',
	region: 'asia-southeast1',
})

const auth = getAuth()
const firestore = getFirestore()

// authentication function to return an email's sign-in methods
export const getSignInMethods = onRequest(async (request, response) => {
	const { email } = request.body
	
	if (!email) {
		response.status(400).send('Email is required')
		return
	}
	
	try {
		const result = await auth.getUserByEmail(email)
		response.send(result)
	} catch (error) {
		response.status(500).send(error)
	}
})

export const getUserInfo = onCall(async (request) => {
	const { email } = request.data
	
	if (!email || email === '') {
		throw new HttpsError('invalid-argument', 'Email is required')
	}
	
	try {
		return await auth.getUserByEmail(email)
	} catch (error) {
		throw new HttpsError('not-found', 'User not found')
	}
})

export const checkEmailGoogleSignIn = onCall(async (request) => {
	const { email } = request.data
	
	if (!email || email === '') {
		throw new HttpsError('invalid-argument', 'Email is required')
	}
	
	if (!email.endsWith('newinti.edu.my')) {
		throw new HttpsError('invalid-argument', 'Please use your INTI email to login')
	}
	
	const user = await auth.getUserByEmail(email)
	
	if (!(user.providerData.some(provider => provider.providerId === 'google.com'))) {
		throw new HttpsError('not-found', 'Google account not linked to any account')
	}
	
	return user
})

//every minute, check if there are any rides that are due in exactly 15 minutes, and cancel them if there are no passengers
export const expireEmptyRides = onSchedule('every 1 minutes', async (event) => {
	const rides = await firestore.collection('rides').where('started_at', '==', null).where('completed_at', '==', null).where('cancelled_at', '==', null).where('passengers', '==', []).get()
	
	const now = new Date()
	
	const fifteenMinutes = 15 * 60 * 1000
	
	rides.forEach(ride => {
		const rideData = ride.data()
		
		const rideTime = rideData.datetime.toDate()
		
		if (rideTime.getTime() - now.getTime() <= fifteenMinutes) {
			firestore.collection('rides').doc(ride.id).update({
				cancelled_at: Timestamp.now(),
			})
		}
	})
})

// when a ride is created, notify the driver
export const triggerNewRideNotifications = onDocumentCreated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	const ride = {
		...(event.data?.data() as Ride),
		id: rideId,
	}
	
	const driver = await firestore.collection('users').doc(ride.driver).get()
	
	const driverData = {
		...(driver.data() as Profile),
		id: driver.id,
	}
	
	console.log('Driver:', driverData)
	
	// send notification to driver
	if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
		// send notification
		await sendPushNotifications(
			[driverData.expoPushToken],
			{
				title: 'New Ride Created',
				message: 'You have created a new ride successfully',
			},
		)
	}
})

//when a ride is cancelled, notify the driver
// if there are no passengers, it would be cancelled automatically
// if there are passengers, notify them that the ride has been cancelled
export const triggerCancelledRideNotifications = onDocumentUpdated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	//skip if the ride is being created
	if (!event.data?.before.exists) {
		return
	}
	
	const beforeRide = {
		...(event.data?.before.data() as Ride),
		id: rideId,
	}
	
	const afterRide = {
		...(event.data?.after.data() as Ride),
		id: rideId,
	}
	
	if (beforeRide.cancelled_at || afterRide.cancelled_at) {
		return
	}
	
	const driver = await firestore.collection('users').doc(afterRide.driver).get()
	
	const driverData = {
		...(driver.data() as Profile),
		id: driver.id,
	}
	
	console.log('Driver:', driverData)
	
	// send notification to driver
	if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
		// send notification
		await sendPushNotifications(
			[driverData.expoPushToken],
			{
				title: 'Ride Cancelled',
				message: 'Your ride has been cancelled',
			},
		)
	}
	
	// send notification to passengers
	for (const passengerId of afterRide.passengers) {
		const passenger = await firestore.collection('users').doc(passengerId).get()
		
		const passengerData = {
			...(passenger.data() as Profile),
			id: passenger.id,
		}
		
		if (passengerData.expoPushToken && passengerData.notification_settings.ride_updates) {
			// send notification
			await sendPushNotifications(
				[passengerData.expoPushToken],
				{
					title: 'Ride Cancelled',
					message: 'The ride you have booked has been cancelled',
				},
			)
		}
	}
})

//when a ride is started, notify the driver and passengers and let them know that their location is being tracked for safety purposes
export const triggerStartedRideNotifications = onDocumentUpdated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	//skip if the ride is being created
	if (!event.data?.before.exists) {
		return
	}
	
	const beforeRide = {
		...(event.data?.before.data() as Ride),
		id: rideId,
	}
	
	const afterRide = {
		...(event.data?.after.data() as Ride),
		id: rideId,
	}
	
	if (beforeRide.started_at || !afterRide.started_at) {
		return
	}
	
	const driver = await firestore.collection('users').doc(afterRide.driver).get()
	
	const driverData = {
		...(driver.data() as Profile),
		id: driver.id,
	}
	
	console.log('Driver:', driverData)
	
	// send notification to driver
	if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
		// send notification
		await sendPushNotifications(
			[driverData.expoPushToken],
			{
				title: 'Ride Started',
				message: 'Your ride has started. Your location is being tracked for safety purposes',
			},
		)
	}
	
	// send notification to passengers
	for (const passengerId of afterRide.passengers) {
		const passenger = await firestore.collection('users').doc(passengerId).get()
		
		const passengerData = {
			...(passenger.data() as Profile),
			id: passenger.id,
		}
		
		if (passengerData.expoPushToken && passengerData.notification_settings.ride_updates) {
			// send notification
			await sendPushNotifications(
				[passengerData.expoPushToken],
				{
					title: 'Ride Started',
					message: 'Your ride has started. Your location is being tracked for safety purposes',
				},
			)
		}
	}
})

//when a ride is completed, notify the driver and passengers
export const triggerCompletedRideNotifications = onDocumentUpdated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	//skip if the ride is being created
	if (!event.data?.before.exists) {
		return
	}
	
	const beforeRide = {
		...(event.data?.before.data() as Ride),
		id: rideId,
	}
	
	const afterRide = {
		...(event.data?.after.data() as Ride),
		id: rideId,
	}
	
	if (beforeRide.completed_at || !afterRide.completed_at) {
		return
	}
	
	const driver = await firestore.collection('users').doc(afterRide.driver).get()
	
	const driverData = {
		...(driver.data() as Profile),
		id: driver.id,
	}
	
	console.log('Driver:', driverData)
	
	// send notification to driver
	if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
		// send notification
		await sendPushNotifications(
			[driverData.expoPushToken],
			{
				title: 'Ride Completed',
				message: afterRide.sos ? 'The SOS has been resolved and your ride has been completed' : 'Your ride has been completed',
			},
		)
	}
	
	// send notification to passengers
	for (const passengerId of afterRide.passengers) {
		const passenger = await firestore.collection('users').doc(passengerId).get()
		
		const passengerData = {
			...(passenger.data() as Profile),
			id: passenger.id,
		}
		
		if (passengerData.expoPushToken && passengerData.notification_settings.ride_updates) {
			// send notification
			await sendPushNotifications(
				[passengerData.expoPushToken],
				{
					title: 'Ride Completed',
					message: afterRide.sos ? 'The SOS has been resolved and your ride has been completed' : 'Your ride has been completed',
				},
			)
		}
	}
})

// when an SOS is triggered, notify the driver and passengers, and notify all other active driver accounts
export const triggerSOSEvent = onDocumentUpdated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	//skip if the ride is being created
	if (!event.data?.before.exists) {
		return
	}
	
	const beforeRide = {
		...(event.data?.before.data() as Ride),
		id: rideId,
	}
	
	const afterRide = {
		...(event.data?.after.data() as Ride),
		id: rideId,
	}
	
	if (!beforeRide.sos?.triggered_at && afterRide.sos?.triggered_at) {
		const driver = await firestore.collection('users').doc(afterRide.driver).get()
		
		const driverData = {
			...(driver.data() as Profile),
			id: driver.id,
		}
		
		console.log('Driver:', driverData)
		
		// send notification to driver
		if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
			// send notification
			await sendPushNotifications(
				[driverData.expoPushToken],
				{
					title: 'SOS Triggered',
					message: 'An SOS has been triggered. Your location is being tracked for safety purposes',
				},
			)
		}
		
		// send notification to passengers
		for (const passengerId of afterRide.passengers) {
			const passenger = await firestore.collection('users').doc(passengerId).get()
			
			const passengerData = {
				...(passenger.data() as Profile),
				id: passenger.id,
			}
			
			if (passengerData.expoPushToken && passengerData.notification_settings.ride_updates) {
				// send notification
				await sendPushNotifications(
					[passengerData.expoPushToken],
					{
						title: 'SOS Triggered',
						message: 'An SOS has been triggered. Your location is being tracked for safety purposes',
					},
				)
			}
		}
		
		// send notification to all other active drivers
		const drivers = await firestore.collection('users').where('roles', 'array-contains', 'driver').get()
		
		await Promise.all(drivers.docs.map(async driver => {
			const driverData = {
				...(driver.data() as Profile),
				id: driver.id,
			}
			
			if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
				// send notification
				await sendPushNotifications(
					[driverData.expoPushToken],
					{
						title: 'SOS Triggered',
						message: 'An SOS has been triggered. Your location is being tracked for safety purposes',
					},
				)
			}
		}))
	}
})

export const triggerSOSResponseEvent = onDocumentUpdated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	//skip if the ride is being created
	if (!event.data?.before.exists) {
		return
	}
	
	const beforeRide = {
		...(event.data?.before.data() as Ride),
		id: rideId,
	}
	
	const afterRide = {
		...(event.data?.after.data() as Ride),
		id: rideId,
	}
	
	if (!beforeRide.sos?.responded_at && afterRide.sos?.responded_at) {
		const driver = await firestore.collection('users').doc(afterRide.driver).get()
		
		const driverData = {
			...(driver.data() as Profile),
			id: driver.id,
		}
		
		console.log('Driver:', driverData)
		
		// send notification to driver
		if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
			// send notification
			await sendPushNotifications(
				[driverData.expoPushToken],
				{
					title: 'SOS Response',
					message: 'An SOS has been responded to. Your location is being tracked for safety purposes',
				},
			)
		}
		
		// send notification to passengers
		for (const passengerId of afterRide.passengers) {
			const passenger = await firestore.collection('users').doc(passengerId).get()
			
			const passengerData = {
				...(passenger.data() as Profile),
				id: passenger.id,
			}
			
			if (passengerData.expoPushToken && passengerData.notification_settings.ride_updates) {
				// send notification
				await sendPushNotifications(
					[passengerData.expoPushToken],
					{
						title: 'SOS Response',
						message: 'An SOS has been responded to. Your location is being tracked for safety purposes',
					},
				)
			}
		}
	}
})

export const triggerSOSStartedEvent = onDocumentUpdated('rides/{rideId}', async (event) => {
	const rideId = event.params.rideId
	//skip if the ride is being created
	if (!event.data?.before.exists) {
		return
	}
	
	const beforeRide = {
		...(event.data?.before.data() as Ride),
		id: rideId,
	}
	
	const afterRide = {
		...(event.data?.after.data() as Ride),
		id: rideId,
	}
	
	if (!beforeRide.sos?.started_at && afterRide.sos?.started_at) {
		const driver = await firestore.collection('users').doc(afterRide.driver).get()
		
		const driverData = {
			...(driver.data() as Profile),
			id: driver.id,
		}
		
		console.log('Driver:', driverData)
		
		// send notification to driver
		if (driverData.expoPushToken && driverData.notification_settings.ride_updates) {
			// send notification
			await sendPushNotifications(
				[driverData.expoPushToken],
				{
					title: 'SOS Started',
					message: 'An SOS has been started. Your location is being tracked for safety purposes',
				},
			)
		}
		
		// send notification to passengers
		for (const passengerId of afterRide.passengers) {
			const passenger = await firestore.collection('users').doc(passengerId).get()
			
			const passengerData = {
				...(passenger.data() as Profile),
				id: passenger.id,
			}
			
			if (passengerData.expoPushToken && passengerData.notification_settings.ride_updates) {
				// send notification
				await sendPushNotifications(
					[passengerData.expoPushToken],
					{
						title: 'SOS Started',
						message: 'An SOS has been started. Your location is being tracked for safety purposes',
					},
				)
			}
		}
	}
})

export const notifyNewMessage = onDocumentCreated('rides/{rideId}/messages/{messageId}', async (event) => {
	const rideId = event.params.rideId
	const messageId = event.params.messageId
	const message = {
		...(event.data?.data() as Message),
		id: messageId,
	}
	
	const userSender = await firestore.collection('users').doc(message.sender || message.user || '').get()
	
	const userSenderData = {
		...(userSender.data() as Profile),
		id: userSender.id,
	}
	
	const ride = await firestore.collection('rides').doc(rideId).get()
	
	const rideData = {
		...(ride.data() as Ride),
		id: ride.id,
	}
	
	const involvedUsers = [...new Set((
		rideData.sos?.responded_by ?
			[rideData.driver, ...rideData.passengers, rideData.sos?.responded_by] :
			[rideData.driver, ...rideData.passengers]
	))].filter((value) => value !== (message.sender || message.user))
	
	console.log('Involved users:', involvedUsers)
	
	const users = await firestore.getAll(...involvedUsers.map(userId => firestore.collection('users').doc(userId || '')))
	
	const userData = users.map(user => ({
		...(user.data() as Profile),
		id: user.id,
	}))
	
	console.log('Users:', userData)
	
	const sosResponder = rideData.sos?.responded_by ? await firestore.collection('users').doc(rideData.sos.responded_by).get() : null
	const sosResponderData = sosResponder ? {
		...(sosResponder.data() as Profile),
		id: sosResponder.id,
	} : null
	
	// send notification to users
	for (const user of userData) {
		if (user.expoPushToken && user.notification_settings.new_messages) {
			// send notification
			await sendPushNotifications(
				[user.expoPushToken],
				{
					title: 'New Message',
					message: message.type === MessageType.MESSAGE ?
						`${userSenderData.full_name.split(' ')[0]}: ${message.message}` :
						message.type === MessageType.NEW_PASSENGER ?
							`${userSenderData.full_name} has joined the ride` :
							message.type === MessageType.PASSENGER_CANCELLATION ?
								`${userSenderData.full_name} has left the ride` :
								message.type === MessageType.RIDE_CANCELLATION ?
									'The ride has been cancelled' :
									message.type === MessageType.RIDE_COMPLETION ?
										'The ride has been completed' :
										message.type === MessageType.SOS ?
											'An SOS has been triggered for this ride' :
											message.type === MessageType.SOS_RESPONSE ?
												`${sosResponderData?.full_name} has responded to the SOS` :
												'New message',
				},
			)
		}
	}
})
