import { ToastAndroid, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import { Controller, useForm } from 'react-hook-form'
import { AuthContext } from '../components/contexts/AuthContext'
import React, { useContext, useEffect } from 'react'
import CustomText from '../components/themed/CustomText'
import CustomInput from '../components/themed/CustomInput'
import style from '../styles/shared'
import { deleteAccount } from '../api/auth'

const DeleteAccount = () => {
	const { user } = useContext(AuthContext)
	const navigation = useNavigation()
	
	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
	})
	
	const { setValue, watch, handleSubmit } = form
	
	useEffect(() => {
		if (user) {
			setValue('email', user.email ?? '')
		}
	}, [user, setValue])
	
	const email = watch('email')
	
	const onSubmit = async (data: { email: string, password: string }) => {
		console.log(data)
		
		await deleteAccount(data.password)
			.then(() => {
				console.log('Account deleted')
				ToastAndroid.show('Account deleted successfully', ToastAndroid.SHORT)
			})
			.catch((error) => {
				console.error('Error deleting account:', error)
				ToastAndroid.show('An error occurred. Please try again later.', ToastAndroid.SHORT)
			})
	}
	
	return (
		<CustomLayout
			scrollable={false}
			header={
				<CustomHeader
					title="Delete Account"
					navigation={navigation}
				/>
			}
			hasAppBar={false}
			footer={
				<View style={[style.row, { gap: 20 }]}>
					<CustomSolidButton onPress={handleSubmit(onSubmit)}>
						Delete Account
					</CustomSolidButton>
				</View>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20 }]}>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText size={16} bold={true}>Email</CustomText>
							<CustomInput
								hideLabelOnFocus={true}
								editable={false}
								value={email}
								onChangeText={() => null}
							/>
						</View>
					</View>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText size={16}
							            bold>
								Password
							</CustomText>
							<Controller
								control={form.control}
								render={({ field: { onChange, value } }) => (
									<CustomInput
										hideLabelOnFocus={true}
										secureTextEntry={true}
										value={value}
										autoCapitalize="none"
										onChangeText={onChange}
										errorMessage={form.formState.errors.password?.message}
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
				</View>
			</View>
		</CustomLayout>
	)
}

export default DeleteAccount
