import { ToastAndroid, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import { Controller, useForm } from 'react-hook-form'
import { AuthContext } from '../components/contexts/AuthContext'
import React, { useContext, useEffect } from 'react'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import CustomText from '../components/themed/CustomText'
import CustomInput from '../components/themed/CustomInput'
import { linkEmailPassword } from '../api/auth'
import firebase from 'firebase/compat'
import style from '../styles/shared'
import FirebaseError = firebase.FirebaseError

// @ts-ignore
const LinkPasswordMethod = () => {
	const { user, refreshUserRecord } = useContext(AuthContext)
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
	
	const onSubmit = (data: { email: string, password: string }) => {
		console.log(data)
		
		linkEmailPassword(data.email, data.password)
			.then((userCredential) => {
				console.log('Link Email Password Success', userCredential)
				ToastAndroid.show('Email linked successfully', ToastAndroid.SHORT)
				navigation.goBack()
			})
			.catch((error: FirebaseError) => {
				if (error.code === 'auth/provider-already-linked') {
					ToastAndroid.show('Email sign-in has already been configured for this account.', ToastAndroid.SHORT)
				} else {
					ToastAndroid.show('An error occurred. Please try again later.', ToastAndroid.SHORT)
				}
			})
			.finally(() => {
				refreshUserRecord()
			})
	}
	
	return (
		<CustomLayout
			scrollable={false}
			header={
				<CustomHeader
					title="Link Email Sign-In"
					navigation={navigation}
				/>
			}
			hasAppBar={false}
			footer={
				<View style={[style.row, { gap: 20 }]}>
					<CustomOutlinedButton onPress={() => navigation.goBack()}>
						Cancel
					</CustomOutlinedButton>
					<CustomSolidButton onPress={handleSubmit(onSubmit)}>
						Confirm
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

export default LinkPasswordMethod
