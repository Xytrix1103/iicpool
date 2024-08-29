import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import CustomLayout from '../components/themed/CustomLayout'
import { Controller, useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'
import { GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { useTheme } from 'react-native-paper'

type RideFormType = {
	campus: Partial<GooglePlaceDetail>
	not_campus: Partial<GooglePlaceDetail>
}

const RideToCampus = () => {
	const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
	const [toCampus, setToCampus] = useState(true)
	const [showMap, setShowMap] = useState(true)
	const { colors } = useTheme()
	
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
		
		setValue('not_campus', details)
	}
	
	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync()
			
			if (status !== 'granted') {
				console.log('Permission to access location was denied')
				return
			}
			
			let location = await Location.getCurrentPositionAsync({})
			setLocation(location ? location.coords : { latitude: 0, longitude: 0 })
		})()
	}, [])
	
	return (
		<CustomLayout
			scrollable={!showMap}
		>
			<View style={style.row}>
				{
					toCampus ?
						<Controller
							control={control}
							name={toCampus ? 'not_campus' : 'campus'}
							render={({ field: { onChange, value } }) => (
								<CustomInput
									label="Origin"
									value={value.formatted_address || ''}
									onChangeText={onChange}
								/>
							)}
						/> : <GooglePlacesAutocomplete
							placeholder="Search"
							onPress={(_data, details = null) =>
								handleLocationSelect(details)
							}
							query={{
								key: 'AIzaSyAZJLOFhRAzXUdviZBokuuKv4pfqyEpyxs',
								language: 'en',
							}}
							fetchDetails={true}
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
				}
				{
					toCampus ?
						<Controller
							control={control}
							name={toCampus ? 'campus' : 'not_campus'}
							render={({ field: { onChange, value } }) => (
								<CustomInput
									label="Destination"
									value={value.formatted_address || ''}
									onChangeText={onChange}
								/>
							)}
						/> : <GooglePlacesAutocomplete
							placeholder="Search"
							onPress={(_data, details = null) =>
								handleLocationSelect(details)
							}
							query={{
								key: 'AIzaSyAZJLOFhRAzXUdviZBokuuKv4pfqyEpyxs',
								language: 'en',
							}}
							fetchDetails={true}
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
				}
			</View>
			<MapView
				provider={PROVIDER_GOOGLE}
				style={style.map}
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
			>
			</MapView>
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
	},
	autoCompleteContainer: {
		width: '100%',
		flex: 0,
		position: 'absolute',
		zIndex: 1,
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
