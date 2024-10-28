import { View } from 'react-native'
import CustomText from '../../components/themed/CustomText'
import { Controller } from 'react-hook-form'
import React from 'react'
import CustomLayout from '../../components/themed/CustomLayout'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomInput from '../../components/themed/CustomInput'

const RegisterStep1 = (
	{
		form,
		style,
	}: {
		form: any,
		style: any,
	},
) => {
	const {
		control,
		formState: { errors },
		watch,
	} = form
	
	const email = watch('email')
	
	return (
		<CustomLayout scrollable={false} contentPadding={0}>
			<View style={style.row}>
				<View style={[style.column, { gap: 10 }]}>
					<CustomText size={16}>Enter your email to get started</CustomText>
					<Controller
						control={control}
						render={({ field: { onChange, value } }) => (
							<CustomInput
								label="Please enter your INTI email"
								hideLabelOnFocus={true}
								onChangeText={onChange}
								value={value}
								errorMessage={errors.email && errors.email.message}
								autoCapitalize="none"
								inputMode="email"
								rightIcon={
									email?.length > 0 ?
										email.match(/newinti.edu.my$/) ?
											<Icon
												name="check"
												color="green"
												size={24}
											/> :
											<Icon name="close" onPress={() => onChange('')} size={24} />
										: null
								}
							/>
						)}
						name="email"
						rules={{
							required: 'Email is required',
							pattern: {
								value: /newinti.edu.my$/,
								message: 'Please enter your INTI email address',
							},
						}}
					/>
				</View>
			</View>
		</CustomLayout>
	)
}

export default RegisterStep1
