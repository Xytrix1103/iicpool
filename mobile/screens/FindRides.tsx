import React, { useContext, useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
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
import { Controller, useForm } from 'react-hook-form'
import { SegmentedButtons, useTheme } from 'react-native-paper'
import { GooglePlaceDetail, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete'
import CustomInputAutoComplete from './AddRideComponents/CustomInputAutoComplete'
import { RideFormTypeSingle } from './AddRideComponents/types'
import { fetchLocationByCoordinates } from '../api/location'
import CustomInput from '../components/themed/CustomInput'
import { getPreciseDistance } from 'geolib'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { AuthContext } from '../components/contexts/AuthContext'
import { Timestamp } from '@firebase/firestore'
import { ModeContext } from '../components/contexts/ModeContext'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

const { db } = FirebaseApp

type FilterFormType = {
	to_campus: boolean;
	location: RideFormTypeSingle | null;
	date: Date;
	filter: 'datetime' | 'distance';
};

type CustomRide = Ride & {
	distance: number;
}

const FindRides = () => {
	const [rides, setRides] = useState<CustomRide[]>([])
	const navigation = useNavigation()
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { user } = useContext(AuthContext)
	const { isInRide } = useContext(ModeContext)
	const form = useForm<FilterFormType>({
		defaultValues: {
			to_campus: true,
			location: null,
			date: new Date(),
			filter: 'datetime',
		},
	})
	const [locationInputFocused, setLocationInputFocused] = useState(false)
	const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
	
	const { setValue, watch } = form
	
	const { wrapPermissions } = useContext(PermissionContext)
	const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>(null)
	const { colors } = useTheme()
	
	const { to_campus, location, date, filter } = watch()
	
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
	
	const ridesQuery = query(collection(db, 'rides'), where('driver', '!=', user?.uid), where('completed_at', '==', null), where('cancelled_at', '==', null), where('started_at', '==', null), where('datetime', '>=', Timestamp.fromDate(date)))
	
	useEffect(() => {
		const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
			const ridesData: CustomRide[] = snapshot.docs.map(doc => ({
				...doc.data(),
				id: doc.id,
				distance: getPreciseDistance({
					latitude: location?.geometry.location.lat || 0,
					longitude: location?.geometry.location.lng || 0,
				}, {
					latitude: doc.data().location.geometry.location.lat,
					longitude: doc.data().location.geometry.location.lng,
				}, 1) / 1000,
			})) as CustomRide[]
			
			//order by distance in ascending order first, then by datetime (positive) difference from selected date in ascending order
			ridesData.sort((a, b) => a.distance - b.distance || Math.abs(a.datetime.toDate().getTime() - date.getTime()) - Math.abs(b.datetime.toDate().getTime() - date.getTime()))
			setRides(ridesData)
		})
		
		return () => {
			unsubscribe()
		}
	}, [location, date, to_campus])
	
	const renderItem = ({ ride }: { ride: CustomRide }) => {
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
				<View style={[style.column, {
					width: 'auto',
					justifyContent: 'center',
					gap: 5,
					alignItems: 'center',
				}]}>
					<Icon name="car" size={20} color="black" />
					<CustomText
						align="center"
						bold
						size={14}
					>
						{ride.available_seats - ride.passengers.length}/{ride.available_seats}
					</CustomText>
				</View>
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
							<CustomText size={12} bold>
								({ride.distance.toFixed(2)} km away)
							</CustomText>
						</View>
					</View>
					<View style={[style.row, { gap: 10, justifyContent: 'space-between' }]}>
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
	
	return (
		<CustomLayout
			scrollable={false}
			contentPadding={0}
			header={
				<CustomHeader
					title="Find Rides"
					navigation={navigation}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.row, {
					gap: 10,
					marginHorizontal: 20,
					marginVertical: 10,
					width: 'auto',
					height: 'auto',
				}]}>
					<View style={[style.column, { gap: 10, height: '100%' }]}>
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
												label={to_campus ? 'Pick-Up Location' : 'Drop-Off Location'}
												value={location.name}
												onChangeText={() => null}
												onPress={() => setLocationInputFocused(true)}
											/>
										</Pressable>
									)
							)
						}
						<Controller
							control={form.control}
							render={({ field: { onChange, value } }) => (
								<View style={[style.row, { gap: 10, justifyContent: 'center' }]}>
									<Pressable
										style={{ flex: 1 }}
										onPress={() => {
											DateTimePickerAndroid.open({
												mode: 'date',
												value: value ?? new Date(),
												onChange: (event, selectedDate) => {
													if (event.type === 'set') {
														onChange(selectedDate)
													}
												},
											})
										}}
									>
										<CustomInput
											label="Date"
											value={value.toLocaleString('en-GB', {
												day: 'numeric',
												month: 'numeric',
												year: 'numeric',
											})}
											onChangeText={() => null}
											editable={false}
										/>
									</Pressable>
									<Pressable
										style={{ flex: 1 }}
										onPress={() => {
											DateTimePickerAndroid.open({
												mode: 'time',
												value: value ?? new Date(),
												onChange: (event, selectedDate) => {
													if (event.type === 'set') {
														onChange(selectedDate)
													}
												},
											})
										}}
									>
										<CustomInput
											label="Time"
											value={value.toLocaleString('en-GB', {
												hour: '2-digit',
												minute: '2-digit',
												hour12: true,
											})}
											onChangeText={() => null}
											editable={false}
										/>
									</Pressable>
								</View>
							)}
							name="date"
						/>
						<SegmentedButtons
							buttons={[
								{ value: 'datetime', label: 'Sort by Datetime' },
								{ value: 'distance', label: 'Sort by Distance' },
							]}
							onValueChange={(value) => setValue('filter', value as 'datetime' | 'distance')}
							value={filter}
							multiSelect={false}
						/>
						<SegmentedButtons
							buttons={[
								{ value: 'true', label: 'To Campus' },
								{ value: 'false', label: 'From Campus' },
							]}
							onValueChange={(value) => setValue('to_campus', value === 'true')}
							value={to_campus.toString()}
							multiSelect={false}
						/>
					</View>
				</View>
				<CustomLayout
					scrollable={true}
				>
					<View style={style.mainContent}>
						<View style={[style.column, { gap: 10 }]}>
							{
								rides.filter(ride => ride.to_campus === to_campus).sort((a, b) => filter === 'datetime' ? Math.abs(a.datetime.toDate().getTime() - date.getTime()) - Math.abs(b.datetime.toDate().getTime() - date.getTime()) : a.distance - b.distance).map(ride => (
									renderItem({ ride })
								))
							}
							{
								rides.filter(ride => ride.to_campus === to_campus).length === 0 &&
								<CustomText align="center" size={16}>
									No rides found
								</CustomText>
							}
						</View>
					</View>
				</CustomLayout>
			</View>
		</CustomLayout>
	)
}

export default FindRides
