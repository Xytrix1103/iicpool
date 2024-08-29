import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import CustomLayout from '../components/themed/CustomLayout'
import { Controller, useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'
import { GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { Switch, useTheme } from 'react-native-paper'
import axios from 'axios'
import { CAMPUS_ADDRESS, CAMPUS_NAME, GMAPS_API_KEY } from '../api/location'
import CustomText from '../components/themed/CustomText'

//create type for GooglePlaceDetail that specifies only the fields we need
type RideFormType = {
	campus: {
		place_id: string
		name: string
		formatted_address: string
		geometry: {
			location: {
				lat: number
				lng: number
			}
		}
	}
	not_campus: {
		place_id: string
		name: string
		formatted_address: string
		geometry: {
			location: {
				lat: number
				lng: number
			}
		}
	}
}

const RideToCampus = () => {
	const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
	const [toCampus, setToCampus] = useState(true)
	const [showMap, setShowMap] = useState(true)
	const { colors } = useTheme()
	const autocompleteRef = useRef()
	
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
					setValue('campus', {
						place_id: response.data.results[0].place_id,
						name: response.data.results[0].name,
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
	
	const { control, setValue } = useForm<RideFormType>({
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
	
	const handleLocationSelect = (details: GooglePlaceDetail | null) => {
		if (!details) {
			return
		}
		
		setValue('not_campus', {
			place_id: details.place_id,
			name: details.name,
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
	
	const AutoComplete = () => {
		return (
			<GooglePlacesAutocomplete
				ref={autocompleteRef}
				placeholder=""
				listViewDisplayed={true}
				onPress={(_data, details = null) =>
					handleLocationSelect(details)
				}
				query={{
					key: GMAPS_API_KEY,
					language: 'en',
					components: 'country:my',
				}}
				enableHighAccuracyLocation={true}
				fetchDetails={true}
				textInputProps={{
					InputComp: CustomInput,
					label: toCampus ? 'Origin' : 'Destination',
					autoFocus: true,
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
			
			fetchCampusLocation(CAMPUS_ADDRESS).then((r) => r)
		})()
	}, [])
	
	useEffect(() => {
		console.log('showMap', showMap)
		
		if (!showMap && autocompleteRef.current) {
			console.log(autocompleteRef.current)
			// @ts-expect-error current value
			autocompleteRef.current?.focus
		}
	}, [showMap])
	
	return (
		<CustomLayout scrollable={false}>
			<View style={style.row}>
				<Switch
					value={toCampus}
					onValueChange={() => setToCampus(!toCampus)}
					color={colors.primary}
				/>
				<CustomText>{toCampus ? 'To Campus' : 'From Campus'}</CustomText>
			</View>
			<View style={style.row}>
				{
					showMap && <Controller
						control={control}
						name={toCampus ? 'not_campus' : 'campus'}
						render={({ field: { onChange, value } }) => (
							<CustomInput
								isAutofill={true}
								editable={false}
								label="Origin"
								value={toCampus ? value.formatted_address : CAMPUS_NAME}
								onChangeText={onChange}
								onPress={() => setShowMap(false)}
							/>
						)}
					/>
				}
				{
					(toCampus && !showMap) && <AutoComplete />
				}
			</View>
			<View style={style.row}>
				{
					showMap && <Controller
						control={control}
						name={toCampus ? 'campus' : 'not_campus'}
						render={({ field: { onChange, value } }) => (
							<CustomInput
								isAutofill={true}
								editable={false}
								label="Destination"
								value={toCampus ? CAMPUS_NAME : value.formatted_address}
								onChangeText={onChange}
								onPress={() => setShowMap(false)}
							/>
						)}
					/>
				}
				{
					(!toCampus && !showMap) && <AutoComplete />
				}
			</View>
			{showMap && <MapView
				provider={PROVIDER_GOOGLE}
				style={style.map}
				showsBuildings={true}
				showsUserLocation={true}
				region={{
					latitude: location.latitude,
					longitude: location.longitude,
					latitudeDelta: 0.0015,
					longitudeDelta: 0.0015,
				}}
				zoomEnabled={false}
				// scrollEnabled={false}
				loadingEnabled={true}
			/>}
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
		height: '100%',
		zIndex: -1,
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
		gap: 10,
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
