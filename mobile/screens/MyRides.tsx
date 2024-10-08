import CustomLayout from '../components/themed/CustomLayout'
import { Alert, Pressable, View } from 'react-native'
import style from '../styles/shared'
import React, { useContext, useEffect, useState } from 'react'
import { Ride } from '../database/schema'
import { useNavigation } from '@react-navigation/native'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomText from '../components/themed/CustomText'
import CustomHeader from '../components/themed/CustomHeader'
import CustomIconButton from '../components/themed/CustomIconButton'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { RideContext } from '../components/contexts/RideContext'

const { db } = FirebaseApp

const RideComponent = ({ ride, navigation }: { ride: Ride, navigation: any }) => {
	return (
		<Pressable
			style={[style.row, {
				gap: 15,
				backgroundColor: 'white',
				elevation: 5,
				padding: 20,
				borderRadius: 30,
			}]}
			onPress={
				() => {
					// @ts-ignore
					navigation.navigate('ViewRide', { rideId: ride.id })
				}
			}
		>
			<View style={[style.column, { gap: 20, flex: 1 }]}>
				<View style={[style.row, { gap: 5 }]}>
					<View style={[style.row, { gap: 5, flex: 1 }]}>
						<Icon
							name="map-marker"
							size={20}
						/>
						<CustomText
							size={14}
							numberOfLines={1}
							width="70%"
						>
							{ride.to_campus ? 'From' : 'To'} {ride.location.name}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<CustomText size={12} bold
						            color={ride.cancelled_at ? 'red' : ride.completed_at ? 'green' : ride.started_at ? 'blue' : 'black'}>
							{
								ride.cancelled_at ? 'Cancelled' :
									ride.completed_at ? 'Completed' :
										ride.started_at ? 'Ongoing' :
											'Pending'
							}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { gap: 10 }]}>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="calendar" size={20} />
						<CustomText size={12} bold>
							{ride.datetime.toDate().toLocaleString('en-GB', {
								day: 'numeric',
								month: 'numeric',
								year: 'numeric',
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="clock" size={20} />
						<CustomText size={12} bold>
							{ride.datetime.toDate().toLocaleString('en-GB', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="cash" size={20} />
						<CustomText size={12} bold>
							RM {ride.fare}
						</CustomText>
					</View>
				</View>
			</View>
		</Pressable>
	)
}

const MyRides = () => {
	const [rides, setRides] = useState<Ride[] | null>(null)
	const navigation = useNavigation()
	const { user } = useContext(AuthContext)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { currentRide } = useContext(RideContext)
	
	useEffect(() => {
		let unsubscribe: () => void
		
		(async () => {
			unsubscribe = onSnapshot(query(collection(db, 'rides'), where('driver', '==', user?.uid)), (snapshot) => {
				const ridesData: Ride[] = snapshot.docs.map(doc => ({
					...doc.data(),
					id: doc.id,
				})) as Ride[]
				setRides(ridesData)
			})
		})()
		
		return (
			() => {
				unsubscribe()
			}
		)
	}, [])
	
	useEffect(() => {
		console.log('rides', rides)
		
		if (rides) {
			setLoadingOverlay({ show: false, message: '' })
		} else {
			setLoadingOverlay({ show: true, message: 'Loading cars...' })
		}
	}, [rides])
	
	
	return (
		<CustomLayout
			scrollable={true}
			header={
				<CustomHeader
					title="My Rides"
					navigation={navigation}
					rightNode={
						<CustomIconButton
							icon="plus"
							onPress={() => {
								if (currentRide) {
									Alert.alert(
										'Ride in Progress',
										'You cannot add a new ride while you have a ride in progress',
										[
											{
												text: 'OK',
												onPress: () => {
												},
											},
										],
									)
									return
								}
								
								// @ts-ignore
								navigation.navigate('AddRide')
							}}
						/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20 }]}>
					{
						rides && ((rides?.length || 0) > 0) ? (
							rides.map(ride => (
								<RideComponent key={ride.id} ride={ride} navigation={navigation} />
							))
						) : (
							<View style={[style.row, { alignItems: 'center', justifyContent: 'center' }]}>
								<CustomText>No rides found</CustomText>
							</View>
						)
					}
				</View>
			</View>
		</CustomLayout>
	)
}

export default MyRides
