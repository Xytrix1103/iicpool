import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { collection, onSnapshot } from 'firebase/firestore'
import CustomLayout from '../components/themed/CustomLayout'
import style from '../styles/shared'
import { Ride } from '../database/schema'
import FirebaseApp from '../components/FirebaseApp'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import CustomText from '../components/themed/CustomText'

const { db } = FirebaseApp

const FindRides = () => {
	const [rides, setRides] = useState<Ride[]>([])
	const navigation = useNavigation()
	
	useEffect(() => {
		const unsubscribe = onSnapshot(collection(db, 'rides'), (snapshot) => {
			const ridesData: Ride[] = snapshot.docs.map(doc => ({
				...doc.data(),
				id: doc.id,
			})) as Ride[]
			setRides(ridesData)
		})
		
		return () => unsubscribe()
	}, [])
	
	const renderItem = ({ item }: { item: Ride }) => (
		<View style={style.row}>
			<Text>Driver: {item.driver}</Text>
			<Text>Available Seats: {item.available_seats}</Text>
			<Text>To Campus: {item.to_campus ? 'Yes' : 'No'}</Text>
			<Text>Location: {item.location?.formatted_address}</Text>
		</View>
	)
	
	return (
		<CustomLayout
			contentPadding={0}
			header={
				<CustomHeader
					title="Available Rides"
					navigation={navigation}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20, height: '100%' }]}>
					<View style={[style.row, { paddingHorizontal: 20, paddingVertical: 10 }]}>
						<View style={[style.row, { gap: 10 }]}>
							<CustomText size={20} bold>Find Rides</CustomText>
						</View>
					</View>
					<CustomLayout scrollable={true}>
						<View style={style.mainContent}>
							<View style={[style.column, { gap: 10 }]}>
								{
									rides.length > 0 ? (
										rides.map(ride => (
											<View key={ride.id}>
												{renderItem({ item: ride })}
											</View>
										))
									) : (
										<Text>No rides available</Text>
									)
								}
							</View>
						</View>
					</CustomLayout>
				</View>
			</View>
		</CustomLayout>
	)
}

export default FindRides
