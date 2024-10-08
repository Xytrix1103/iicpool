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
	total: number | null;
	spent: number | null;
}

const { db } = FirebaseApp

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
		total: null,
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
			const spent = rides.reduce((acc, ride) => acc + ride.fare || 0, 0)
			
			setRidesSummary({
				total,
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
					<View style={[style.column, { gap: 20 }]}>
						<CustomText size={14} bold>{`Rides Summary`}</CustomText>
						<View style={[style.row, { gap: 5 }]}>
							<CustomText size={12}>Total Rides:</CustomText>
							<CustomText size={12} bold>{ridesSummary.total}</CustomText>
						</View>
						<View style={[style.row, { gap: 5 }]}>
							<CustomText size={12}>Total Spent:</CustomText>
							<CustomText size={12} bold>{`RM ${ridesSummary.spent}`}</CustomText>
						</View>
					</View>
				</CustomCard>
				{
					currentRide &&
					<CurrentRide currentRide={currentRide} mode={mode} navigation={navigation} />
				}
				<View style={[style.row]}>
					<CustomBackgroundButton
						icon="hail"
						size={40}
						onPress={() => {
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
