import { View } from 'react-native'
import style from '../../styles/shared'
import CustomBackgroundButton from '../../components/themed/CustomBackgroundButton'
import CustomText from '../../components/themed/CustomText'
import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../components/contexts/AuthContext'
import { and, collection, getDocs, onSnapshot, or, orderBy, query, where } from 'firebase/firestore'
import { Ride, Role, Signal } from '../../database/schema'
import CustomCard from '../../components/themed/CustomCard'
import FirebaseApp from '../../components/FirebaseApp'
import CurrentRide from './CurrentRide'
import { LoadingOverlayContext } from '../../components/contexts/LoadingOverlayContext'

type DriverRidesSummary = {
	total: number | null;
	completed: number | null;
	cancelled: number | null;
	passengers: number | null;
	earned: number | null;
	hours: number | null;
}

const { db } = FirebaseApp

const DriverHome = ({ navigation, currentRide, mode }: {
	navigation: any,
	currentRide?: Ride | null,
	mode: Role
}) => {
	const [ridesSummary, setRidesSummary] = useState<DriverRidesSummary>({
		total: null,
		completed: null,
		cancelled: null,
		passengers: null,
		earned: null,
		hours: null,
	})
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { user } = useContext(AuthContext)
	
	const ridesQuery = query(
		collection(db, 'rides'),
		or(
			and(where('driver', '==', user?.uid), where('sos', '==', null)),
			where('sos.responded_by', '==', user?.uid),
		),
	)
	
	useEffect(() => {
		if (!user) return
		
		setLoadingOverlay({
			show: true,
			message: 'Loading...',
		})
		
		const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {
			const rides: Ride[] = []
			for (const doc of snapshot.docs) {
				const data = doc.data() as Ride
				rides.push({ ...data, id: doc.id } as Ride)
			}
			
			const total = rides.length
			const completed = rides.filter((ride) => ride.completed_at).length
			const cancelled = rides.filter((ride) => ride.cancelled_at).length
			const passengers = rides.reduce((acc, ride) => acc + ride.passengers.length, 0)
			const earned = rides.reduce((acc, ride) => acc + (ride.completed_at ? ride.fare * ride.passengers.length : 0), 0)
			
			let hours = 0
			
			await Promise.all(rides.map(async (ride) => {
				const signalsQuery = query(
					collection(db, 'rides', ride.id!, 'signals'),
					where('user', '==', user?.uid),
					orderBy('timestamp', 'asc'),
				)
				
				const signalsSnapshot = await getDocs(signalsQuery)
				
				if (signalsSnapshot.empty) return
				
				//get the first signal and the last signal
				const firstSignal = signalsSnapshot.docs[0].data() as Signal
				const lastSignal = signalsSnapshot.docs[signalsSnapshot.size - 1].data() as Signal
				
				const diff = lastSignal.timestamp.toMillis() - firstSignal.timestamp.toMillis()
				const diffHours = diff / (1000 * 60 * 60)
				hours += diffHours
			})).finally(() => {
				setRidesSummary({
					total,
					earned,
					completed,
					cancelled,
					passengers,
					hours,
				})
				
				setLoadingOverlay({
					show: false,
					message: '',
				})
			})
		})
		
		return () => {
			unsubscribe()
		}
	}, [user])
	
	return (
		<View style={style.mainContent}>
			<View style={[style.column, { gap: 20 }]}>
				<CustomCard padding={20}>
					<View style={[style.column, { gap: 20 }]}>
						<CustomText size={14} bold>{`Rides Summary`}</CustomText>
						<View style={[style.row, { gap: 10 }]}>
							<View style={[style.column, { gap: 10, flex: 1 }]}>
								<CustomText size={12}>{`Total Rides: ${ridesSummary.total}`}</CustomText>
								<CustomText size={12}>{`Completed Rides: ${ridesSummary.completed}`}</CustomText>
								<CustomText size={12}>{`Cancelled Rides: ${ridesSummary.cancelled}`}</CustomText>
							</View>
							<View style={[style.column, { gap: 10, flex: 1 }]}>
								<CustomText size={12}>{`Total Passengers: ${ridesSummary.passengers}`}</CustomText>
								<CustomText size={12}>{`Total Earned: RM ${ridesSummary.earned}`}</CustomText>
								<CustomText size={12}>{`Total Hours: ${ridesSummary.hours}`}</CustomText>
							</View>
						</View>
					</View>
				</CustomCard>
				{
					currentRide &&
					<CurrentRide currentRide={currentRide} mode={mode} navigation={navigation} user={user} />
				}
				<View style={[style.row, { gap: 20 }]}>
					<CustomBackgroundButton
						icon="car-multiple"
						size={30}
						onPress={() => {
							navigation.navigate('MyRides')
						}}
						style={{ flex: 1 }}
						elevation={10}
						backgroundColor="white"
						padding={20}
						borderRadius={30}
					>
						<CustomText size={14}>My Rides</CustomText>
					</CustomBackgroundButton>
					<CustomBackgroundButton
						icon="phone"
						iconColor="red"
						size={30}
						onPress={() => {
							// @ts-ignore
							navigation.navigate('EmergencyRides')
						}}
						style={{ flex: 1 }}
						elevation={10}
						backgroundColor="white"
						padding={20}
						borderRadius={30}
					>
						<CustomText size={14}>Emergency Rides</CustomText>
					</CustomBackgroundButton>
				</View>
			</View>
		</View>
	)
}

export default DriverHome
