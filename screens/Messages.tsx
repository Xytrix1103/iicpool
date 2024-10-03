import { Pressable, StyleSheet, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import style from '../styles/shared'
import { useContext, useEffect, useState } from 'react'
import { Car, Message, MessageType, Profile, Ride } from '../database/schema'
import {
	and,
	collection,
	doc,
	getCountFromServer,
	getDoc,
	getDocs,
	limit,
	onSnapshot,
	or,
	orderBy,
	query,
	where,
} from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import CustomText from '../components/themed/CustomText'
import { User } from 'firebase/auth'
import { Avatar, Badge, useTheme } from 'react-native-paper'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { useNavigation } from '@react-navigation/native'

type CustomLocalRide = Ride & {
	passengersData?: Profile[]
	driverData?: Profile
	latestMessage?: Message
	carData?: Car
	unreadCount?: number
}

const { db } = FirebaseApp

const ChatComponent = ({ ride, user, navigation }: {
	ride: CustomLocalRide,
	user: User | null,
	colors: MD3Colors,
	navigation: any
}) => {
	let messageDisplay
	switch (ride.latestMessage?.type) {
		case MessageType.MESSAGE:
			messageDisplay = `${ride.latestMessage.sender === user?.uid ? 'You' : [...(ride.passengersData || []), ride.driverData]?.find((passenger) => passenger?.id === ride.latestMessage?.sender)?.full_name.split(' ')[0]}: ${ride.latestMessage?.message}`
			break
		case MessageType.NEW_PASSENGER:
			messageDisplay = `${[...(ride.passengersData || []), ride.driverData]?.find((passenger) => passenger?.id === ride.latestMessage?.user)?.full_name.split(' ')[0]} has joined the ride`
			break
		case MessageType.PASSENGER_CANCELLATION:
			messageDisplay = `${[...(ride.passengersData || []), ride.driverData]?.find((passenger) => passenger?.id === ride.latestMessage?.user)?.full_name.split(' ')[0]} has left the ride`
			break
		case MessageType.RIDE_CANCELLATION:
			messageDisplay = `${ride.driverData?.full_name} has cancelled the ride`
			break
		case MessageType.RIDE_UPDATE:
			messageDisplay = ride.latestMessage?.message
			break
		default:
			messageDisplay = 'No messages yet'
	}
	
	return (
		<Pressable
			style={[style.row, { gap: 15, backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 30 }]}
			onPress={() => navigation.navigate('Chat', { rideId: ride.id })}
		>
			<View style={[style.column, { width: 'auto' }]}>
				<Avatar.Icon
					size={40}
					icon="car"
					style={{ backgroundColor: 'black' }}
				/>
				<Badge
					size={20}
					style={{ position: 'absolute', top: -5, right: -5 }}
					visible={ride.unreadCount! > 0}
				>
					{ride.unreadCount}
				</Badge>
			</View>
			<View style={[style.column, { flex: 1, gap: 10, height: '100%', width: '100%' }]}>
				<View style={[style.row, { justifyContent: 'space-between', gap: 20 }]}>
					<View style={[style.column, { gap: 5 }]}>
						<View style={[style.row, { justifyContent: 'space-between', gap: 20 }]}>
							<View style={[style.column, { flex: 1 }]}>
								<CustomText bold size={12} numberOfLines={1} width="auto">
									{ride.driverData?.full_name.split(' ')[0]}'s ride
									with {ride.passengersData?.length} others
								</CustomText>
							</View>
							<View style={[style.column, { width: 'auto' }]}>
								<CustomText size={12} align="right">
									{ride.datetime.toDate().toLocaleString('en-GB', { dateStyle: 'short' })}
								</CustomText>
							</View>
						</View>
						<View style={[style.row, { justifyContent: 'space-between', gap: 20 }]}>
							<CustomText size={12} numberOfLines={1} width="auto" color="grey">
								{ride.to_campus ? 'From' : 'To'} {ride.location.name} at {ride.datetime.toDate().toLocaleString('en-GB', { timeStyle: 'short' })}
							</CustomText>
						</View>
					</View>
				</View>
				<View style={[style.row, { justifyContent: 'space-between', gap: 20 }]}>
					<View style={[style.column, { flex: 1 }]}>
						{/*<CustomText size={12} numberOfLines={2}>*/}
						{
							//check if it starts with a name/You and colon, if yes, split into 2 columns so the sender
							//name can be formatted
							ride.latestMessage?.type === MessageType.MESSAGE ?
								<View style={[style.row, { alignItems: 'flex-start' }]}>
									<View style={[style.column, { width: 'auto' }]}>
										<CustomText size={12} bold>
											{messageDisplay?.split(':')[0]}:
										</CustomText>
									</View>
									<View style={[style.column, { flex: 1 }]}>
										<CustomText size={12} numberOfLines={2}>
											{messageDisplay?.split(':').slice(1).join(':')}
										</CustomText>
									</View>
								</View> :
								<CustomText size={12} numberOfLines={2}>
									{messageDisplay}
								</CustomText>
						}
					</View>
					<View style={[style.column, { width: 'auto', height: '100%' }]}>
						{
							ride.latestMessage &&
							<CustomText size={10} color="grey">
								{
									new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 60000 ? 'Just now' :
										new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 3600000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 60000)}m ago` :
											new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 86400000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 3600000)}h ago` :
												new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 604800000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 86400000)}d ago` :
													new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 2628000000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 604800000)}w ago` :
														new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 31540000000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 2628000000)}mon ago` :
															`${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 31540000000)}y ago`
								}
							</CustomText>
						}
					</View>
				</View>
			</View>
		</Pressable>
	)
}

const Messages = () => {
	const [rides, setRides] = useState<CustomLocalRide[]>([])
	const { user } = useContext(AuthContext)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { colors } = useTheme()
	const navigation = useNavigation()
	
	const ridesQuery = query(collection(db, 'rides'), and(where('passengers', '!=', []), or(where('passengers', 'array-contains', user?.uid), where('driver', '==', user?.uid))))
	
	useEffect(() => {
		const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {
			setLoadingOverlay({
				show: true,
				message: 'Loading messages...',
			})
			
			await Promise.all(snapshot.docs.map(async (snapshotDoc) => {
				const ride = {
					...snapshotDoc.data(),
					id: snapshotDoc.id,
				} as Ride
				
				const passengersData = await Promise.all(
					ride.passengers.map(async (passengerId) => {
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
				
				const driverData = await getDoc(doc(db, 'users', ride.driver)).then((result) => {
					return {
						...result.data(),
						id: result.id,
					} as Profile
				}).catch((error) => {
					console.error('Error getting driver:', error)
					return undefined
				})
				
				console.log(passengersData, ride?.id)
				
				const latestMessage = await getDocs(query(collection(doc(db, 'rides', ride?.id || ''), 'messages'), orderBy('timestamp', 'desc'), limit(1))).then((querySnapshot) => {
					console.log(querySnapshot.docs)
					if (querySnapshot.docs.length) {
						const doc = querySnapshot.docs[0]
						return {
							...doc.data(),
							id: doc.id,
						} as Message
					} else {
						return undefined
					}
				}).catch((error) => {
					console.error('Error getting latest message:', error)
					return undefined
				})
				
				console.log(latestMessage)
				
				const carData = await getDoc(doc(db, 'cars', ride.car)).then((result) => {
					return {
						...result.data(),
						id: result.id,
					} as Car
				}).catch((error) => {
					console.error('Error getting car:', error)
					return undefined
				})
				
				console.log(carData)
				
				const unreadCount = await getCountFromServer(query(collection(doc(db, 'rides', ride?.id || ''), 'messages'), where('read_by', 'array-contains', user?.uid)))
					.then((count) => {
						return count.data().count
					})
					.catch((error) => {
						console.error('Error getting unread count:', error)
						return 0
					})
				
				console.log('Unread count:', unreadCount)
				
				return {
					...ride,
					passengersData,
					latestMessage,
					driverData,
					carData,
					unreadCount,
				} as CustomLocalRide
			}))
				.then((rides) => {
					console.log('Rides:', rides)
					setRides(rides)
				})
				.catch((error) => {
					console.error('Error getting rides:', error)
				})
				.finally(() => {
					setLoadingOverlay({
						show: false,
						message: '',
					})
				})
		})
		
		return () => unsubscribe()
	}, [])
	
	return (
		<CustomLayout
			hasAppBar={true}
			contentPadding={0}
			header={<CustomHeader title="Messages" />}
		>
			<CustomLayout scrollable={true}>
				<View style={style.mainContent}>
					<View style={[style.row]}>
						<View style={[style.column, { gap: 20 }]}>
							{
								rides.map((ride) => (
									<ChatComponent ride={ride} key={ride.id} user={user} colors={colors}
									               navigation={navigation} />
								))
							}
						</View>
					</View>
				</View>
			</CustomLayout>
		</CustomLayout>
	)
}

const localStyle = StyleSheet.create({
	divider: {
		height: 1,
		backgroundColor: 'lightgrey',
		marginVertical: 20,
	},
})

export default Messages