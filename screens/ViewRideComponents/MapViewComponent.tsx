import React, { useEffect, useState } from 'react'
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { Linking, StyleSheet, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { CAMPUS_NAME, decodePolyline, getDirectionsByCoordinates } from '../../api/location'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import { CustomDirectionsResponse } from '../AddRideComponents/types'
import { Profile, Ride, Signal } from '../../database/schema'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import style from '../../styles/shared'
import CustomText from '../../components/themed/CustomText'
import CustomOutlinedButton from '../../components/themed/CustomOutlinedButton'
import {
	handleBookRide,
	handleCancelBooking,
	handleCancelRide,
	handleCompleteRide,
	handleStartRide,
} from '../../api/rides'
import CustomSolidButton from '../../components/themed/CustomSolidButton'
import { User } from 'firebase/auth'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import FirebaseApp from '../../components/FirebaseApp'

type MapViewComponentProps = {
	ride: Ride,
	directions: CustomDirectionsResponse | null,
	campusLocation: GooglePlaceDetail | null,
	colors: MD3Colors,
	mapRef: React.MutableRefObject<MapView | null>,
	passengers: (Profile | null)[],
	isInRide: string | null,
	currentRide?: Ride | null,
	user: User | null
	mode: 'driver' | 'passenger'
};

const { db } = FirebaseApp

const MapViewComponent: React.FC<MapViewComponentProps> = (
	{
		ride,
		directions,
		campusLocation,
		colors,
		mapRef,
		passengers,
		isInRide,
		currentRide,
		user,
		mode,
	},
) => {
	const routeDuration = directions?.routes[0].legs?.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0) || 0
	const routeDistance = directions?.routes[0].legs?.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0) || 0
	const [realTimeRoute, setRealTimeRoute] = useState<CustomDirectionsResponse | null>(null)
	const [signals, setSignals] = useState<Signal[] | null>(null)
	const isRideOngoing = ride.started_at && !ride.completed_at && !ride.cancelled_at
	
	//get the real time route
	useEffect(() => {
		let unsubscribe: () => void
		
		if (ride.started_at && !ride.completed_at && !ride.cancelled_at) {
			unsubscribe = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), where('user', '==', ride.driver), orderBy('timestamp', 'desc')), (snapshot) => {
				setSignals(snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}) as Signal))
			})
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [ride])
	
	//get the real time route from the latest location of the driver to the destination
	useEffect(() => {
		//use getDirectionsByCoordinates to get the real time route
		if (signals && signals.length > 0) {
			const lastSignal = signals[0]
			
			getDirectionsByCoordinates({
				origin: { latitude: lastSignal.latitude, longitude: lastSignal.longitude } as LatLng,
				destination: {
					latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
					longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
				} as LatLng,
			}).then((response) => {
				setRealTimeRoute(response)
			})
		}
	}, [])
	
	//refresh map when realTimeRoute changes
	useEffect(() => {
		if (realTimeRoute) {
			mapRef.current?.fitToCoordinates(
				[
					{ latitude: signals?.[0]?.latitude || 0, longitude: signals?.[0]?.longitude || 0 },
					{
						latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
						longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
					},
				],
				{
					edgePadding: {
						top: 50,
						right: 50,
						bottom: 50,
						left: 50,
					},
				},
			)
		}
	}, [realTimeRoute])
	
	return (
		//another map to show the live location of the driver
		<View style={[style.column, { gap: 20 }]}>
			<View
				style={[
					style.row,
					{
						backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 10,
					},
				]}
			>
				<View style={[style.column, { gap: 20, flex: 1 }]}>
					<View style={[style.row, { gap: 5, alignItems: 'center', justifyContent: 'center' }]}>
						<CustomText size={16} bold align="center"
						            color={ride.cancelled_at ? 'red' : ride.completed_at ? 'green' : ride.started_at ? 'blue' : 'black'}>
							{
								ride.cancelled_at ? 'CANCELLED' :
									ride.completed_at ? 'COMPLETED' :
										ride.started_at ? 'ONGOING' :
											'PENDING'
							}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 10 }]}>
						<View style={[style.row, { width: 'auto', gap: 5 }]}>
							<Icon name="calendar" size={20} />
							<CustomText size={14} bold>
								{ride.datetime.toDate().toLocaleString('en-GB', {
									day: 'numeric',
									month: 'numeric',
									year: 'numeric',
								})}
							</CustomText>
						</View>
						<View style={[style.row, { width: 'auto', gap: 5 }]}>
							<Icon name="clock" size={20} />
							<CustomText size={14} bold>
								{ride.datetime.toDate().toLocaleString('en-GB', {
									hour: '2-digit',
									minute: '2-digit',
									hour12: true,
								})}
							</CustomText>
						</View>
						<View style={[style.row, { width: 'auto', gap: 5 }]}>
							<Icon name="cash" size={20} />
							<CustomText size={14} bold>
								RM {ride.fare}
							</CustomText>
						</View>
					</View>
					<View style={[style.row, { gap: 5 }]}>
						<View style={[style.column, {
							flexDirection: ride.to_campus ? 'column' : 'column-reverse',
						}]}>
							<View style={[style.row, { gap: 5 }]}>
								<View style={[style.column, { gap: 5, flex: 1 }]}>
									<Icon name="map-marker" size={30} />
								</View>
								<View style={[style.column, { gap: 5, flex: 6 }]}>
									<CustomText size={14} bold>
										{ride.location?.name}
									</CustomText>
								</View>
							</View>
							<View style={[style.row, { gap: 5 }]}>
								<View style={[style.column, { gap: 5, flex: 1 }]}>
									<Icon name="dots-vertical" size={30} />
								</View>
								<View style={[style.column, { gap: 5, flex: 6 }]}>
									<CustomText size={14}>
										~ {Math.ceil(routeDuration / 60)} minutes
										({(routeDistance / 1000).toFixed(2)} km)
									</CustomText>
								</View>
							</View>
							<View style={[style.row, { gap: 5 }]}>
								<View style={[style.column, { gap: 5, flex: 1 }]}>
									<Icon name="school" size={30} />
								</View>
								<View style={[style.column, { gap: 5, flex: 6 }]}>
									<CustomText size={14} bold>
										{CAMPUS_NAME}
									</CustomText>
								</View>
							</View>
						</View>
					</View>
					<View style={[style.row, { gap: 5 }]}>
						<View style={[style.column, { gap: 20 }]}>
							<MapView
								provider={PROVIDER_GOOGLE}
								style={[localStyle.map]}
								showsBuildings={true}
								showsUserLocation={!isRideOngoing}
								ref={mapRef}
								initialRegion={{
									latitude: 0,
									longitude: 0,
									latitudeDelta: 0.01,
									longitudeDelta: 0.01,
								}}
								zoomEnabled={false}
								scrollEnabled={false}
								loadingEnabled={true}
							>
								{
									(isRideOngoing && realTimeRoute) ?
										(
											<>
												<Marker
													coordinate={{
														latitude: signals?.[0]?.latitude || 0,
														longitude: signals?.[0]?.longitude || 0,
													}}
													tracksViewChanges={false}
												>
													<Icon name="car" size={30} color={colors.primary} />
												</Marker>
												<Polyline
													coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
													strokeColor={colors.primary}
													strokeWidth={2}
												/>
												<Marker
													coordinate={{
														latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
														longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
													}}
													tracksViewChanges={false}
												>
													<Icon name="map-marker" size={30} color={colors.primary} />
												</Marker>
											</>
										) : (
											<>
												<Marker
													coordinate={{
														latitude: campusLocation?.geometry.location.lat || 0,
														longitude: campusLocation?.geometry.location.lng || 0,
													}}
													tracksViewChanges={false}
												>
													<Icon name="school" size={30} color={colors.primary} />
												</Marker>
												<Marker
													coordinate={{
														latitude: ride.location?.geometry.location.lat || 0,
														longitude: ride.location?.geometry.location.lng || 0,
													}}
													tracksViewChanges={false}
												>
													<Icon name="map-marker" size={30} color={colors.primary} />
												</Marker>
												{
													directions &&
													<Polyline
														coordinates={decodePolyline(directions.routes[0].overview_polyline.points)}
														strokeColor={colors.primary}
														strokeWidth={2}
													/>
												}
											</>
										)
								}
							</MapView>
							{
								!isRideOngoing && (
									<View style={[style.row, { gap: 20, justifyContent: 'center' }]}>
										<CustomText size={14}>
											View route on{' '}
											<CustomText
												size={14}
												color={colors.primary}
												bold
												onPress={() => {
													const url = `https://www.google.com/maps/dir/?api=1&origin=${campusLocation?.geometry.location.lat},${campusLocation?.geometry.location.lng}&destination=${ride.location?.geometry.location.lat},${ride.location?.geometry.location.lng}`
													Linking.openURL(url).then(r => r)
												}}
											>
												Google Maps
											</CustomText>
										</CustomText>
									</View>
								)
							}
							{
								mode === 'passenger' ?
									<View style={[style.row, { gap: 10 }]}>
										{
											isInRide ? (
												(isInRide === ride.id && passengers.some((passenger) => passenger?.id === user?.uid)) ?
													<CustomOutlinedButton
														onPress={() => {
															handleCancelBooking({ ride: currentRide!, user })
														}}
													>
														Cancel Booking
													</CustomOutlinedButton> :
													null
											) : null
										}
										{
											passengers.every((passenger) => passenger?.id !== user?.uid) &&
											<CustomSolidButton
												onPress={() => {
													handleBookRide({ ride, user, isInRide })
												}}
											>
												Book Ride
											</CustomSolidButton>
										}
									</View> :
									(!ride.started_at && !ride.completed_at && !ride.cancelled_at) ? (
										<View style={[style.row, { gap: 10 }]}>
											<CustomSolidButton
												onPress={() => {
													handleStartRide({ ride: currentRide!, user })
												}}
											>
												Start Ride
											</CustomSolidButton>
											<CustomOutlinedButton
												onPress={() => {
													handleCancelRide({ ride: currentRide!, user })
												}}
											>
												Cancel Ride
											</CustomOutlinedButton>
										</View>
									) : (
										isRideOngoing &&
										<View style={[style.row, { gap: 10 }]}>
											<CustomSolidButton
												onPress={() => {
													handleCompleteRide({ ride: currentRide!, user })
												}}
											>
												Complete Ride
											</CustomSolidButton>
										</View>
									)
							}
						</View>
					</View>
				</View>
			</View>
		</View>
	)
}

const localStyle = StyleSheet.create({
	map: {
		width: '100%',
		height: 400,
		alignSelf: 'center',
	},
})

export default MapViewComponent
