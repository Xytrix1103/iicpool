import React, { useContext, useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { collection, onSnapshot } from 'firebase/firestore'
import CustomLayout from '../components/themed/CustomLayout'
import style from '../styles/shared'
import { Ride } from '../database/schema'
import FirebaseApp from '../components/FirebaseApp'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import CustomText from '../components/themed/CustomText'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import * as Location from 'expo-location'
import { PermissionContext } from '../components/contexts/PermissionContext'
import { useForm } from 'react-hook-form'
import { SegmentedButtons, useTheme } from 'react-native-paper'
import { GooglePlaceDetail, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete'
import CustomInputAutoComplete from './AddRideComponents/CustomInputAutoComplete'
import { RideFormTypeSingle } from './AddRideComponents/types'
import { fetchLocationByCoordinates } from '../api/location'
import CustomInput from '../components/themed/CustomInput'
import { getPreciseDistance } from 'geolib'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'

const { db } = FirebaseApp

type FilterFormType = {
	to_campus: boolean;
	location: RideFormTypeSingle | null;
	date: Date;
};

const FindRides = () => {
	const [rides, setRides] = useState<Ride[]>([])
	const navigation = useNavigation()
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const form = useForm<FilterFormType>({
		defaultValues: {
			to_campus: true,
			location: null,
			date: new Date(),
		},
	})
	const [locationInputFocused, setLocationInputFocused] = useState(false)
	const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
	
	const { setValue, watch, control, formState: { errors } } = form
	
	const { wrapPermissions } = useContext(PermissionContext)
	const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>(null)
	const { colors } = useTheme()
	
	const { to_campus, location, date } = watch()
	
	const handleLocationSelect = (details: GooglePlaceDetail | null) => {
		if (!details) {
			setValue('location', {
				place_id: '',
				formatted_address: '',
				name: '',
				geometry: {
					location: {
						lat: 0,
						lng: 0,
					},
				},
			})
		} else {
			setValue('location', {
				place_id: details.place_id,
				formatted_address: details.formatted_address,
				name: details.name || details.formatted_address,
				geometry: {
					location: {
						lat: details.geometry.location.lat,
						lng: details.geometry.location.lng,
					},
				},
			})
			
			setLocationInputFocused(false)
		}
	}
	
	useEffect(() => {
		wrapPermissions({
			operation: async () => {
				setLoadingOverlay({
					show: true,
					message: 'Fetching location...',
				})
				
				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Highest,
				})
				setCurrentLocation(location)
			},
			type: 'location',
			message: 'We need your location to find rides near you',
		}).then()
		
		const unsubscribe = onSnapshot(collection(db, 'rides'), (snapshot) => {
			const ridesData: Ride[] = snapshot.docs.map(doc => ({
				...doc.data(),
				id: doc.id,
			})) as Ride[]
			setRides(ridesData)
		})
		
		return () => unsubscribe()
	}, [])
	
	useEffect(() => {
		if (currentLocation) {
			fetchLocationByCoordinates({
				latitude: currentLocation.coords.latitude,
				longitude: currentLocation.coords.longitude,
			})
				.then((location) => {
					console.log(location)
					
					setValue('location', {
						place_id: location.place_id,
						formatted_address: location.formatted_address,
						name: location.name || location.formatted_address,
						geometry: {
							location: {
								lat: location.geometry.location.lat,
								lng: location.geometry.location.lng,
							},
						},
					})
				})
				.finally(() => {
					setLoadingOverlay({
						show: false,
						message: '',
					})
				})
		}
	}, [currentLocation])
	
	const renderItem = ({ ride }: { ride: Ride }) => {
		//get distance
		const distance = getPreciseDistance({
			latitude: location?.geometry.location.lat || 0,
			longitude: location?.geometry.location.lng || 0,
		}, {
			latitude: ride.location.geometry.location.lat,
			longitude: ride.location.geometry.location.lng,
		}, 1) / 1000
		
		return (
			<Pressable
				style={[style.row, {
					gap: 20,
					elevation: 10,
					borderRadius: 20,
					backgroundColor: 'white',
					paddingHorizontal: 20,
					paddingVertical: 10,
				}]}
				onPress={() => {
					// @ts-ignore
					navigation.navigate('ViewRide', { rideId: ride.id })
				}}
				key={ride.id}
			>
				<View style={[style.column, {
					flex: 1,
					justifyContent: 'center',
					gap: 5,
					alignItems: 'center',
				}]}>
					<Icon name="car" size={20} color="black" />
					<CustomText
						align="center"
						bold
					>
						{ride.available_seats - ride.passengers.length}/{ride.available_seats}
					</CustomText>
				</View>
				<View style={[style.column, { flex: 4, gap: 5 }]}>
					<View style={[style.row, { gap: 5 }]}>
						<CustomText size={14} bold numberOfLines={1}>
							{`${ride.to_campus ? 'From' : 'To'} ${ride.location?.name}`} ({distance.toFixed(2)} km)
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
			</Pressable>
		)
	}
	
	return (
		<CustomLayout
			contentPadding={20}
			scrollable={true}
			header={
				<CustomHeader
					title="Available Rides"
					navigation={navigation}
				/>
			}
		>
			<View style={[style.column, { gap: 30 }]}>
				<View style={[style.row]}>
					<View style={[style.column, { gap: 10 }]}>
						<View style={[style.row, { gap: 10, alignItems: 'center' }]}>
							<View style={{ flex: 1 }}>
								<Icon name="map-marker" size={30} color="black" />
							</View>
							<View style={{ flex: 9 }}>
								{
									location &&
									(
										locationInputFocused ?
											<CustomInputAutoComplete
												colors={colors}
												autocompleteRef={autocompleteRef}
												details={location}
												toCampus={to_campus}
												handleLocationSelect={handleLocationSelect}
											/> : (
												<Pressable
													style={{ width: '100%' }}
													onPress={() => setLocationInputFocused(true)}
												>
													<CustomInput
														editable={false}
														onPressIn={() => setLocationInputFocused(true)}
														label={to_campus ? 'Campus' : 'Drop-Off Location'}
														value={location.formatted_address}
														onChangeText={() => null}
														onPress={() => setLocationInputFocused(true)}
														rightIcon={
															location.place_id !== '' &&
															<Icon
																onPress={() => {
																	handleLocationSelect(null)
																}}
																name="close"
																size={20}
																// @ts-expect-error colors
																color={colors.text}
															/>
														}
													/>
												</Pressable>
											)
									)
								}
							</View>
						</View>
						<SegmentedButtons
							buttons={[
								{ value: 'true', label: 'To Campus' },
								{ value: 'false', label: 'From Campus' },
							]}
							onValueChange={(value) => setValue('to_campus', value === 'true')}
							value={to_campus.toString()}
						/>
					</View>
				</View>
				<View style={[style.column, { gap: 10 }]}>
					{
						rides.filter(ride => ride.to_campus === to_campus).map((ride) => (
							renderItem({ ride })
						))
					}
				</View>
			</View>
		</CustomLayout>
	)
}

export default FindRides
