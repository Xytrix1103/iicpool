import React, { useContext, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import { useTheme } from 'react-native-paper'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { PermissionContext } from '../components/contexts/PermissionContext'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import AddRideStep1 from './AddRideComponents/AddRideStep1'
import { useForm } from 'react-hook-form'
import { DirectionsObject, RideFormType } from './AddRideComponents/types'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import { GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete'
import AddRideStep2 from './AddRideComponents/AddRideStep2'

const AddRide = () => {
	const [toCampus, setToCampus] = useState(true)
	const navigation = useNavigation()
	const { colors } = useTheme()
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { wrapPermissions } = useContext(PermissionContext)
	const autocompleteRef = useRef<GooglePlacesAutocompleteRef | null>(null)
	const [step, setStep] = useState(1)
	const [showMap, setShowMap] = useState(true)
	const [directions, setDirections] = useState<DirectionsObject | null>(null)
	
	const form = useForm<RideFormType>({
		defaultValues: {
			to_campus: true,
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
			datetime: undefined,
			available_seats: undefined,
		},
	})
	
	return (
		<CustomLayout
			scrollable={false}
			headerPaddingHorizontal={0}
			header={
				showMap ? <CustomHeader
					title="Add Ride"
					onPress={() => {
						step === 1 ? navigation.goBack() : setStep(step - 1)
					}}
				/> : <CustomHeader
					title="Back to Ride"
					onPress={() => setShowMap(true)}
				/>
			}
			footer={
				<View style={[style.row, { gap: 20 }]}>
					{step > 1 && (
						<CustomOutlinedButton onPress={() => setStep(step - 1)}>
							Back
						</CustomOutlinedButton>
					)}
					<CustomSolidButton onPress={() => setStep(step + 1)}>
						{step === 1 ? 'Next' : 'Submit'}
					</CustomSolidButton>
				</View>
			}
		>
			<View style={style.mainContent}>
				{step === 1 && (
					<AddRideStep1
						form={form}
						style={style}
						toCampus={toCampus}
						setToCampus={setToCampus}
						setLoadingOverlay={setLoadingOverlay}
						wrapPermissions={wrapPermissions}
						colors={colors}
						directions={directions}
						setDirections={setDirections}
						showMap={showMap}
						setShowMap={setShowMap}
						autocompleteRef={autocompleteRef}
					/>
				)}
				{step === 2 && (
					<AddRideStep2
						form={form}
						style={style}
						colors={colors}
						toCampus={toCampus}
						setLoadingOverlay={setLoadingOverlay}
						wrapPermissions={wrapPermissions}
						directions={directions}
					/>
				)}
			</View>
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
		alignSelf: 'center',
	},
	row: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
	},
	column: {
		flexDirection: 'column',
		width: '100%',
	},
	mainContent: {
		flex: 1,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default AddRide
