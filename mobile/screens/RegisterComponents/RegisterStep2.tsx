import React from 'react'
import { View } from 'react-native'
import CustomText from '../../components/themed/CustomText'
import { Controller } from 'react-hook-form'
import CustomLayout from '../../components/themed/CustomLayout'
import CustomInput from '../../components/themed/CustomInput'

const RegisterStep2 = (
	{
		form,
		style,
	}: {
		form: any,
		style: any
	},
) => {
	const {
		control,
		formState: { errors },
		watch,
	} = form
	
	const password = watch('password')
	
	return (
		<CustomLayout scrollable={false} contentPadding={0}>
			<View style={style.column}>
				<View style={style.row}>
					<View style={[style.column, { gap: 10 }]}>
						<CustomText size={16}>Enter your password</CustomText>
						<Controller
							control={control}
							render={({ field: { onChange, value } }) => (
								<CustomInput
									label="Please enter your password"
									hideLabelOnFocus={true}
									onChangeText={onChange}
									value={value}
									errorMessage={errors.password && errors.password.message}
									autoCapitalize="none"
									secureTextEntry
								/>
							)}
							name="password"
							rules={{
								required: 'Password is required',
								minLength: {
									value: 8,
									message: 'Password must be at least 8 characters',
								},
								pattern: {
									value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
									message: 'Password must contain both letters and numbers, and be at least 8 characters',
								},
							}}
						/>
					</View>
				</View>
				<View style={style.row}>
					<View style={[style.column, { gap: 10 }]}>
						<CustomText size={16}>Confirm your password</CustomText>
						<Controller
							control={control}
							render={({ field: { onChange, value } }) => (
								<CustomInput
									label="Please confirm your password"
									hideLabelOnFocus={true}
									onChangeText={onChange}
									value={value}
									errorMessage={errors.password_confirmation && errors.password_confirmation.message}
									autoCapitalize="none"
									secureTextEntry
								/>
							)}
							name="password_confirmation"
							rules={{
								required: 'Confirm Password is required',
								validate: value => value === password || 'Passwords do not match.',
							}}
						/>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default RegisterStep2
