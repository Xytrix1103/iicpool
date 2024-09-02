import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import MapView, { LatLng, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import CustomLayout from '../components/themed/CustomLayout'
import { useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'
import { GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { Switch, TextInput, useTheme } from 'react-native-paper'
import axios from 'axios'
import { CAMPUS_NAME, decodePolyline, getDirections, GMAPS_API_KEY } from '../api/location'
import CustomText from '../components/themed/CustomText'

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

const RideToCampus = () => {
	const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
	const [toCampus, setToCampus] = useState(true)
	const [showMap, setShowMap] = useState(true)
	const [directions, setDirections] = useState<LatLng[] | null>(null)
	const { colors } = useTheme()
	
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
	
	const AutoComplete = ({ details }: { details: RideFormTypeSingle }) => {
		const autocompleteRef = useRef()
		
		return (
			<GooglePlacesAutocomplete
				//@ts-expect-error ref
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
					autoFocus: true,
					editable: true,
					value: details.formatted_address,
					//@ts-expect-error onChangeText error
					rightIcon: autocompleteRef.current?.getAddressText() ? (
						<TextInput.Icon
							icon="close"
							//@ts-expect-error onPress error
							onPress={autocompleteRef.current?.clear()}
						/>
					) : null,
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
	
	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync()
			
			if (status !== 'granted') {
				console.log('Permission to access location was denied')
				return
			}
			
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
			
			fetchCampusLocation(CAMPUS_NAME).then((r) => r)
		})()
	}, [])
	
	useEffect(() => {
		console.log('watchCampus:', watchCampus)
		console.log('watchNotCampus:', watchNotCampus)
		if (watchNotCampus.place_id !== '' && watchCampus.place_id !== '') {
			getDirections(
				{
					origin: toCampus ? watchNotCampus.place_id : watchCampus.place_id,
					destination: toCampus ? watchCampus.place_id : watchNotCampus.place_id,
				},
			).then(async (r) => {
				console.log('Directions:', r)
				if (r) {
					console.log('Directions:', r)
					console.log('Decoded:', decodePolyline(r.routes[0].overview_polyline.points))
					setDirections(decodePolyline(r.routes[0].overview_polyline.points))
				} else {
					setDirections(null)
				}
			})
		}
	}, [watchNotCampus, watchCampus])
	
	useEffect(() => {
		console.log('showMap:', showMap, 'toCampus:', toCampus)
	}, [showMap, toCampus])
	
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
							/>
						</Pressable> : toCampus ?
							<AutoComplete details={watchNotCampus} /> :
							null
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
							/>
						</Pressable> : toCampus ?
							null :
							<AutoComplete details={watchCampus} />
					
				}
			</View>
			{
				showMap &&
				<MapView
					provider={PROVIDER_GOOGLE}
					style={style.map}
					showsBuildings={true}
					showsUserLocation={true}
					region={{
						latitude: location.latitude,
						longitude: location.longitude,
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
							coordinates={directions}
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
