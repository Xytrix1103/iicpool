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
import { collection, doc, runTransaction } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import { Ride } from '../database/schema'
import { Timestamp } from '@firebase/firestore'

const { db } = FirebaseApp

const AddRide = () => {
	const [toCampus, setToCampus] = useState(true)
	const navigation = useNavigation()
	const { colors } = useTheme()
	const { user } = useContext(AuthContext)
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
			datetime: new Date(Date.now() + 60 * 60 * 1000),
			available_seats: 1,
		},
	})
	
	const { handleSubmit } = form
	
	const onSubmit = async (data: RideFormType) => {
		console.log('Submit', data)
		
		setLoadingOverlay({ show: true, message: 'Adding ride...' })
		
		const rideData = {
			driver: user?.uid,
			location: data.not_campus,
			to_campus: toCampus,
			available_seats: Number(data.available_seats),
			datetime: Timestamp.fromDate(data.datetime!),
			created_at: Timestamp.now(),
			car: data.car,
			passengers: [],
		} as Ride
		
		await runTransaction(db, async (transaction) => {
			const ridesRef = doc(collection(db, 'rides'))
			transaction.set(ridesRef, rideData)
		})
			.then(() => {
				console.log('Ride added successfully')
				navigation.goBack()
			})
			.catch((error) => {
				console.error('Error adding ride', error)
			})
			.finally(() => {
				setLoadingOverlay({ show: false, message: '' })
			})
	}
	
	return (
		<CustomLayout
			scrollable={false}
			header={
				<CustomHeader
					title={showMap ? 'Add Ride' : 'Back to Ride'}
					onPress={() => {
						showMap ? (step === 1 ? navigation.goBack() : setStep(step - 1)) : setShowMap(true)
					}}
				/>
			}
			footer={
				directions &&
				<View style={[style.row, { gap: 20 }]}>
					{step > 1 && (
						<CustomOutlinedButton onPress={() => setStep(step - 1)}>
							Back
						</CustomOutlinedButton>
					)}
					<CustomSolidButton onPress={() => step === 1 ? setStep(step + 1) : handleSubmit(onSubmit)()}>
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
