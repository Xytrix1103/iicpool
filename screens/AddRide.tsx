import React, { useContext, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
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
import { collection, doc, onSnapshot, query, runTransaction, where } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import { Car, Ride } from '../database/schema'
import { Timestamp } from '@firebase/firestore'
import style from '../styles/shared'
import CustomModal from '../components/themed/CustomModal'
import CustomHeading from '../components/themed/CustomHeading'
import CustomText from '../components/themed/CustomText'
import CustomTextButton from '../components/themed/CustomTextButton'

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
	const [cars, setCars] = useState<Car[] | null>(null)
	const carsRef = query(collection(db, 'cars'), where('owner', '==', user?.uid), where('deleted_at', '==', null))
	
	const form = useForm<RideFormType>({
		defaultValues: {
			to_campus: true,
			campus: {
				place_id: '',
				formatted_address: '',
				name: '',
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
				name: '',
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
	
	const { handleSubmit, setValue } = form
	
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
			started_at: null,
			completed_at: null,
			deleted_at: null,
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
	
	const steps = [
		{
			title: 'Step 1: Pick-Up Location',
			component: (
				<AddRideStep1
					form={form}
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
			),
		},
		{
			title: 'Step 2: Pick-Up Date & Time',
			component: (
				<AddRideStep2
					form={form}
					colors={colors}
					toCampus={toCampus}
					cars={cars ?? []}
				/>
			),
		},
	]
	
	useEffect(() => {
		const unsubscribe = onSnapshot(carsRef, snapshot => {
			const cars: Car[] = []
			
			snapshot.forEach(doc => {
				const data = doc.data() as Car
				cars.push({
					...data,
					id: doc.id,
				})
			})
			
			setCars(cars)
		})
		
		return () => unsubscribe()
	}, [])
	
	useEffect(() => {
		console.log('cars', cars)
		
		if (cars) {
			if (cars.length > 0) {
				setValue('car', cars[0].id)
			}
			setLoadingOverlay({ show: false, message: '' })
		} else {
			setLoadingOverlay({ show: true, message: 'Loading cars...' })
		}
	}, [cars])
	
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
				{
					cars && ((cars?.length || 0) > 0) ?
						steps[step - 1].component :
						<CustomModal
							visible={cars ? cars.length === 0 : false}
							style={{
								elevation: 10,
								borderWidth: 1,
								padding: 20,
								borderRadius: 40,
								backgroundColor: colors.background,
							}}
						>
							<View style={[style.column, { gap: 30, justifyContent: 'center' }]}>
								<View style={[style.row, { gap: 10 }]}>
									<View style={[style.column, { gap: 10 }]}>
										<CustomHeading size={20}>
											Register Car
										</CustomHeading>
										<CustomText size={14} numberOfLines={2}>
											Please register your car before adding a ride
										</CustomText>
									</View>
								</View>
								<View style={[style.row, { gap: 10, justifyContent: 'center' }]}>
									<CustomTextButton
										// @ts-ignore
										onPress={() => navigation.navigate('Cars')}
									>
										Continue
									</CustomTextButton>
								</View>
							</View>
						</CustomModal>
				}
			</View>
		</CustomLayout>
	)
}

export default AddRide
