import { View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ModeContext } from '../components/contexts/ModeContext'
import { Car, Profile, Ride, Role } from '../database/schema'
import { doc, onSnapshot } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import CustomText from '../components/themed/CustomText'
import style from '../styles/shared'
import MapView, { Marker } from 'react-native-maps'
import { useTheme } from 'react-native-paper'
import { CAMPUS_NAME, fetchCampusLocation, getDirections } from '../api/location'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import { CustomDirectionsResponse } from './AddRideComponents/types'
import PassengerView from './ViewRideComponents/PassengerView'
import { getPassengers } from '../api/rides'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomIconButton from '../components/themed/CustomIconButton'

type ViewRideProps = RouteProp<{ ViewRide: { rideId?: string } }, 'ViewRide'>;
const { db } = FirebaseApp


const DriverView = ({ ride, car, driver }: { ride: Ride, car: Car | null, driver: Profile | null }) => {
	return (
		<View style={[style.column, { gap: 20 }]}>
			<View style={style.row}>
				<CustomText size={16} bold>
					{ride.to_campus ? 'From' : 'To'} {ride.location?.name}
				</CustomText>
			</View>
			<View style={style.row}>
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
			<View style={style.row}>
				<CustomText size={14}>
					Vehicle: {car?.brand} {car?.model} ({car?.plate})
				</CustomText>
			</View>
			<View style={style.row}>
				<CustomText size={14}>
					Available Seats: {ride.available_seats}
				</CustomText>
			</View>
			<View style={style.row}>
				<CustomText size={14}>
					Passengers: {(ride.passengers ?? []).length}/{ride.available_seats}
				</CustomText>
			</View>
			<MapView
				style={{ height: 300, width: '100%' }}
				initialRegion={{
					latitude: ride.location?.geometry.location.lat || 0,
					longitude: ride.location?.geometry.location.lng || 0,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				}}
			>
				<Marker
					coordinate={{
						latitude: ride.location?.geometry.location.lat || 0,
						longitude: ride.location?.geometry.location.lng || 0,
					}}
					title={ride.location?.name}
				/>
			</MapView>
		</View>
	)
}

const ViewRide = () => {
	const { mode } = useContext(ModeContext)
	const { user } = useContext(AuthContext)
	const route = useRoute<ViewRideProps>()
	const { colors } = useTheme()
	const navigation = useNavigation()
	const rideId = route.params?.rideId
	const [ride, setRide] = useState<Ride | null>(null)
	const [car, setCar] = useState<Car | null>(null)
	const [driver, setDriver] = useState<Profile | null>(null)
	const [campusLocation, setCampusLocation] = useState<GooglePlaceDetail | null>(null)
	const [directions, setDirections] = useState<CustomDirectionsResponse | null>(null)
	const [passengers, setPassengers] = useState<(Profile | null)[]>([])
	const mapRef = useRef<MapView | null>(null)
	
	useEffect(() => {
		let unsubscribe: () => void
		
		if (rideId) {
			fetchCampusLocation({
				address: CAMPUS_NAME,
				callback: (location) => setCampusLocation(location),
			}).then()
			
			unsubscribe = onSnapshot(doc(db, 'rides', rideId), (snapshot) => {
				if (snapshot.exists()) {
					setRide({
						...snapshot.data(),
						id: snapshot.id,
					} as Ride)
					
					if (snapshot.data()?.car) {
						onSnapshot(doc(db, 'cars', snapshot.data()?.car), (carSnapshot) => {
							if (carSnapshot.exists()) {
								setCar({
									...carSnapshot.data(),
									id: carSnapshot.id,
								} as Car)
							} else {
								setCar(null)
							}
						})
					}
					
					if (snapshot.data()?.driver) {
						onSnapshot(doc(db, 'users', snapshot.data()?.driver), (driverSnapshot) => {
							if (driverSnapshot.exists()) {
								setDriver({
									...driverSnapshot.data(),
									id: driverSnapshot.id,
								} as Profile)
							} else {
								setDriver(null)
							}
						})
					}
				} else {
					setRide(null)
					setCar(null)
					setDriver(null)
				}
			})
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [rideId])
	
	useEffect(() => {
		if (ride && rideId) {
			(async () => {
				const result = await getPassengers(rideId)
				setPassengers(result)
			})()
		}
	}, [ride])
	
	useEffect(() => {
		console.log('Directions updated:', directions)
		if (directions) {
			const { northeast, southwest } = directions.routes[0].bounds
			
			const centerLatitude = (northeast.lat + southwest.lat) / 2
			const centerLongitude = (northeast.lng + southwest.lng) / 2
			
			const paddingFactor = 0.4 // Adjust this value to add more space around the bounds
			const latitudeDelta = Math.abs(northeast.lat - southwest.lat) * (1 + paddingFactor)
			const longitudeDelta = Math.abs(northeast.lng - southwest.lng) * (1 + paddingFactor)
			
			mapRef.current?.animateToRegion({
				latitude: centerLatitude,
				longitude: centerLongitude,
				latitudeDelta,
				longitudeDelta,
			}, 1000)
		}
	}, [directions])
	
	useEffect(() => {
		console.log('Ride updated:', ride)
		console.log('Campus location updated:', campusLocation)
		//get directions
		if (ride && campusLocation) {
			getDirections({
				origin: !ride.to_campus ? campusLocation.place_id : ride.location?.place_id || '',
				destination: !ride.to_campus ? ride.location?.place_id || '' : campusLocation.place_id,
			}).then((result) => {
				if (result) {
					setDirections(result)
				}
			})
		}
	}, [ride, campusLocation])
	
	return (
		<CustomLayout
			header={
				<CustomHeader
					title="Ride Details"
					navigation={navigation}
					rightNode={
						<CustomIconButton
							icon="message-text"
							onPress={() => {
								// @ts-ignore
								navigation.navigate('Chat', { rideId })
							}}
						/>
					}
				/>
			}
			scrollable={true}
		>
			<View style={style.mainContent}>
				{
					mode === Role.PASSENGER ?
						(ride && car && driver) &&
						<PassengerView
							ride={ride}
							car={car}
							driver={driver}
							campusLocation={campusLocation}
							directions={directions}
							colors={colors}
							mapRef={mapRef}
							passengers={passengers}
						/>
						:
						(ride && car && driver) &&
						<DriverView ride={ride} car={car} driver={driver} />
				}
			</View>
		</CustomLayout>
	)
}

export default ViewRide
