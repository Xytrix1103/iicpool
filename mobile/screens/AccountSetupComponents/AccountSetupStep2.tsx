import { View } from 'react-native'
import CustomLayout from '../../components/themed/CustomLayout'
import CustomText from '../../components/themed/CustomText'
import { Controller } from 'react-hook-form'
import CustomInput from '../../components/themed/CustomInput'
import style from '../../styles/shared'

const AccountSetupStep2 = (
	{
		form,
	}: {
		form: any
	},
) => {
	const {
		formState: { errors },
		control,
	} = form
	
	return (
		<CustomLayout
			contentPadding={0}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20 }]}>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText bold size={14}>
								Full Name
							</CustomText>
							<Controller
								control={control}
								name="full_name"
								render={({ field: { onChange, value } }) => (
									<CustomInput
										autoCapitalize="words"
										hideLabelOnFocus={true}
										value={value}
										onChangeText={onChange}
									/>
								)}
							/>
						</View>
					</View>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText bold size={14}>
								Mobile Number
							</CustomText>
							<Controller
								control={control}
								name="mobile_number"
								rules={{
									required: 'Mobile Number is required',
									pattern: {
										// phone number pattern but in string format
										value: /^01[0-9]{8,9}$/,
										message: 'Invalid Mobile Number',
									},
								}}
								render={({ field: { onChange, value } }) => (
									<CustomInput
										autoCapitalize="none"
										hideLabelOnFocus={true}
										value={value}
										keyboardType="phone-pad"
										onChangeText={onChange}
										errorMessage={errors.mobile_number && errors.mobile_number?.message}
									/>
								)}
							/>
						</View>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default AccountSetupStep2
