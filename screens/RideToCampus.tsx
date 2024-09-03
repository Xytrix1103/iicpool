import React, { RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import CustomLayout from '../components/themed/CustomLayout'
import { useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'
import {
	GooglePlaceDetail,
	GooglePlacesAutocomplete,
	GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete'
import { Switch, useTheme } from 'react-native-paper'
import axios from 'axios'
import { CAMPUS_NAME, decodePolyline, getDirections, GMAPS_API_KEY } from '../api/location'
import CustomText from '../components/themed/CustomText'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { PermissionContext } from '../components/contexts/PermissionContext'

type RideFormTypeSingle = {
	place_id: string
	formatted_address: string
	geometry: {
		location: {
			lat: number
			lng: number
		}
	}
}

//create type for GooglePlaceDetail that specifies only the fields we need
type RideFormType = {
	campus: RideFormTypeSingle
	not_campus: RideFormTypeSingle
}

type DirectionsObject = {
	path: LatLng[]
	bounds: DirectionsBounds
}

type DirectionsBounds = {
	northeast: LatLngLiteral
	southwest: LatLngLiteral
}

type LatLngLiteral = {
	lat: number
	lng: number
}

const CustomInputAutoComplete = (
	{
		autocompleteRef,
		details,
		toCampus,
		handleLocationSelect,
	}: {
		autocompleteRef: RefObject<GooglePlacesAutocompleteRef>,
		details: RideFormTypeSingle,
		toCampus: boolean,
		handleLocationSelect: (details: GooglePlaceDetail | null) => void,
	},
) => {
	const { colors } = useTheme()
	
	return (
		<GooglePlacesAutocomplete
			ref={autocompleteRef}
			placeholder=""
			listViewDisplayed={true}
			onPress={(_data, details = null) => {
				console.log('onPress autocomplete', details)
				handleLocationSelect(details)
			}}
			query={{
				key: GMAPS_API_KEY,
				language: 'en',
				components: 'country:my',
			}}
			enableHighAccuracyLocation={true}
			fetchDetails={true}
			textInputProps={{
				InputComp: CustomInput,
				label: (toCampus ? 'Origin' : 'Destination'),
				editable: true,
				value: details.formatted_address,
			}}
			styles={{
				container: style.autoCompleteContainer,
				textInput: [
					style.textInput,
					{ borderColor: colors.primary },
				],
				listView: style.listView,
				predefinedPlacesDescription: {
					color: colors.primary,
				},
			}}
		/>
	)
}

const RideToCampus = () => {
	const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
	const [toCampus, setToCampus] = useState(true)
	const [showMap, setShowMap] = useState(true)
	const [directions, setDirections] = useState<DirectionsObject | null>(null)
	const { colors } = useTheme()
	const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>(null)
	const mapRef = useRef<MapView | null>(null)
	const { loadingOverlay, setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { wrapPermissions } = useContext(PermissionContext)
	
	const fetchCampusLocation = useCallback(
		async (address: string) => {
			const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GMAPS_API_KEY}`
			
			try {
				const response = await axios.get(url, {
					headers: {
						'Content-Type': 'application/json',
					},
				})
				
				if (response) {
					console.log('Campus location:', response.data.results[0])
					
					setValue('campus', {
						place_id: response.data.results[0].place_id,
						formatted_address: address,
						geometry: {
							location: {
								lat: response.data.results[0].geometry.location.lat,
								lng: response.data.results[0].geometry.location.lng,
							},
						},
					})
				}
			} catch (error) {
				console.error('Error fetching address:', error)
			}
		},
		[],
	)
	
	const { control, setValue, watch } = useForm<RideFormType>({
		defaultValues: {
			campus: {
				place_id: '',
				formatted_address: '',
				geometry: {
					location: {
						lat: 0,
						lng: 0,
					},
				},
			},
			not_campus: {
				place_id: '',
				formatted_address: '',
				geometry: {
					location: {
						lat: 0,
						lng: 0,
					},
				},
			},
		},
	})
	
	const watchNotCampus = watch('not_campus')
	const watchCampus = watch('campus')
	
	const handleLocationSelect = (details: GooglePlaceDetail | null) => {
		if (!details) {
			return
		}
		
		setValue('not_campus', {
			place_id: details.place_id,
			formatted_address: details.formatted_address,
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
			
			await fetchCampusLocation(CAMPUS_NAME)
			
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
		<CustomLayout scrollable={false}>
			<View style={style.row}>
				<Switch
					value={toCampus}
					onValueChange={() => {
						setToCampus(!toCampus)
					}}
					color={colors.primary}
				/>
				<CustomText>{toCampus ? 'To Campus' : 'From Campus'}</CustomText>
			</View>
			<View style={style.row}>
				{
					showMap ?
						<Pressable
							style={{ width: '100%' }}
							onPress={() => toCampus ? setShowMap(false) : null}
						>
							<CustomInput
								editable={false}
								onPressIn={() => setShowMap(false)}
								label="Origin"
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
								autocompleteRef={autocompleteRef}
								details={watchNotCampus} toCampus={toCampus}
								handleLocationSelect={handleLocationSelect}
							/> : null
				}
			</View>
			<View style={style.row}>
				{
					showMap ?
						<Pressable
							style={{ width: '100%' }}
							onPress={() => toCampus ? null : setShowMap(false)}
						>
							<CustomInput
								editable={false}
								onPressIn={() => setShowMap(false)}
								label="Destination"
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
								autocompleteRef={autocompleteRef}
								details={watchNotCampus} toCampus={toCampus}
								handleLocationSelect={handleLocationSelect}
							/>
					
				}
			</View>
			{
				showMap &&
				<MapView
					provider={PROVIDER_GOOGLE}
					style={style.map}
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
						watchCampus.place_id &&
						<Marker
							coordinate={{
								latitude: watchCampus.geometry.location.lat,
								longitude: watchCampus.geometry.location.lng,
							}}
							title={watchCampus.formatted_address}
						/>
					}
					{
						watchNotCampus.place_id &&
						<Marker
							coordinate={{
								latitude: watchNotCampus.geometry.location.lat,
								longitude: watchNotCampus.geometry.location.lng,
							}}
							title={watchNotCampus.formatted_address}
						/>
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
		</CustomLayout>
	)
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	map: {
		width: '100%',
		height: '80%',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
	},
	column: {
		flexDirection: 'column',
		flexWrap: 'wrap',
		width: '100%',
	},
	autoCompleteContainer: {
		width: '100%',
		height: '100%',
	},
	textInput: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderRadius: 5,
		padding: 10,
		marginVertical: 10,
		fontSize: 16,
	},
	listView: {
		backgroundColor: '#fff',
		borderRadius: 5,
		elevation: 3,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 5,
		shadowOffset: { width: 0, height: 2 },
	},
})

export default RideToCampus
