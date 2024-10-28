import { View } from 'react-native'
import style from '../../styles/shared'
import CustomBackgroundButton from '../../components/themed/CustomBackgroundButton'
import CustomText from '../../components/themed/CustomText'
import { Ride, Role } from '../../database/schema'
import CurrentRide from './CurrentRide'
import React, { useContext, useEffect, useState } from 'react'
import FirebaseApp from '../../components/FirebaseApp'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { AuthContext } from '../../components/contexts/AuthContext'
import CustomCard from '../../components/themed/CustomCard'
import { LoadingOverlayContext } from '../../components/contexts/LoadingOverlayContext'

type PassengerRidesSummary = {
	total_booked: number | null;
	total_completed: number | null;
	total_cancelled: number | null;
	spent: number | null;
}

const { db, auth } = FirebaseApp

const PassengerHome = (
	{
		navigation,
		currentRide,
		mode,
	}: {
		navigation: any,
		currentRide: Ride | null,
		mode: Role
	},
) => {
	const [ridesSummary, setRidesSummary] = useState<PassengerRidesSummary>({
		total_booked: null,
		total_completed: null,
		total_cancelled: null,
		spent: null,
	})
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { user } = useContext(AuthContext)
	
	const ridesQuery = query(
		collection(db, 'rides'),
		where('passengers', 'array-contains', user?.uid),
	)
	
	useEffect(() => {
		if (!user) return
		
		setLoadingOverlay({
			show: true,
			message: 'Loading Rides Summary',
		})
		
		const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {
			const rides: Ride[] = []
			for (const doc of snapshot.docs) {
				const data = doc.data() as Ride
				rides.push({ ...data, id: doc.id } as Ride)
			}
			
			const total = rides.length
			const completed = rides.filter(ride => ride.completed_at).length
			const cancelled = rides.filter(ride => ride.cancelled_at).length
			const spent = rides.reduce((acc, ride) => acc + (ride.completed_at ? ride.fare : 0), 0)
			
			setRidesSummary({
				total_booked: total,
				total_completed: completed,
				total_cancelled: cancelled,
				spent,
			})
			
			setLoadingOverlay({
				show: false,
				message: '',
			})
		})
		
		return () => unsubscribe()
	}, [user])
	
	return (
		<View style={style.mainContent}>
			<View style={[style.column, { gap: 20 }]}>
				<CustomCard padding={20}>
					<View style={[style.column, { gap: 20, flex: 1 }]}>
						<CustomText size={14} bold>{`Rides Summary`}</CustomText>
						<View style={[style.row, { gap: 10 }]}>
							<View style={[style.column, { gap: 10, flex: 1 }]}>
								<CustomText size={12}>Total Booked: {ridesSummary.total_booked}</CustomText>
								<CustomText size={12}>Total Completed: {ridesSummary.total_completed}</CustomText>
							</View>
							<View style={[style.column, { gap: 10, flex: 1 }]}>
								<CustomText size={12}>Total Cancelled: {ridesSummary.total_cancelled}</CustomText>
								<CustomText size={12}>Total Spent: {ridesSummary.spent}</CustomText>
							</View>
						</View>
					</View>
				</CustomCard>
				{
					currentRide &&
					<CurrentRide currentRide={currentRide} mode={mode} navigation={navigation} user={user} />
				}
				<View style={[style.row]}>
					<CustomBackgroundButton
						icon="hail"
						// disabled={user?.emailVerified === false}
						size={40}
						onPress={async () => {
							await auth.currentUser?.reload()
							if (auth.currentUser?.emailVerified === false) {
								alert('Please verify your email before you can find rides')
								return
							}
							
							navigation.navigate('FindRides')
						}}
						style={{ flex: 1 }}
						elevation={10}
						backgroundColor="white"
						padding={20}
						borderRadius={30}
					>
						<CustomText size={14} bold>Find Rides</CustomText>
					</CustomBackgroundButton>
				</View>
			</View>
		</View>
	)
}

export default PassengerHome
