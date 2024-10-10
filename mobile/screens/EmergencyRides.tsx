import React, { useContext, useEffect, useState } from 'react'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { useTheme } from 'react-native-paper'
import { AuthContext } from '../components/contexts/AuthContext'
import { and, collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { Ride, Signal } from '../database/schema'
import { useNavigation } from '@react-navigation/native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { Pressable, View } from 'react-native'
import style from '../styles/shared'
import { ModeContext } from '../components/contexts/ModeContext'
import CustomText from '../components/themed/CustomText'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import * as Location from 'expo-location'
import { PermissionContext } from '../components/contexts/PermissionContext'
import {
	CAMPUS_NAME,
	DirectionsResponse,
	fetchCampusLocation,
	fetchLocationByCoordinates,
	getDirectionsByCoordinates,
} from '../api/location'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'

type EmergencyRideComponentProps = {
	ride: EmergencyRide
	navigation: any
	campusLocation: GooglePlaceDetail | null
	currentLocation: Location.LocationObject | null
}

export type EmergencyRide = Ride & {
	last_signal: Signal | null
}

const EmergencyRideComponent = (
	{
		ride,
		navigation,
		campusLocation,
		currentLocation,
	}: EmergencyRideComponentProps) => {
	const [directions, setDirections] = useState<DirectionsResponse | null>(null)
	const originToWaypointDuration = directions?.routes?.[0]?.legs?.[0]?.duration?.value || 0
	const waypointToDestinationDuration = directions?.routes?.[0]?.legs?.[1]?.duration?.value || 0
	const originToWaypointDistance = directions?.routes?.[0]?.legs?.[0]?.distance?.value || 0
	const waypointToDestinationDistance = directions?.routes?.[0]?.legs?.[1]?.distance?.value || 0
	const [waypoint, setWaypoint] = useState<GooglePlaceDetail | null>(null)
	
	//get directions only if current location is available
	useEffect(() => {
		if (!currentLocation || !campusLocation) return
		
		const origin = { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }
		const waypoints = [{ latitude: ride.last_signal?.latitude!, longitude: ride.last_signal?.longitude! }]
		const destination = {
			latitude: ride.to_campus ? campusLocation?.geometry.location.lat : ride.location.geometry.location.lat,
			longitude: ride.to_campus ? campusLocation?.geometry.location.lng : ride.location.geometry.location.lng,
		}
		
		getDirectionsByCoordinates({
			origin,
			waypoints,
			destination,
		}).then(result => {
			console.log(result?.routes?.[0]?.legs)
			setDirections(result)
		})
	}, [currentLocation, campusLocation])
	
	useEffect(() => {
		if (ride.last_signal) {
			fetchLocationByCoordinates({
				latitude: ride.last_signal.latitude,
				longitude: ride.last_signal.longitude,
			}).then(result => {
				setWaypoint(result)
			})
		}
	}, [ride.last_signal])
	
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
				navigation.navigate('ViewRide', { rideId: ride.id })
			}}
		>
			<View style={[style.column, { gap: 20, flex: 1 }]}>
				<View style={[style.row, { gap: 5 }]}>
					<CustomText size={12} bold align="center"
					            color={(ride.cancelled_at || ride.sos) ? 'red' : ride.completed_at ? 'green' : ride.started_at ? 'blue' : 'black'}>
						{
							ride.cancelled_at ? 'CANCELLED' :
								ride.completed_at ? 'COMPLETED' :
									ride.started_at ? ride.sos ? ride.sos.responded_by ? `SOS RESPONDED` : 'SOS TRIGGERED' : 'ONGOING' :
										'PENDING'
						}
					</CustomText>
				</View>
				<View style={[style.row, { gap: 10 }]}>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="calendar" size={20} />
						<CustomText size={12} bold>
							{ride.last_signal?.timestamp.toDate().toLocaleString('en-GB', {
								day: 'numeric',
								month: 'numeric',
								year: 'numeric',
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="clock" size={20} />
						<CustomText size={12} bold>
							{ride.last_signal?.timestamp.toDate().toLocaleString('en-GB', {
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
				<View style={[style.row, { gap: 5 }]}>
					<View style={[style.column, { gap: 5 }]}>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<Icon name="human" size={30} />
							</View>
							<View style={[style.column, { gap: 5, flex: 6 }]}>
								<CustomText size={14} bold>
									Current Location
								</CustomText>
							</View>
						</View>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<Icon name="dots-vertical" size={30} />
							</View>
							<View style={[style.column, { gap: 5, flex: 6 }]}>
								<CustomText size={14}>
									~ {Math.ceil(originToWaypointDuration / 60)} minutes
									({(originToWaypointDistance / 1000).toFixed(2)} km)
								</CustomText>
							</View>
						</View>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<Icon name="car-emergency" size={30} />
							</View>
							<View style={[style.column, { gap: 5, flex: 6 }]}>
								<CustomText size={14} bold numberOfLines={1}>
									{waypoint?.name || waypoint?.formatted_address}
								</CustomText>
							</View>
						</View>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<Icon name="dots-vertical" size={30} />
							</View>
							<View style={[style.column, { gap: 5, flex: 6 }]}>
								<CustomText size={14}>
									~ {Math.ceil(waypointToDestinationDuration / 60)} minutes
									({(waypointToDestinationDistance / 1000).toFixed(2)} km)
								</CustomText>
							</View>
						</View>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<Icon name={ride.to_campus ? 'school' : 'map-marker'} size={30} />
							</View>
							<View style={[style.column, { gap: 5, flex: 6 }]}>
								<CustomText size={14} bold>
									{ride.to_campus ? CAMPUS_NAME : ride.location.name}
								</CustomText>
							</View>
						</View>
					</View>
				</View>
			</View>
		</Pressable>
	)
}


const { db } = FirebaseApp

const EmergencyRides = () => {
	const [emergencyRides, setEmergencyRides] = useState<EmergencyRide[]>([])
	const { wrapPermissions } = useContext(PermissionContext)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { colors } = useTheme()
	const { user } = useContext(AuthContext)
	const { mode } = useContext(ModeContext)
	const navigation = useNavigation()
	const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
	const [campusLocation, setCampusLocation] = useState<GooglePlaceDetail | null>(null)
	
	useEffect(() => {
		(async () => {
			await wrapPermissions({
				operation: async () => {
					const location = await Location.getCurrentPositionAsync({})
					setCurrentLocation(location)
				},
				type: 'location',
				message: 'We need your location to show you the directions',
			})
		})()
	}, [])
	
	
	const emergencyRidesQuery = query(
		collection(db, 'rides'),
		and(where('sos', '!=', null),
			where('completed_at', '==', null),
			where('cancelled_at', '==', null)),
	)
	
	useEffect(() => {
		if (!user) return
		
		setLoadingOverlay({
			show: true,
			message: 'Loading...',
		})
		
		const emergencyRidesUnsubscribe = onSnapshot(emergencyRidesQuery, async (snapshot) => {
			const rides: Ride[] = []
			for (const doc of snapshot.docs) {
				const data = { ...doc.data(), id: doc.id } as Ride
				
				if (!data.sos?.responded_by) {
					rides.push(data)
				}
			}
			
			const emergencyRides: EmergencyRide[] = []
			for (const ride of rides) {
				const signalsQuery = query(
					collection(db, 'rides', ride.id!, 'signals'),
					where('user', '==', ride.driver),
					orderBy('timestamp', 'desc'),
				)
				
				const signalsSnapshot = await getDocs(signalsQuery)
				
				if (signalsSnapshot.empty) continue
				
				//get the first signal and the last signal
				const lastSignal = signalsSnapshot.docs[0].data() as Signal
				
				emergencyRides.push({
					...ride,
					last_signal: lastSignal,
				})
			}
			
			setEmergencyRides(emergencyRides)
			
			setLoadingOverlay({
				show: false,
				message: '',
			})
		})
		
		return () => {
			if (emergencyRidesUnsubscribe) {
				emergencyRidesUnsubscribe()
			}
		}
	}, [user])
	
	useEffect(() => {
		(async () => {
			await fetchCampusLocation({
				address: CAMPUS_NAME,
				callback: (location) => {
					setCampusLocation(location)
				},
			})
		})()
	}, [])
	
	return (
		<CustomLayout
			scrollable={true}
			header={
				<CustomHeader title="Emergency Rides" navigation={navigation} />
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20 }]}>
					{
						emergencyRides.map((emergencyRide, index) => (
							<EmergencyRideComponent
								key={index}
								ride={emergencyRide}
								navigation={navigation}
								currentLocation={currentLocation}
								campusLocation={campusLocation} />
						))
					}
					{
						emergencyRides.length === 0 &&
						<View style={[style.row, { gap: 5 }]}>
							<CustomText size={14} align="center" width="100%">
								No emergency rides
							</CustomText>
						</View>
					}
				</View>
			</View>
		</CustomLayout>
	)
}

export default EmergencyRides
