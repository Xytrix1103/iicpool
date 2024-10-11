import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Car, Message, MessageType, Profile, Ride } from '../database/schema'
import React, { useContext, useEffect, useState } from 'react'
import {
	arrayUnion,
	collection,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	orderBy,
	query,
	runTransaction,
} from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { View } from 'react-native'
import CustomText from '../components/themed/CustomText'
import style from '../styles/shared'
import { User } from 'firebase/auth'
import { Avatar } from 'react-native-paper'
import CustomInput from '../components/themed/CustomInput'
import CustomIconButton from '../components/themed/CustomIconButton'
import { Controller, useForm } from 'react-hook-form'
import { sendMessage } from '../api/messages'
import { AuthContext } from '../components/contexts/AuthContext'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

type ChatRouteParams = RouteProp<{ Chat: { rideId: string } }, 'Chat'>

type CustomChat = Ride & {
	passengersData?: Profile[]
	driverData?: Profile
	sosResponderData?: Profile
	carData?: Car
}

const { db } = FirebaseApp

const MessageComponent = ({ group, photo_url, user, passengerData, driverData, sosResponderData }: {
	group: MessageGroupBySender,
	photo_url?: string,
	user: User | null,
	passengerData?: Profile[],
	driverData?: Profile,
	sosResponderData?: Profile,
}) => {
	return (
		<View style={[style.row, { gap: 10, alignItems: 'flex-start' }]}>
			{
				group.type !== MessageType.MESSAGE ?
					<View style={[style.row]}>
						<View style={[style.column]}>
							<CustomText color={group.type !== MessageType.SOS ? 'gray' : 'red'} size={12}
							            align="center">
								{
									group.type === MessageType.NEW_PASSENGER ?
										`${passengerData?.find((passenger) => passenger.id === group.user)?.full_name} has joined the ride` :
										group.type === MessageType.PASSENGER_CANCELLATION ?
											`${passengerData?.find((passenger) => passenger.id === group.user)?.full_name} has left the ride` :
											group.type === MessageType.RIDE_CANCELLATION ?
												`${driverData?.full_name} has cancelled the ride` :
												group.type === MessageType.RIDE_COMPLETION ?
													'Ride has been completed' :
													group.type === MessageType.SOS ?
														`${passengerData?.find((passenger) => passenger.id === group.user)?.full_name} has sent an SOS` :
														group.type === MessageType.SOS_RESPONSE ?
															`${driverData?.full_name} has responded to the SOS` :
															''
								}
							</CustomText>
						</View>
					</View> :
					<View
						style={[style.row, {
							justifyContent: group.sender === user?.uid ? 'flex-end' : 'flex-start',
							alignItems: 'flex-end',
						}]}>
						{
							group.sender !== user?.uid &&
							<View style={[style.column, {
								width: 60,
								alignItems: 'flex-start',
								justifyContent: 'center',
							}]}>
								<Avatar.Image size={50} source={{ uri: photo_url }} />
							</View>
						}
						<View style={[style.column, { gap: 10, maxWidth: '80%', width: 'auto' }]}>
							{
								group.messages.map((message, index) => (
									<View key={message.id} style={[style.row, {
										padding: 10,
										borderRadius: 10,
										elevation: 5,
										backgroundColor: 'white',
										width: 'auto',
										flexShrink: 1,
										alignSelf: message.sender === user?.uid ? 'flex-end' : 'flex-start',
									}]}>
										<View style={[style.column, { width: 'auto', flexShrink: 1 }]}>
											<CustomText size={12} width="auto" align="left" style={{ flexShrink: 1 }}>
												{message.message}
											</CustomText>
										</View>
									</View>
								))
							}
						</View>
					</View>
			}
		</View>
	)
}

type MessageGroupBySender = {
	sender: string | null
	type: MessageType
	user?: string
	messages: Message[]
}

