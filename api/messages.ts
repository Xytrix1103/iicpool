import { Message, Ride } from '../database/schema'
import { User } from 'firebase/auth'
import { collection, doc, runTransaction } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { Timestamp } from '@firebase/firestore'

const { db } = FirebaseApp

const sendMessage = async ({ user, ride, message }: { user: User | null, ride: Ride, message: string }) => {
	console.log('Sending message', message)
	
	if (!ride.id) {
		throw new Error('Ride ID is missing')
	}
	
	if (!user) {
		throw new Error('User is missing')
	}
	
	const messageRef = doc(collection(doc(db, 'rides', ride.id), 'messages'))
	
	await runTransaction(db, async (transaction) => {
		transaction.set(messageRef, {
			sender: user.uid,
			message: message,
			timestamp: Timestamp.now(),
			type: 'message',
		} as Message)
	})
}

export {
	sendMessage,
}
