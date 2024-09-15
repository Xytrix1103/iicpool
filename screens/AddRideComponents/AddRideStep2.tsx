import CustomText from '../../components/themed/CustomText'
import CustomLayout from '../../components/themed/CustomLayout'
import { Controller, UseFormReturn } from 'react-hook-form'
import { DirectionsObject, RideFormType } from './types'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { Pressable, View } from 'react-native'
import CustomInput from '../../components/themed/CustomInput'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { RadioButton } from 'react-native-paper'
import { Car } from '../../database/schema'
import { useContext, useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import FirebaseApp from '../../components/FirebaseApp'
import { AuthContext } from '../../components/contexts/AuthContext'

const { db } = FirebaseApp

const AddRideStep2 = (
	{
		style,
		form,
		colors,
		toCampus,
		setLoadingOverlay,
		wrapPermissions,
		directions,
	}: {
		style: any,
		form: UseFormReturn<RideFormType>
		colors: MD3Colors,
		toCampus: boolean,
		setLoadingOverlay: ({ show, message }: { show: boolean, message: string }) => void,
		wrapPermissions: ({ operation, type, message }: {
			operation: () => Promise<void>;
			type: 'notifications' | 'location' | 'camera';
			message: string;
		}) => Promise<void>,
		directions: DirectionsObject | null,
	}) => {
	const { user } = useContext(AuthContext)
	const [cars, setCars] = useState<Car[]>([])
	const carsRef = query(collection(db, 'cars'), where('owner', '==', user?.uid), where('deleted_at', '==', null))
	
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
		
		if (cars.length > 0) {
			form.setValue('car', cars[0].id)
		}
	}, [cars])
	
	const watchCar = form.watch('car')
	console.log('watchCar', watchCar)
	
	return (
		<CustomLayout scrollable={false} contentPadding={0}>
			<View style={[style.column, { gap: 20 }]}>
				<View style={[style.column, { gap: 10 }]}>
					<View style={style.row}>
						<CustomText size={16} color={colors.secondary}>
							{`Step 2: ${toCampus ? 'Pick-Up' : 'Drop-Off'} Date & Time`}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 10 }]}>
						<Controller
							control={form.control}
							name="datetime"
							rules={{
								validate: (value) => {
									if (value) {
										if (new Date(value).getTime() < new Date().getTime()) {
											return 'Date and time cannot be in the past'
										} else if (new Date(value).getTime() < new Date().getTime() + 3600000) {
											return 'Date and time must be at least 1 hour from now'
										}
										
										return true
									} else {
										return 'Please select a date and time'
									}
								},
							}}
							render={({ field: { onChange, value } }) => (
								<Pressable
									style={{ flex: 1 }}
									onPress={() => {
										DateTimePickerAndroid.open({
											mode: 'date',
											value: value ?? new Date(),
											onChange: (event, selectedDate) => {
												if (event.type === 'set') {
													onChange(selectedDate)
												}
											},
										})
									}}
								>
									<CustomInput
										label={toCampus ? 'Pick-Up Date' : 'Drop-Off Date'}
										editable={false}
										value={
											value?.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }).split(', ')[0]
											?? new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }).split(', ')[0]
										}
										onChangeText={() => null}
									/>
								</Pressable>
							)}
						/>
						<Controller
							control={form.control}
							name="datetime"
							rules={{
								validate: (value) => {
									if (value) {
										if (new Date(value).getTime() < new Date().getTime()) {
											return 'Date and time cannot be in the past'
										} else if (new Date(value).getTime() < new Date().getTime() + 3600000) {
											return 'Date and time must be at least 1 hour from now'
										}
										
										return true
									} else {
										return 'Please select a date and time'
									}
								},
							}}
							render={({ field: { onChange, value } }) => (
								<Pressable
									style={{ flex: 1 }}
									onPress={() => {
										DateTimePickerAndroid.open({
											mode: 'time',
											is24Hour: true,
											value: value ?? new Date(),
											onChange: (event, selectedDate) => {
												if (event.type === 'set') {
													onChange(selectedDate)
												}
											},
										})
									}}
								>
									<CustomInput
										label={toCampus ? 'Pick-Up Time' : 'Drop-Off Time'}
										editable={false}
										value={
											value?.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }).split(', ')[1]
											?? new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }).split(', ')[1]
										}
										onChangeText={() => null}
									/>
								</Pressable>
							)}
						/>
					</View>
				</View>
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { gap: 10 }]}>
						<CustomText size={16} color={colors.secondary}>
							{`Step 3: Select Vehicle`}
						</CustomText>
					</View>
					<Controller
						control={form.control}
						name="car"
						rules={{
							required: 'Please select a vehicle',
							validate: (value) => {
								if (value) {
									return true
								} else {
									return 'Please select a vehicle'
								}
							},
						}}
						render={({ field: { onChange, value } }) => (
							<View style={[style.column, { alignItems: 'flex-start', width: '100%' }]}>
								{cars.map((car, index) => (
									<RadioButton.Item
										key={index}
										label={`${car.plate} - ${car.brand} ${car.model}`}
										value={car.id as string}
										color={colors.primary}
										status={value === car.id ? 'checked' : 'unchecked'}
										position="leading"
										style={{ paddingVertical: 0 }}
										onPress={() => onChange(car.id)}
									/>
								))}
							</View>
						)}
						defaultValue={cars[0]?.id as string}
					/>
				</View>
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { gap: 10 }]}>
						<CustomText size={16} color={colors.secondary}>
							{`Step 4: Available Seats`}
						</CustomText>
					</View>
					<Controller
						control={form.control}
						name="available_seats"
						rules={{
							required: 'Please enter the number of available seats',
							validate: (value) => {
								if (value) {
									if (value > 0) {
										return true
									} else {
										return 'Number of available seats must be greater than 0'
									}
								} else {
									return 'Please enter the number of available seats'
								}
							},
						}}
						render={({ field: { onChange, value } }) => (
							<CustomInput
								label="Available Seats"
								keyboardType="number-pad"
								onChangeText={onChange}
								value={value?.toString()}
							/>
						)}
					/>
				</View>
			</View>
		</CustomLayout>
	)
}

export default AddRideStep2
