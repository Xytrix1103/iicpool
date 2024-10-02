import { StyleSheet, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import style from '../styles/shared'
import { useContext, useEffect, useState } from 'react'
import { Car, Message, MessageType, Profile, Ride } from '../database/schema'
import { and, collection, doc, getDoc, getDocs, limit, onSnapshot, or, orderBy, query, where } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import CustomText from '../components/themed/CustomText'
import CustomListWithDivider from '../components/themed/CustomListWithDivider'
import { User } from 'firebase/auth'
import { Avatar } from 'react-native-paper'

type CustomLocalRide = Ride & {
	passengersData?: Profile[]
	driverData?: Profile
	latestMessage?: Message
	carData?: Car
}

const { db } = FirebaseApp

const ChatComponent = ({ ride, user }: { ride: CustomLocalRide, user: User | null }) => {
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
		<View style={[style.row, { gap: 20 }]}>
			<View style={[style.column, { width: 'auto' }]}>
				<Avatar.Image size={60} source={{ uri: ride?.carData?.photo_url || '' }} />
			</View>
			<View style={[style.column, { flex: 1, gap: 10, height: '100%', width: '100%' }]}>
				<View style={[style.row, { justifyContent: 'space-between', gap: 20 }]}>
					<View style={[style.column, { flex: 1 }]}>
						<CustomText bold size={14} numberOfLines={1} width="auto">
							{ride.to_campus ? 'From' : 'To'} {ride.location.name}
						</CustomText>
					</View>
					<View style={[style.column, { width: 'auto' }]}>
						<CustomText size={12} align="right">
							{ride.datetime.toDate().toLocaleString('en-GB', { dateStyle: 'medium' })}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { justifyContent: 'space-between', gap: 20 }]}>
					<View style={[style.column, { flex: 1 }]}>
						<CustomText size={12} color="grey" numberOfLines={1}>
							{messageDisplay}
						</CustomText>
					</View>
					<CustomText size={10} color="grey">
						{
							//mins, hours, days, weeks, months, or years (like Facebook chat)
							//if less than 1 min, show "Just now"
							//if less than 1 hour, show "x mins ago"
							//if less than 1 day, show "x hours ago"
							//if less than 1 week, show "x days ago"
							//if less than 1 month, show "x weeks ago"
							//if less than 1 year, show "x months ago"
							//if more than 1 year, show "x years ago"
							ride.latestMessage &&
							(
								new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 60000 ? 'Just now' :
									new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 3600000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 60000)} mins ago` :
										new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 86400000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 3600000)} hours ago` :
											new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 604800000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 86400000)} days ago` :
												new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 2628000000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 604800000)} weeks ago` :
													new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime() < 31540000000 ? `${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 2628000000)} months ago` :
														`${Math.floor((new Date().getTime() - ride.latestMessage?.timestamp.toDate().getTime()) / 31540000000)} years ago`
							)
						}
					</CustomText>
				</View>
			</View>
		</View>
	)
}

const Messages = () => {
	const [rides, setRides] = useState<CustomLocalRide[]>([])
	const { user } = useContext(AuthContext)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	
	const ridesQuery = query(collection(db, 'rides'), and(where('passengers', '!=', []), or(where('passengers', 'array-contains', user?.uid), where('driver', '==', user?.uid))))
	// const ridesQuery = query(collection(db, 'rides'), and(where('passengers', '!=', []), where('completed_at', '==', null), where('cancelled_at', '==', null), or(where('passengers', 'array-contains', user?.uid), where('driver', '==', user?.uid))))
	
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
				
				const carData = await getDoc(doc(db, 'cars', ride.car)).then((result) => {
					return {
						...result.data(),
						id: result.id,
					} as Car
				}).catch((error) => {
					console.error('Error getting car:', error)
					return undefined
				})
				
				console.log(latestMessage)
				
				return {
					...ride,
					passengersData,
					latestMessage,
					driverData,
					carData,
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
			scrollable={true}
			header={<CustomHeader title="Messages" />}
		>
			<View style={style.mainContent}>
				<View style={style.row}>
					<CustomListWithDivider
						items={
							rides.map((ride) => (
								<ChatComponent ride={ride} key={ride.id} user={user} />
							))
						}
						dividerComponent={
							<View style={localStyle.divider} />
						}
					/>
				</View>
			</View>
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