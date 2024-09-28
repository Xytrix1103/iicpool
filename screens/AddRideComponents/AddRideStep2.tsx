import CustomText from '../../components/themed/CustomText'
import CustomLayout from '../../components/themed/CustomLayout'
import { Controller, UseFormReturn } from 'react-hook-form'
import { RideFormType } from './types'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { Pressable, View } from 'react-native'
import CustomInput from '../../components/themed/CustomInput'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { RadioButton } from 'react-native-paper'
import { Car } from '../../database/schema'
import style from '../../styles/shared'

const AddRideStep2 = (
	{
		form,
		colors,
		toCampus,
		cars,
	}: {
		form: UseFormReturn<RideFormType>
		colors: MD3Colors,
		toCampus: boolean,
		cars: Car[],
	}) => {
	
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
										value={value?.toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'numeric',
											year: 'numeric',
										})}
										onChangeText={() => null}
										errorMessage={form.formState.errors.datetime && form.formState.errors.datetime.message}
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
										} else if (new Date(value).getTime() < new Date().getTime() + 1800000) {
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
										value={value?.toLocaleString('en-US', {
											timeZone: 'Asia/Kuala_Lumpur',
											hour: '2-digit',
											minute: '2-digit',
											hour12: true,
										})}
										onChangeText={() => null}
										errorMessage={form.formState.errors.datetime && form.formState.errors.datetime.message}
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
							pattern: {
								value: new RegExp(cars.map(car => car.id).join('|')),
								message: 'Please select a vehicle',
							},
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
							pattern: {
								value: /^[1-9]\d*$/,
								message: 'Number of available seats must be greater than 0',
							},
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
								errorMessage={form.formState.errors.available_seats && form.formState.errors.available_seats.message}
							/>
						)}
					/>
				</View>
			</View>
		</CustomLayout>
	)
}

export default AddRideStep2
