import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import { logger } from 'firebase-functions'

const expo = new Expo()

async function sendPushNotifications(tokens: string[], message: { title: string; message: string }) {
	logger.info('Sending push notifications', { tokens, message })
	const messages: ExpoPushMessage[] = tokens.map((token) => {
		if (!Expo.isExpoPushToken(token)) {
			logger.error(`Push token ${token} is not a valid Expo push token`)
			return null
		}
		
		return {
			to: token,
			sound: 'default',
			title: message.title,
			body: message.message,
		}
	}).filter(Boolean) as ExpoPushMessage[]
	
	const chunks = expo.chunkPushNotifications(messages)
	const tickets: ExpoPushTicket[] = []
	
	for (const chunk of chunks) {
		try {
			const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
			tickets.push(...ticketChunk)
		} catch (error) {
			logger.error('Error sending push notifications', { error })
		}
	}
	
	//@ts-expect-error - This is a known issue with the Expo SDK
	const receiptIds: string[] = tickets.filter(ticket => ticket?.id).map(ticket => (ticket?.id)!)
	const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)
	
	for (const chunk of receiptIdChunks) {
		try {
			const receipts = await expo.getPushNotificationReceiptsAsync(chunk)
			logger.info('Push notification receipts', { receipts })
			
			for (const receiptId in receipts) {
				const { status, details } = receipts[receiptId]
				if (status === 'error') {
					logger.error(`There was an error sending a notification: ${details}`)
					
					if (details && details.error) {
						logger.error(`The error code is ${details.error}`)
					}
				}
			}
		} catch (error) {
			logger.error('Error fetching push notification receipts', { error })
		}
	}
}

export { sendPushNotifications }
