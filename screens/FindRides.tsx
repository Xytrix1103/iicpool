import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { collection, onSnapshot } from 'firebase/firestore'
import CustomLayout from '../components/themed/CustomLayout'
import style from '../styles/shared'
import { Ride } from '../database/schema'
import FirebaseApp from '../components/FirebaseApp'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import CustomText from '../components/themed/CustomText'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

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
	
	const renderItem = ({ ride }: { ride: Ride }) => (
		<Pressable
			style={[style.row, {
				gap: 20,
				elevation: 10,
				borderRadius: 30,
				backgroundColor: 'white',
				padding: 20,
			}]}
			onPress={() => {
				// @ts-ignore
				navigation.navigate('ViewRide', { rideId: ride.id })
			}}
		>
			<View style={[style.column, {
				flex: 1,
				gap: 5,
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
			}]}>
				<Icon name="clock" size={24} color="grey" />
			</View>
			<View style={[style.column, { flex: 5, gap: 5 }]}>
				<View style={[style.row, { gap: 5 }]}>
					<CustomText size={14} bold numberOfLines={1}>
						{`${ride.to_campus ? 'From' : 'To'} ${ride.location?.name}`}
					</CustomText>
				</View>
				<View style={[style.row, { gap: 5 }]}>
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
			<View style={[style.column, {
				flex: 1,
				justifyContent: 'center',
				gap: 5,
				alignItems: 'center',
				height: '100%',
			}]}>
				<Icon name="car" size={20} color="black" />
				<CustomText align="center" bold>{ride.available_seats}</CustomText>
			</View>
		</Pressable>
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
												{renderItem({ ride })}
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
