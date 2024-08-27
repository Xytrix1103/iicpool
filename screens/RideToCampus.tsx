import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'

const RideToCampus = () => {
	const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
	
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
		<View style={style.container}>
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
		</View>
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
})

export default RideToCampus
