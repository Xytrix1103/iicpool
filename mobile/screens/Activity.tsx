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
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { useTheme } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'

const { db } = FirebaseApp

const RideComponent = ({ ride, colors, mode, navigation }: {
	ride: Ride,
	colors: MD3Colors,
	mode: 'driver' | 'passenger',
	navigation: any
}) => {
	const { user } = useContext(AuthContext)
	return (
		<Pressable
			style={[
				style.row,
				{
					backgroundColor: 'white',
					elevation: 5,
					padding: 20,
					borderRadius: 10,
					gap: 10,
				},
			]}
			onPress={() => {
				// @ts-ignore
				navigation.navigate('ViewRide', { rideId: ride.id })
			}}
		>
			<View style={[style.column, { gap: 20, flex: 1 }]}>
				<View style={[style.row, { gap: 5, justifyContent: 'space-between' }]}>
					<CustomText
						size={14}
						bold
						width="auto"
						color={colors.primary}
					>
						{ride.driver === user?.uid ? 'Driver' : ride.passengers.includes(user?.uid || '') ? 'Passenger' : 'SOS Driver'}
					</CustomText>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<CustomText size={12} bold align="center"
						            color={(ride.cancelled_at || ride.sos) ? 'red' : ride.completed_at ? 'green' : ride.started_at ? 'blue' : 'black'}>
							{
								ride.cancelled_at ? 'CANCELLED' :
									ride.completed_at ? 'COMPLETED' :
										ride.started_at ? ride.sos ? ride.sos.responded_by ? ride.sos.started_at ? `SOS STARTED` : `SOS RESPONDED` : 'SOS TRIGGERED' : 'ONGOING' :
											'PENDING'
							}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { gap: 10 }]}>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="calendar" size={20} />
						<CustomText size={12}>
							{ride.datetime.toDate().toLocaleString('en-GB', {
								day: 'numeric',
								month: 'numeric',
								year: 'numeric',
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="clock" size={20} />
						<CustomText size={12}>
							{ride.datetime.toDate().toLocaleString('en-GB', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="cash" size={20} />
						<CustomText size={12}>
							RM {ride.fare}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { gap: 5 }]}>
					<View style={[style.column, {
						flexDirection: ride.to_campus ? 'column' : 'column-reverse',
					}]}>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, width: 'auto' }]}>
								<Icon name="map-marker" size={24} />
							</View>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<CustomText size={14} numberOfLines={2}>
									{ride.to_campus ? 'From' : 'To'} {ride.location.name} {ride.to_campus ? 'to campus' : 'from campus'}
								</CustomText>
							</View>
						</View>
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
	const { colors } = useTheme()
	const navigation = useNavigation()
	
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
				where('sos.responded_by', '==', user.uid),
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
								<RideComponent ride={ride} key={ride.id} colors={colors} navigation={navigation}
								               mode={ride.driver === user?.uid ? 'driver' : 'passenger'} />
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