const Chat = () => {
	const route = useRoute<ChatRouteParams>()
	const rideId = route.params.rideId as string
	const [chat, setChat] = useState<CustomChat | null>(null)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const navigation = useNavigation()
	const { user } = useContext(AuthContext)
	const [messages, setMessages] = useState<Message[]>([])
	const [messageGroups, setMessageGroups] = useState<MessageGroupBySender[]>([])
	
	const form = useForm<{ message: string }>({
		defaultValues: {
			message: '',
		},
	})
	
	const handleSendMessage = async (data: { message: string }) => {
		console.log('Send message:', data)
		
		if (data.message === '') {
			return
		}
		
		await sendMessage({
			user: FirebaseApp.auth.currentUser,
			ride: chat as Ride,
			message: data.message,
		})
			.then(() => {
				form.setValue('message', '')
			})
			.catch((error) => {
				console.error('Error sending message:', error)
			})
	}
	
	useEffect(() => {
		const unsubscribe = onSnapshot(doc(db, 'rides', rideId), async (snapshotDoc) => {
			setLoadingOverlay({
				show: true,
				message: 'Loading messages...',
			})
			const chatData = {
				...snapshotDoc.data(),
				id: snapshotDoc.id,
			} as Ride
			
			//get all users involved in messages
			const messageRef = collection(doc(db, 'rides', rideId), 'messages')
			const messageSnapshot = await getDocs(messageRef)
			
			const users = new Set<string>()
			
			messageSnapshot.docs.forEach((doc) => {
				const data = doc.data() as Message
				
				if (data.sender && !users.has(data.sender)) {
					users.add(data.sender)
				} else if (data.user && !users.has(data.user)) {
					users.add(data.user)
				}
			})
			
			const passengersData = await Promise.all(
				Array.from(users).map(async (passengerId) => {
					const result = await getDoc(doc(db, 'users', passengerId))
					return {
						...result.data(),
						id: result.id,
					} as Profile
				}),
			).catch((error) => {
				console.error('Error getting passengers:', error)
				return [] as Profile[]
			})
			
			const driverData = await getDoc(doc(db, 'users', chatData.driver)).then((result) => {
				return {
					...result.data(),
					id: result.id,
				} as Profile
			}).catch((error) => {
				console.error('Error getting driver:', error)
				return undefined
			})
			
			const carData = await getDoc(doc(db, 'cars', chatData.car)).then((result) => {
				return {
					...result.data(),
					id: result.id,
				} as Car
			}).catch((error) => {
				console.error('Error getting car:', error)
				return undefined
			})
			
			const sosResponderData = chatData.sos?.responded_by ? await getDoc(doc(db, 'users', chatData.sos.responded_by)).then((result) => {
				return {
					...result.data(),
					id: result.id,
				} as Profile
			}).catch((error) => {
				console.error('Error getting sos responder:', error)
				return undefined
			}) : undefined
			
			setChat({
				...chatData,
				passengersData,
				driverData,
				carData,
				sosResponderData,
			})
			
			setLoadingOverlay({
				show: false,
				message: '',
			})
		})
		
		return () => unsubscribe()
	}, [rideId])
	
	useEffect(() => {
		const unsubscribe = onSnapshot(query(collection(doc(db, 'rides', rideId), 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
			setMessages(snapshot.docs.map((doc, index) => {
				const data = doc.data() as Message
				return {
					...data,
					id: doc.id,
				} as Message
			}))
		})
		
		return () => unsubscribe()
	}, [rideId])
	
	// on load, mark all messages as read
	useEffect(() => {
		(async () => {
			console.log('Marking messages as read')
			await runTransaction(db, async (transaction) => {
				const messageRef = collection(doc(db, 'rides', rideId), 'messages')
				
				const snapshot = await getDocs(messageRef)
				
				snapshot.docs.forEach((doc) => {
					transaction.update(doc.ref, {
						read_by: arrayUnion(user?.uid),
					})
				})
			})
				.then(() => {
					console.log('Messages marked as read')
				})
				.catch((error) => {
					console.error('Error marking messages as read:', error)
				})
		})()
	}, [messages, rideId, user])
	
	useEffect(() => {
		const groups: MessageGroupBySender[] = []
		let currentGroup: MessageGroupBySender | null = null
		
		messages.forEach((message) => {
			if (message.sender === null) {
				// System message, create a new group for each
				groups.push({
					sender: null,
					type: message.type,
					user: message.user,
					messages: [message],
				})
			} else if (currentGroup === null || currentGroup.sender !== message.sender || currentGroup.type !== message.type) {
				// New group for different sender or message type
				currentGroup = {
					sender: message.sender,
					type: message.type,
					user: message.user,
					messages: [message],
				}
				groups.push(currentGroup)
			} else {
				// Add to current group
				currentGroup.messages.push(message)
			}
		})
		
		setMessageGroups(groups)
	}, [messages])
	
	return (
		<CustomLayout
			scrollable={false}
			contentPadding={0}
			header={
				<CustomHeader
					title="Chat"
					navigation={navigation}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.row, { gap: 20, flex: 1, justifyContent: 'flex-start' }]}>
					<CustomLayout
						scrollable={true}
						alwaysScrollToBottom={true}
					>
						<View style={style.mainContent}>
							<View style={[style.column, { gap: 20 }]}>
								{
									chat &&
									<View
										style={[style.row, {
											gap: 15,
											backgroundColor: 'white',
											elevation: 5,
											padding: 20,
											borderRadius: 30,
										}]}
									>
										<View style={[style.column, { gap: 20, flex: 1 }]}>
											<View style={[style.row, { gap: 5, justifyContent: 'space-between' }]}>
												<View style={[style.row, { gap: 5, width: 'auto' }]}>
													<Icon
														name="map-marker"
														size={20}
													/>
													<CustomText
														size={14}
														numberOfLines={1}
													>
														{chat.to_campus ? 'From' : 'To'} {chat.location.name}
													</CustomText>
												</View>
												<View style={[style.row, { gap: 5, width: 'auto' }]}>
													<CustomText size={12} bold
													            color={chat.completed_at ? 'green' : chat.started_at ? 'blue' : 'black'}>
														{
															chat.completed_at ? 'Completed' :
																chat.started_at ? 'Ongoing' :
																	'Pending'
														}
													</CustomText>
												</View>
											</View>
											<View style={[style.row, { gap: 10 }]}>
												<View style={[style.row, { gap: 5, width: 'auto' }]}>
													<Icon name="calendar" size={20} />
													<CustomText size={12} bold>
														{chat.datetime.toDate().toLocaleString('en-GB', {
															day: 'numeric',
															month: 'numeric',
															year: 'numeric',
														})}
													</CustomText>
												</View>
												<View style={[style.row, { gap: 5, width: 'auto' }]}>
													<Icon name="clock" size={20} />
													<CustomText size={12} bold>
														{chat.datetime.toDate().toLocaleString('en-GB', {
															hour: '2-digit',
															minute: '2-digit',
															hour12: true,
														})}
													</CustomText>
												</View>
												<View style={[style.row, { gap: 5, width: 'auto' }]}>
													<Icon name="cash" size={20} />
													<CustomText size={12} bold>
														RM {chat.fare}
													</CustomText>
												</View>
											</View>
										</View>
									</View>
								}
								{
									chat &&
									messageGroups.map((group) => (
										<MessageComponent
											key={group.messages[0].id}
											group={group}
											photo_url={
												group.sender === chat.driver ?
													chat.driverData?.photo_url :
													chat.passengersData?.find((passenger) => passenger.id === group.sender)?.photo_url
											}
											user={user}
											passengerData={chat.passengersData}
											driverData={chat.driverData}
										/>
									))
								}
							</View>
						</View>
					</CustomLayout>
				</View>
				<View style={[style.row, { paddingVertical: 10, paddingHorizontal: 20 }]}>
					<Controller
						control={form.control}
						name="message"
						render={({ field: { onChange, value } }) => (
							<CustomInput
								placeholder="Type a message..."
								onChangeText={onChange}
								value={value}
								rightIcon={
									<CustomIconButton icon="send" onPress={form.handleSubmit(handleSendMessage)} />
								}
							/>
						)}
					/>
				</View>
			</View>
		</CustomLayout>
	)
}

export default Chat
