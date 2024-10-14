import { View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ModeContext } from '../components/contexts/ModeContext'
import { Car, Profile, Ride, Role } from '../database/schema'
import { doc, onSnapshot } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import style from '../styles/shared'
import MapView from 'react-native-maps'
import { useTheme } from 'react-native-paper'
import { CAMPUS_NAME, DirectionsResponse, fetchCampusLocation, getDirections } from '../api/location'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import PassengerView from './ViewRideComponents/PassengerView'
import { getPassengers } from '../api/rides'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import DriverView from './ViewRideComponents/DriverView'

type ViewRideProps = RouteProp<{ ViewRide: { rideId?: string } }, 'ViewRide'>;
const { db } = FirebaseApp

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
	const [sosCar, setSosCar] = useState<Car | null>(null)
	const [sosResponder, setSosResponder] = useState<Profile | null>(null)
	const [campusLocation, setCampusLocation] = useState<GooglePlaceDetail | null>(null)
	const [directions, setDirections] = useState<DirectionsResponse | null>(null)
	const [passengers, setPassengers] = useState<(Profile | null)[]>([])
	const mapRef = useRef<MapView | null>(null)
	
	// if the ride starts, send the user back to the previous screen if they arent part of the ride
	useEffect(() => {
		if (ride) {
			if (ride.started_at) {
				if (mode === Role.PASSENGER) {
					if (!ride.passengers.includes(user?.uid || '')) {
						navigation.goBack()
					}
				} else if (mode === Role.DRIVER) {
					if (ride.driver !== user?.uid) {
						if (ride.sos?.responded_by && ride.sos?.responded_by !== user?.uid) {
							navigation.goBack()
						}
					}
				}
			} else {
				if (mode === Role.PASSENGER) {
					if (!ride.passengers.includes(user?.uid || '')) {
						if (ride.cancelled_at || ride.passengers.length === ride.available_seats) {
							navigation.goBack()
						}
					}
				} else if (mode === Role.DRIVER) {
					if (ride.driver !== user?.uid) {
						if (!(ride.sos?.responded_by && ride.sos?.responded_by !== user?.uid)) {
							navigation.goBack()
						}
					}
				}
			}
		}
	}, [ride, mode, user])
	
	useEffect(() => {
		let unsubscribe: () => void
		let unsubscribeCar: () => void
		let unsubscribeDriver: () => void
		let unsubscribeSosResponder: () => void
		let unsubscribeSosCar: () => void
		
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
						unsubscribeCar = onSnapshot(doc(db, 'cars', snapshot.data()?.car), (carSnapshot) => {
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
						unsubscribeDriver = onSnapshot(doc(db, 'users', snapshot.data()?.driver), (driverSnapshot) => {
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
					
					if (snapshot.data()?.sos?.responded_by) {
						unsubscribeSosResponder = onSnapshot(doc(db, 'users', snapshot.data()?.sos?.responded_by), (sosResponderSnapshot) => {
							if (sosResponderSnapshot.exists()) {
								setSosResponder({
									...sosResponderSnapshot.data(),
									id: sosResponderSnapshot.id,
								} as Profile)
							} else {
								setSosResponder(null)
							}
						})
					}
					
					if (snapshot.data()?.sos?.car) {
						unsubscribeSosCar = onSnapshot(doc(db, 'cars', snapshot.data()?.sos?.car), (sosCarSnapshot) => {
							if (sosCarSnapshot.exists()) {
								setSosCar({
									...sosCarSnapshot.data(),
									id: sosCarSnapshot.id,
								} as Car)
							} else {
								setSosCar(null)
							}
						})
					}
				} else {
					setRide(null)
					setCar(null)
					setDriver(null)
					setSosResponder(null)
					setSosCar(null)
				}
			})
		}
		
		return () => {
			unsubscribe?.()
			unsubscribeCar?.()
			unsubscribeDriver?.()
			unsubscribeSosResponder?.()
			unsubscribeSosCar?.()
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
							sosCar={sosCar}
							sosResponder={sosResponder}
						/>
						:
						(ride && car && driver) &&
						<DriverView
							ride={ride}
							car={car}
							driver={driver}
							campusLocation={campusLocation}
							directions={directions}
							colors={colors}
							mapRef={mapRef}
							passengers={passengers}
							sosCar={sosCar}
							sosResponder={sosResponder}
						/>
				}
			</View>
		</CustomLayout>
	)
}

export default ViewRide
