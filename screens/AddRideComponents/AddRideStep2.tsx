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
		setLoadingOverlay,
		wrapPermissions,
		directions,
	}: {
		style: any,
		form: UseFormReturn<RideFormType>
		colors: MD3Colors,
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
				<View style={style.row}>
					<CustomText size={18} color={colors.secondary}>
						Configure your ride
					</CustomText>
				</View>
				<View style={style.row}>
					<Controller
						control={form.control}
						name="departure_time"
						render={({ field: { onChange, value } }) => (
							<Pressable
								style={{ width: '100%' }}
								onPress={() => {
									console.log('onPressIn')
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
									label="Departure Time"
									editable={false}
									value={
										value?.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })
										?? new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })
									}
									onChangeText={() => null}
								/>
							</Pressable>
						)}
					/>
				</View>
			</View>
		</CustomLayout>
	)
}

export default AddRideStep2
