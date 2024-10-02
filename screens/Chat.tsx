import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Car, Message, MessageType, Profile, Ride } from '../database/schema'
import { useContext, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore'
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
import CustomList from '../components/themed/CustomList'

type ChatRouteParams = RouteProp<{ Chat: { rideId: string } }, 'Chat'>

type CustomChat = Ride & {
	passengersData?: Profile[]
	driverData?: Profile
	carData?: Car
}

const { db } = FirebaseApp

const MessageComponent = ({ message, photo_url, user, passengerData, driverData }: {
	message: Message,
	photo_url?: string,
	user: User | null,
	passengerData?: Profile[],
	driverData?: Profile,
}) => {
	return (
		message.type === MessageType.MESSAGE ?
			<View style={[style.row, {
				flexDirection: message.sender === user?.uid ? 'row-reverse' : 'row',
				gap: 5,
				alignItems: 'flex-start',
			}]}>
				<View style={[style.column, {
					width: 60,
					alignItems: 'center',
					justifyContent: 'center',
					padding: 5,
				}]}>
					<Avatar.Image size={50} source={{ uri: photo_url }} />
				</View>
				<View style={[style.column, {
					width: 'auto',
					maxWidth: '80%',
					gap: 2,
				}]}>
					<View
						style={[style.row, { justifyContent: message.sender === user?.uid ? 'flex-end' : 'flex-start' }]}>
						<CustomText size={12}>
							{passengerData?.find((passenger) => passenger.id === message.sender)?.full_name}
						</CustomText>
					</View>
					<View style={[style.row, {
						padding: 10,
						borderRadius: 10,
						elevation: 5,
						backgroundColor: 'white',
						width: '100%',
					}]}>
						<CustomText size={12}>
							{message.message}
						</CustomText>
					</View>
				</View>
				<View style={[style.column, { width: '20%' }]}>
					<></>
				</View>
			</View> :
			<View style={[style.row]}>
				<View style={[style.column]}>
					<CustomText color="gray" size={12} align="center">
						{
							message.type === MessageType.NEW_PASSENGER ?
								`${passengerData?.find((passenger) => passenger.id === message.user)?.full_name} has joined the ride` :
								message.type === MessageType.PASSENGER_CANCELLATION ?
									`${passengerData?.find((passenger) => passenger.id === message.user)?.full_name} has left the ride` :
									message.type === MessageType.RIDE_CANCELLATION ?
										`${driverData?.full_name} has cancelled the ride` :
										message.type === MessageType.RIDE_UPDATE ?
											'Ride has been updated' :
											null
						}
					</CustomText>
				</View>
			</View>
	)
}

const Chat = () => {
	const route = useRoute<ChatRouteParams>()
	const rideId = route.params.rideId as string
	const [chat, setChat] = useState<CustomChat | null>(null)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const navigation = useNavigation()
	const { user } = useContext(AuthContext)
	
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
			
			const passengersData = await Promise.all(
				chatData.passengers.map(async (passengerId) => {
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
			
			const messages = await getDocs(query(collection(doc(db, 'rides', rideId), 'messages'), orderBy('timestamp', 'asc'))).then((querySnapshot) => {
				return querySnapshot.docs.map((doc) => {
					return {
						...doc.data(),
						id: doc.id,
					} as Message
				})
			}).catch((error) => {
				console.error('Error getting messages:', error)
				return [] as Message[]
			})
			
			setChat({
				...chatData,
				passengersData,
				driverData,
				carData,
				messages,
			})
			
			setLoadingOverlay({
				show: false,
				message: '',
			})
		})
		
		return () => unsubscribe()
	}, [rideId])
	
	
	return (
		<CustomLayout
			scrollable={false}
			contentPadding={0}
			header={
				<CustomHeader title="Chat" navigation={navigation} />
			}
		>
			<View style={style.mainContent}>
				<View style={[style.row, { gap: 20, flex: 1, justifyContent: 'flex-start' }]}>
					<CustomList items={
						chat?.messages?.length ?
							chat.messages.map((message) => (
								<MessageComponent
									key={message.id}
									message={message}
									photo_url={message.sender === chat?.driver ? chat?.driverData?.photo_url : chat?.passengersData?.find((passenger) => passenger.id === message.sender)?.photo_url}
									user={user}
									passengerData={chat.passengersData}
									driverData={chat.driverData}
								/>
							)) :
							[
								<View key="no-messages" style={[style.column, {
									alignItems: 'center',
									justifyContent: 'center',
									flex: 1,
								}]}>
									<CustomText size={12} color="gray">
										No messages yet
									</CustomText>
								</View>,
							]
					} />
				</View>
				<View style={style.row}>
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
