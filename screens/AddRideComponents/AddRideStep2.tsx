import CustomText from '../../components/themed/CustomText'
import CustomLayout from '../../components/themed/CustomLayout'
import { Controller, UseFormReturn } from 'react-hook-form'
import { DirectionsObject, RideFormType } from './types'
import { MD3Colors } from 'react-native-paper/lib/typescript/types'
import { Pressable, View } from 'react-native'
import CustomInput from '../../components/themed/CustomInput'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

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
	return (
		<CustomLayout scrollable={false} contentPadding={0}>
			<View style={[style.column, { gap: 10 }]}>
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
						name="vehicle"
						render={({ field: { onChange, value } }) => (
							<CustomInput
								label="Vehicle"
								onChangeText={onChange}
								value={value}
							/>
						)}
					/>
				</View>
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { gap: 10 }]}>
						<CustomText size={16} color={colors.secondary}>
							{`Step 3: Available Seats`}
						</CustomText>
					</View>
					<Controller
						control={form.control}
						name="available_seats"
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
