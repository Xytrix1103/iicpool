import CustomLayout from '../components/themed/CustomLayout'
import CustomHeading from '../components/themed/CustomHeading'
import { StyleSheet, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'

type ProfileData = {
	full_name: string
	mobile_number: string
}

const Profile = () => {
	const form = useForm<ProfileData>({
		defaultValues: {
			full_name: '',
			mobile_number: '',
		},
	})
	
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = form
	
	return (
		<CustomLayout
			hasAppBar={true}
			scrollable={true}
		>
			<View style={style.mainContent}>
				<View style={style.column}>
					<CustomHeading>Profile</CustomHeading>
					<View style={style.row}>
						<View style={style.column}>
							<Controller
								control={form.control}
								name="full_name"
								render={({ field: { onChange, onBlur, value } }) => (
									<CustomInput
										label="Full Name"
										value={value}
										onChangeText={onChange}
										onCustomBlur={onBlur}
										errorMessage={errors.full_name}
									/>
								)}
							/>
							<Controller
								control={form.control}
								name="mobile_number"
								rules={{
									required: 'Mobile Number is required',
									pattern: {
										value: /^01[0-9]{9,10}$/,
										message: 'Invalid Mobile Number',
									},
								}}
								render={({ field: { onChange, onBlur, value } }) => (
									<CustomInput
										label="Mobile Number"
										value={value}
										keyboardType={'phone-pad'}
										onChangeText={onChange}
										onCustomBlur={onBlur}
										errorMessage={errors.mobile_number}
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

export default Profile
