import React from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { Linking, StyleSheet, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { CAMPUS_NAME, decodePolyline } from '../../api/location'
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete'
import { CustomDirectionsResponse } from '../AddRideComponents/types'
import { Ride } from '../../database/schema'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import style from '../../styles/shared'
import CustomText from '../../components/themed/CustomText'

type MapViewComponentProps = {
	ride: Ride;
	directions: CustomDirectionsResponse | null;
	campusLocation: GooglePlaceDetail | null;
	colors: MD3Colors;
	mapRef: React.MutableRefObject<MapView | null>;
};

const MapViewComponent: React.FC<MapViewComponentProps> = ({ ride, directions, campusLocation, colors, mapRef }) => {
	const routeDuration = directions?.routes[0].legs?.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0) || 0
	
	return (
		<View
			style={[
				style.row,
				{
					backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 10,
				},
			]}
		>
			<View style={[style.column, { gap: 20, flex: 1 }]}>
				<View style={[style.row, { gap: 5 }]}>
					<Icon name="calendar" size={30} />
					<CustomText size={16} bold>
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
					<View style={[style.column, { gap: 10 }]}>
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
							loadingEnabled={true}
						>
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
						</MapView>
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
					</View>
				</View>
			</View>
		</View>
	)
}

const localStyle = StyleSheet.create({
	map: {
		width: '100%',
		height: 200,
		alignSelf: 'center',
	},
})

export default MapViewComponent
