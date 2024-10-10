import React, { useContext, useEffect, useState } from 'react'
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { Linking, StyleSheet, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import {
	CAMPUS_NAME,
	decodePolyline,
	DirectionsResponse,
	fetchLocationByCoordinates,
	getDirectionsByCoordinates,
} from '../../api/location'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import { Car, Profile, Ride, Role, Signal } from '../../database/schema'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import style from '../../styles/shared'
import CustomText from '../../components/themed/CustomText'
import CustomOutlinedButton from '../../components/themed/CustomOutlinedButton'
import {
	handleBookRide,
	handleCancelBooking,
	handleCancelRide,
	handleCompleteRide,
	handleCompleteSOSRide,
	handleRespondSOS,
	handleStartRide,
	handleStartSOSRide,
	handleTriggerSOS,
} from '../../api/rides'
import CustomSolidButton from '../../components/themed/CustomSolidButton'
import { User } from 'firebase/auth'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import FirebaseApp from '../../components/FirebaseApp'
import * as Location from 'expo-location'
import { PermissionContext } from '../../components/contexts/PermissionContext'
import { RadioButton } from 'react-native-paper'

type MapViewComponentProps = {
	ride: Ride,
	directions: DirectionsResponse | null,
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
	const [realTimeRoute, setRealTimeRoute] = useState<DirectionsResponse | null>(null)
	const [signals, setSignals] = useState<Signal[] | null>(null)
	const [sosResponderSignals, setSOSResponderSignals] = useState<Signal[] | null>(null)
	const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>()
	const { wrapPermissions } = useContext(PermissionContext)
	const isRideOngoing = ride.started_at && !ride.completed_at && !ride.cancelled_at
	const isRideAwaitingSOSResponse = ride.sos?.triggered_at && !ride.sos?.responded_by
	const originToWaypointDuration = realTimeRoute?.routes?.[0]?.legs?.[0]?.duration?.value || 0
	const waypointToDestinationDuration = realTimeRoute?.routes?.[0]?.legs?.[1]?.duration?.value || 0
	const originToWaypointDistance = realTimeRoute?.routes?.[0]?.legs?.[0]?.distance?.value || 0
	const waypointToDestinationDistance = realTimeRoute?.routes?.[0]?.legs?.[1]?.distance?.value || 0
	const [waypoint, setWaypoint] = useState<GooglePlaceDetail | null>(null)
	const [cars, setCars] = useState<Car[] | null>(null)
	const [selectedCar, setSelectedCar] = useState<Car | null>(cars?.[0] || null)
	
	useEffect(() => {
		if (signals && signals.length > 0) {
			fetchLocationByCoordinates({
				latitude: signals[0].latitude,
				longitude: signals[0].longitude,
			}).then(result => {
				setWaypoint(result)
			})
		}
	}, [signals])

	useEffect(() => {
		const unsubscribe = onSnapshot(query(collection(db, 'cars'), where('owner', '==', user?.uid)), (snapshot) => {
			setCars(snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}) as Car))
		})

		return () => {
			unsubscribe()
		}
	}, [user])
	
	//get the real time route
	useEffect(() => {
		let unsubscribe: () => void
		let unsubscribeSOS: () => void
		
		(async () => {
			if (mode === Role.DRIVER) {
				await wrapPermissions({
					operation: async () => {
						const location = await Location.getCurrentPositionAsync()
						setCurrentLocation(location)
					},
					type: 'location',
					message: 'We need your location to show you the directions',
				})
			}
		})()
		
		if (ride.started_at && !ride.completed_at && !ride.cancelled_at) {
			unsubscribe = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), where('user', '==', ride.driver), orderBy('timestamp', 'desc')), (snapshot) => {
				setSignals(snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}) as Signal))
			})
			
			unsubscribeSOS = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), where('user', '==', ride.sos?.responded_by), orderBy('timestamp', 'desc')), (snapshot) => {
				setSOSResponderSignals(snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}) as Signal))
			})
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
			if (unsubscribeSOS) {
				unsubscribeSOS()
			}
		}
	}, [ride, mode])
	
	//get the real time route from the latest location of the driver to the destination
	useEffect(() => {
		//use getDirectionsByCoordinates to get the real time route
		if (isRideOngoing && signals && signals.length > 0) {
			const lastSignal = signals[0]
			
			if (ride.sos === null) {
				console.log('Ride is ongoing without SOS')
				getDirectionsByCoordinates({
					origin: { latitude: lastSignal.latitude, longitude: lastSignal.longitude } as LatLng,
					destination: {
						latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
						longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
					} as LatLng,
				}).then((response) => {
					setRealTimeRoute(response)
				})
			} else {
				console.log('Ride is ongoing with SOS')
				if (ride.sos.responded_by) {
					console.log('Ride has SOS responder')
					if (!sosResponderSignals || sosResponderSignals.length === 0) {
						return
					}
					
					const lastResponderSignal = sosResponderSignals[0]
					
					if (!ride.sos.started_at) {
						console.log('SOS responder has not started the ride')
						getDirectionsByCoordinates({
							origin: {
								latitude: lastResponderSignal.latitude,
								longitude: lastResponderSignal.longitude,
							} as LatLng,
							waypoints: [{
								latitude: lastSignal.latitude,
								longitude: lastSignal.longitude,
							}],
							destination: {
								latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
								longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
							} as LatLng,
						}).then((response) => {
							setRealTimeRoute(response)
						})
					} else {
						console.log('SOS responder has started the ride')
						getDirectionsByCoordinates({
							origin: {
								latitude: lastResponderSignal.latitude,
								longitude: lastResponderSignal.longitude,
							} as LatLng,
							destination: {
								latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
								longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
							} as LatLng,
						}).then((response) => {
							setRealTimeRoute(response)
						})
					}
				} else {
					console.log('Ride has SOS triggered')
					if (mode === Role.DRIVER) {
						if (ride.driver === user?.uid) {
							console.log('User is the driver')
							
							getDirectionsByCoordinates({
								origin: {
									latitude: lastSignal.latitude,
									longitude: lastSignal.longitude,
								} as LatLng,
								destination: {
									latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
									longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
								} as LatLng,
							}).then((response) => {
								setRealTimeRoute(response)
							})
						} else {
							console.log('User is not the driver')
							
							if (!currentLocation) {
								return
							}
							
							getDirectionsByCoordinates({
								origin: {
									latitude: currentLocation.coords.latitude,
									longitude: currentLocation.coords.longitude,
								} as LatLng,
								waypoints: [{
									latitude: lastSignal.latitude,
									longitude: lastSignal.longitude,
								}],
								destination: {
									latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
									longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
								} as LatLng,
							}).then((response) => {
								setRealTimeRoute(response)
							})
						}
					} else {
						console.log('User is not the driver')
						
						getDirectionsByCoordinates({
							origin: {
								latitude: lastSignal.latitude,
								longitude: lastSignal.longitude,
							} as LatLng,
							destination: {
								latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
								longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
							} as LatLng,
						}).then((response) => {
							setRealTimeRoute(response)
						})
					}
				}
			}
		}
	}, [signals, sosResponderSignals, ride, campusLocation, isRideOngoing])
	
	//refresh map when realTimeRoute changes
	useEffect(() => {
		if (realTimeRoute) {
			//match the above logic
			const { northeast, southwest } = realTimeRoute.routes[0].bounds
			
			const centerLatitude = (northeast.lat + southwest.lat) / 2
			const centerLongitude = (northeast.lng + southwest.lng) / 2
			
			const paddingFactor = 0.3 // Adjust this value to add more space around the bounds
			const latitudeDelta = Math.abs(northeast.lat - southwest.lat) * (1 + paddingFactor)
			const longitudeDelta = Math.abs(northeast.lng - southwest.lng) * (1 + paddingFactor)
			
			mapRef.current?.animateToRegion({
				latitude: centerLatitude,
				longitude: centerLongitude,
				latitudeDelta,
				longitudeDelta,
			}, 1000)
		} else if (directions) {
			//match the above logic
			const { northeast, southwest } = directions.routes[0].bounds
			
			const centerLatitude = (northeast.lat + southwest.lat) / 2
			const centerLongitude = (northeast.lng + southwest.lng) / 2
			const paddingFactor = 0.3 // Adjust this value to add more space around the bounds
			const latitudeDelta = Math.abs(northeast.lat - southwest.lat) * (1 + paddingFactor)
			const longitudeDelta = Math.abs(northeast.lng - southwest.lng) * (1 + paddingFactor)
			
			mapRef.current?.animateToRegion({
				latitude: centerLatitude,
				longitude: centerLongitude,
				latitudeDelta,
				longitudeDelta,
			}, 1000)
		} else {
			mapRef.current?.animateToRegion({
				latitude: 0,
				longitude: 0,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			}, 1000)
		}
	}, [realTimeRoute, signals, sosResponderSignals, ride, campusLocation, directions])
	
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
					{
						(isRideAwaitingSOSResponse && mode === Role.DRIVER && ride.driver !== user?.uid && currentLocation) ?
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
							</View> :
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
					}
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
									realTimeRoute ? (
										ride.sos ? (
											ride.sos?.responded_by ? (
												ride.sos.started_at ? (
													<>
														<Marker
															coordinate={{
																latitude: sosResponderSignals?.[0]?.latitude || 0,
																longitude: sosResponderSignals?.[0]?.longitude || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name="car" size={30} color={colors.primary} />
														</Marker>
														<Marker
															coordinate={{
																latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
																longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name="map-marker" size={30} color={colors.primary} />
														</Marker>
														<Polyline
															coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
															strokeColor={colors.primary}
															strokeWidth={2}
														/>
													</>
												) : (
													<>
														<Marker
															coordinate={{
																latitude: sosResponderSignals?.[0]?.latitude || 0,
																longitude: sosResponderSignals?.[0]?.longitude || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name="human" size={30} />
														</Marker>
														<Marker
															coordinate={{
																latitude: signals?.[0]?.latitude || 0,
																longitude: signals?.[0]?.longitude || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name="car-emergency" size={30}
															      color={colors.primary} />
														</Marker>
														<Marker
															coordinate={{
																latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
																longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name={ride.to_campus ? 'school' : 'map-marker'}
															      size={30} color={colors.primary} />
														</Marker>
														<Polyline
															coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
															strokeColor={colors.primary}
															strokeWidth={2}
														/>
													</>
												)
											) : (
												mode === Role.DRIVER ? (
													ride.driver === user?.uid ? (
														<>
															<Marker
																coordinate={{
																	latitude: signals?.[0]?.latitude || 0,
																	longitude: signals?.[0]?.longitude || 0,
																}}
																tracksViewChanges={false}
															>
																<Icon name="car-emergency" size={30}
																      color={colors.primary} />
															</Marker>
															<Marker
																coordinate={{
																	latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
																	longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
																}}
																tracksViewChanges={false}
															>
																<Icon name={ride.to_campus ? 'school' : 'map-marker'}
																      size={30} color={colors.primary} />
															</Marker>
															<Polyline
																coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
																strokeColor={colors.primary}
																strokeWidth={2}
															/>
														</>
													) : (
														<>
															<Marker
																coordinate={{
																	latitude: currentLocation?.coords.latitude || 0,
																	longitude: currentLocation?.coords.longitude || 0,
																}}
																tracksViewChanges={false}
															>
																<Icon name="human" size={30} />
															</Marker>
															<Marker
																coordinate={{
																	latitude: signals?.[0]?.latitude || 0,
																	longitude: signals?.[0]?.longitude || 0,
																}}
																tracksViewChanges={false}
															>
																<Icon name="car-emergency" size={30}
																      color={colors.primary} />
															</Marker>
															<Marker
																coordinate={{
																	latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
																	longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
																}}
																tracksViewChanges={false}
															>
																<Icon name={ride.to_campus ? 'school' : 'map-marker'}
																      size={30} color={colors.primary} />
															</Marker>
															<Polyline
																coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
																strokeColor={colors.primary}
																strokeWidth={2}
															/>
														</>
													)
												) : (
													<>
														<Marker
															coordinate={{
																latitude: signals?.[0]?.latitude || 0,
																longitude: signals?.[0]?.longitude || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name="car-emergency" size={30}
															      color={colors.primary} />
														</Marker>
														<Marker
															coordinate={{
																latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
																longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
															}}
															tracksViewChanges={false}
														>
															<Icon name="map-marker" size={30}
															      color={colors.primary} />
														</Marker>
														<Polyline
															coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
															strokeColor={colors.primary}
															strokeWidth={2}
														/>
													</>
												)
											)
										) : (
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
												<Marker
													coordinate={{
														latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
														longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
													}}
													tracksViewChanges={false}
												>
													<Icon name="map-marker" size={30} color={colors.primary} />
												</Marker>
												<Polyline
													coordinates={decodePolyline(realTimeRoute.routes[0].overview_polyline.points)}
													strokeColor={colors.primary}
													strokeWidth={2}
												/>
											</>
										)
									) : (
										directions ? (
											<>
												<Marker
													coordinate={{
														latitude: ride.to_campus ? campusLocation?.geometry.location.lat || 0 : ride.location?.geometry.location.lat || 0,
														longitude: ride.to_campus ? campusLocation?.geometry.location.lng || 0 : ride.location?.geometry.location.lng || 0,
													}}
													tracksViewChanges={false}
												>
													<Icon name="map-marker" size={30} color={colors.primary} />
												</Marker>
												<Polyline
													coordinates={decodePolyline(directions.routes[0].overview_polyline.points)}
													strokeColor={colors.primary}
													strokeWidth={2}
												/>
											</>
										) : null
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
								mode === Role.PASSENGER ? (
									<View style={[style.row, { gap: 10 }]}>
										{
											isInRide ? (
												(isInRide === ride.id && passengers.some((passenger) => passenger?.id === user?.uid) && !isRideOngoing) ?
													<CustomOutlinedButton
														onPress={() => {
															handleCancelBooking({ ride, user })
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
									</View>
								) : (
									isRideOngoing ? (
										ride.driver === user?.uid ? (
											ride.sos ? null : (
												<View style={[style.row, { gap: 10 }]}>
													<CustomSolidButton
														onPress={() => {
															handleCompleteRide({ ride, user })
														}}
													>
														Complete Ride
													</CustomSolidButton>
												</View>
											)
										) : (
											ride.sos ? (
												ride.sos.triggered_at && !ride.sos.responded_by ? (
													((cars?.length || 0) > 0 && selectedCar) ? (
														<>
															<View style={[style.row, { gap: 10 }]}>
																<View style={[style.column, { alignItems: 'flex-start', width: '100%' }]}>
																	{cars?.map((car, index) => (
																		<RadioButton.Item
																			key={index}
																			label={`${car.plate} - ${car.brand} ${car.model}`}
																			value={car.id as string}
																			color={colors.primary}
																			status={selectedCar === car ? 'checked' : 'unchecked'}
																			position="leading"
																			style={{ paddingVertical: 0 }}
																			onPress={() => {
																				setSelectedCar(car)
																			}}
																		/>
																	))}
																</View>
															</View>
															<View style={[style.row, { gap: 10 }]}>
																<CustomSolidButton
																	onPress={() => {
																		handleRespondSOS({ ride, user, car: selectedCar })
																	}}
																>
																	Respond to SOS
																</CustomSolidButton>
															</View>
														</>
													) : (
														<View style={[style.row, { gap: 10 }]}>
															<CustomText
																size={14}
																align="center"
																width="100%"
															>
																You must have a car to respond to SOS
															</CustomText>
														</View>
													)
												) : (
													ride.sos.responded_by === user?.uid ? (
														ride.sos.started_at ? (
															<View style={[style.row, { gap: 10 }]}>
																<CustomSolidButton
																	onPress={() => {
																		handleCompleteSOSRide({
																			ride,
																			user,
																		})
																	}}
																>
																	Complete SOS Ride
																</CustomSolidButton>
															</View>
														) : (
															<View style={[style.row, { gap: 10 }]}>
																<CustomSolidButton
																	onPress={() => {
																		handleStartSOSRide({ ride, user })
																	}}
																>
																	Start SOS Ride
																</CustomSolidButton>
															</View>
														)
													) : null
												)
											) : (
												<View style={[style.row, { gap: 10 }]}>
													<CustomSolidButton
														onPress={() => {
															handleTriggerSOS({ ride, user })
														}}
													>
														Trigger SOS
													</CustomSolidButton>
												</View>
											)
										)
									) : (
										ride.cancelled_at || ride.completed_at ? null : (
											<View style={[style.row, { gap: 10 }]}>
												<CustomSolidButton
													onPress={() => {
														handleStartRide({ ride, user })
													}}
												>
													Start Ride
												</CustomSolidButton>
												<CustomOutlinedButton
													onPress={() => {
														handleCancelRide({ ride, user })
													}}
												>
													Cancel Ride
												</CustomOutlinedButton>
											</View>
										)
									)
								)
							}
							{
								isRideOngoing && ride.sos && (ride.driver === user?.uid || ride.passengers.some((passenger) => passenger === user?.uid)) ? (
									ride.sos.responded_by ? (
										<View style={[style.row, { gap: 10 }]}>
											<CustomText
												size={14}
												align="center"
												width="100%"
											>
												SOS responded by another driver
											</CustomText>
										</View>
									) : (
										<View style={[style.row, { gap: 10 }]}>
											<CustomText
												size={14}
												align="center"
												width="100%"
											>
												Awaiting SOS response by other drivers
											</CustomText>
										</View>
									)
								) : null
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
