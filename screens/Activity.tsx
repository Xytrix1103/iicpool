import React, { useContext, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { collection, onSnapshot, or, query, where } from 'firebase/firestore'
import style from '../styles/shared'
import { AuthContext } from '../components/contexts/AuthContext'
import FirebaseApp from '../components/FirebaseApp'
import CustomLayout from '../components/themed/CustomLayout'
import CustomText from '../components/themed/CustomText'
import CustomHeader from '../components/themed/CustomHeader'
import { Ride } from '../database/schema'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const { db } = FirebaseApp

const RideComponent = ({ ride }: { ride: Ride }) => {
	return (
		<Pressable
			style={[style.row, {
				gap: 20,
				elevation: 10,
				borderRadius: 20,
				backgroundColor: 'white',
				padding: 20,
			}]}
			onPress={() => {
				// @ts-ignore
				navigation.navigate('ViewRide', { rideId: ride.id })
			}}
			key={ride.id}
		>
			<View style={[style.column, {
				width: 'auto',
				justifyContent: 'center',
				gap: 5,
				alignItems: 'center',
			}]}>
				<Icon name="car" size={20} color="black" />
				<CustomText
					align="center"
					bold
					size={14}
				>
					{ride.available_seats - ride.passengers.length}/{ride.available_seats}
				</CustomText>
			</View>
			<View style={[style.column, { flex: 4, gap: 5 }]}>
				<View style={[style.row, { gap: 5 }]}>
					<View style={[style.column, { flex: 1 }]}>
						<CustomText size={14} bold numberOfLines={1}>
							{`${ride.to_campus ? 'From' : 'To'} ${ride.location?.name}`}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { gap: 5 }]}>
					<View style={[style.column, { flex: 1 }]}>
						<CustomText size={14}>
							{ride.datetime.toDate().toLocaleString('en-GB', {
								day: 'numeric',
								month: 'numeric',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
							})}
						</CustomText>
					</View>
				</View>
			</View>
		</Pressable>
	)
}

const Activity = () => {
	const { user } = useContext(AuthContext)
	const [rides, setRides] = useState<Ride[]>([])
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	
	useEffect(() => {
		if (!user) return
		
		setLoadingOverlay({
			show: true,
			message: 'Loading rides...',
		})
		
		const ridesQuery = query(
			collection(db, 'rides'),
			or(
				where('driver', '==', user.uid),
				where('passengers', 'array-contains', user.uid),
			),
		)
		
		const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {
			const rides: Ride[] = []
			for (const doc of snapshot.docs) {
				const data = doc.data() as Ride
				rides.push({ ...data, id: doc.id } as Ride)
			}
			setRides(rides)
			setLoadingOverlay({
				show: false,
				message: '',
			})
		})
		
		return () => unsubscribe()
	}, [user])
	
	return (
		<CustomLayout
			hasAppBar={true}
			contentPadding={0}
			header={<CustomHeader title="Activity" />}
		>
			<CustomLayout scrollable={true}>
				<View style={style.mainContent}>
					<View style={style.row}>
						<View style={[style.column, { gap: 20 }]}>
							{rides.map((ride) => (
								<RideComponent ride={ride} key={ride.id} />
							))}
							{rides.length === 0 && (
								<CustomText align="center" size={16}>
									No rides found
								</CustomText>
							)}
						</View>
					</View>
				</View>
			</CustomLayout>
		</CustomLayout>
	)
}
export default Activity
