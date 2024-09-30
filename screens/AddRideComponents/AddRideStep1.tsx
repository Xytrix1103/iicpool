import { Pressable, StyleSheet, View } from 'react-native'
import CustomInput from '../../components/themed/CustomInput'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { GooglePlaceDetail, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete'
import { CAMPUS_NAME, decodePolyline, fetchCampusLocation, getDirections } from '../../api/location'
import * as Location from 'expo-location'
import { DirectionsObject, RideFormType } from './types'
import CustomInputAutoComplete from './CustomInputAutoComplete'
import CustomLayout from '../../components/themed/CustomLayout'
import CustomIconButton from '../../components/themed/CustomIconButton'
import style from '../../styles/shared'


const AddRideStep1 = (
	{
		form,
		colors,
		toCampus,
		setToCampus,
		showMap,
		setShowMap,
		setLoadingOverlay,
		wrapPermissions,
		directions,
		setDirections,
		autocompleteRef,
	}: {
		form: UseFormReturn<RideFormType>,
		colors: MD3Colors,
		toCampus: boolean,
		setToCampus: (toCampus: boolean) => void,
		showMap: boolean,
		setShowMap: (showMap: boolean) => void,
		setLoadingOverlay: ({ show, message }: { show: boolean, message: string }) => void,
		wrapPermissions: ({ operation, type, message }: {
			operation: () => Promise<void>;
			type: 'notifications' | 'location' | 'camera';
			message: string;
		}) => Promise<void>,
		directions: DirectionsObject | null,
		setDirections: (directions: DirectionsObject | null) => void,
		autocompleteRef: MutableRefObject<GooglePlacesAutocompleteRef | null>
	}) => {
	const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
	const mapRef = useRef<MapView | null>(null)
	const { setValue, watch } = form
	
	const watchNotCampus = watch('not_campus')
	const watchCampus = watch('campus')
	
	const handleLocationSelect = (details: GooglePlaceDetail | null) => {
		if (!details) {
			return
		}
		
		setValue('not_campus', {
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
		
		setShowMap(true)
	}
	
	
	useEffect(() => {
		(async () => {
			setLoadingOverlay({
				show: true,
				message: 'Fetching location...',
			})
			
			await fetchCampusLocation({
				address: CAMPUS_NAME,
				callback: (location) => {
					setValue('campus', {
						place_id: location.place_id,
						formatted_address: CAMPUS_NAME,
						name: CAMPUS_NAME,
						geometry: {
							location: {
								lat: location.geometry.location.lat,
								lng: location.geometry.location.lng,
							},
						},
					})
				},
			})
			
			await wrapPermissions({
				operation: async () => {
					Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Highest,
					})
						.then((r) => {
							setLocation({
								latitude: r.coords.latitude,
								longitude: r.coords.longitude,
							})
						})
						.catch((error) => {
							console.error('Error fetching location:', error)
						})
				},
				type: 'location',
				message: 'Please enable location access for this app to get your current location',
			})
		})()
	}, [])
	
	useEffect(() => {
		if (watchNotCampus.place_id !== '' && watchCampus.place_id !== '') {
			getDirections(
				{
					origin: toCampus ? watchNotCampus.place_id : watchCampus.place_id,
					destination: toCampus ? watchCampus.place_id : watchNotCampus.place_id,
				},
			).then(async (r) => {
				console.log('Directions:', r)
				if (r) {
					setDirections({
						path: decodePolyline(r.routes[0].overview_polyline.points),
						bounds: r.routes[0].bounds,
					})
				} else {
					setDirections(null)
				}
			})
		} else {
			if (location.latitude !== 0 && location.longitude !== 0) {
				mapRef.current?.animateToRegion({
					latitude: location.latitude,
					longitude: location.longitude,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				}, 1000)
				
				setDirections(null)
				
				setLoadingOverlay({
					show: false,
					message: '',
				})
			}
		}
	}, [watchNotCampus, watchCampus, location])
	
	useEffect(() => {
		console.log('showMap:', showMap, 'toCampus:', toCampus)
	}, [showMap, toCampus])
	
	useEffect(() => {
		if (directions) {
			const { northeast, southwest } = directions.bounds
			
			const centerLatitude = (northeast.lat + southwest.lat) / 2
			const centerLongitude = (northeast.lng + southwest.lng) / 2
			
			const paddingFactor = 0.5 // Adjust this value to add more space around the bounds
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
	
	return (
		<CustomLayout scrollable={false} contentPadding={0}>
			<View style={style.row}>
				<View style={[style.column, { flex: showMap ? 9 : 1 }]}>
					{
						showMap ?
							<Pressable
								style={{ width: '100%' }}
								onPress={() => toCampus ? setShowMap(false) : null}
							>
								<CustomInput
									editable={false}
									onPressIn={() => setShowMap(false)}
									label={toCampus ? 'Pick-Up Location' : 'Campus'}
									value={(toCampus ? watchNotCampus : watchCampus).formatted_address}
									onChangeText={() => null}
									onPress={() => setShowMap(false)}
									rightIcon={
										(toCampus && watchNotCampus.place_id !== '') &&
										<Icon
											onPress={() => {
												setValue('not_campus', {
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
											}}
											name="close"
											size={20}
											// @ts-expect-error colors
											color={colors.text}
										/>
									}
								/>
							</Pressable> : toCampus ?
								<CustomInputAutoComplete
									colors={colors}
									autocompleteRef={autocompleteRef}
									details={watchNotCampus} toCampus={toCampus}
									handleLocationSelect={handleLocationSelect}
								/> : null
					}
					{
						showMap ?
							<Pressable
								style={{ width: '100%' }}
								onPress={() => toCampus ? null : setShowMap(false)}
							>
								<CustomInput
									editable={false}
									onPressIn={() => setShowMap(false)}
									label={toCampus ? 'Campus' : 'Drop-Off Location'}
									value={(toCampus ? watchCampus : watchNotCampus).formatted_address}
									onChangeText={() => null}
									onPress={() => setShowMap(false)}
									rightIcon={
										(!toCampus && watchNotCampus.place_id !== '') &&
										<Icon
											onPress={() => {
												setValue('not_campus', {
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
											}}
											name="close"
											size={20}
											// @ts-expect-error colors
											color={colors.text}
										/>
									}
								/>
							</Pressable> : toCampus ?
								null :
								<CustomInputAutoComplete
									colors={colors}
									autocompleteRef={autocompleteRef}
									details={watchNotCampus} toCampus={toCampus}
									handleLocationSelect={handleLocationSelect}
								/>
					}
				</View>
				{
					showMap &&
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
						<CustomIconButton
							icon="swap-vertical"
							iconColor={colors.primary}
							onPress={() => setToCampus(!toCampus)}
						/>
					</View>
				}
			</View>
			<View style={[style.row, { flex: 1 }]}>
				{
					showMap &&
					<MapView
						provider={PROVIDER_GOOGLE}
						style={[localStyle.map]}
						showsBuildings={true}
						showsUserLocation={true}
						ref={mapRef}
						initialRegion={{
							latitude: 0,
							longitude: 0,
							latitudeDelta: 0.01,
							longitudeDelta: 0.01,
						}}
						zoomEnabled={false}
						// scrollEnabled={false}
						loadingEnabled={true}
					>
						{
							(watchCampus.place_id && watchNotCampus.place_id) &&
							<>
								<Marker
									coordinate={{
										latitude: watchCampus.geometry.location.lat,
										longitude: watchCampus.geometry.location.lng,
									}}
									title={watchCampus.formatted_address}
								/>
								<Marker
									coordinate={{
										latitude: watchNotCampus.geometry.location.lat,
										longitude: watchNotCampus.geometry.location.lng,
									}}
									title={watchNotCampus.formatted_address}
								/>
							</>
						}
						{
							directions &&
							<Polyline
								coordinates={directions.path}
								strokeColor={colors.primary}
								strokeWidth={2}
							/>
						}
					</MapView>
				}
			</View>
		</CustomLayout>
	)
}

const localStyle = StyleSheet.create({
	map: {
		width: '100%',
		height: '100%',
		alignSelf: 'center',
	},
})

export default AddRideStep1
