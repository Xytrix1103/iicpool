import { useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, StyleSheet, View } from 'react-native'
import { Button, useTheme } from 'react-native-paper'
import { googleLogin, login } from '../api/auth'
import CustomTextDivider from '../components/themed/CustomTextDivider'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import CustomLayout from '../components/themed/CustomLayout'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import CustomInput from '../components/themed/CustomInput'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const onSubmit = async (data: any) => {
	const { email, password } = data
	login(email, password)
}

const Login = () => {
	const { colors } = useTheme()
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	
	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
	})
	
	const navigation = useNavigation()
	
	// Reset form state when navigating to the page
	useEffect(() => {
		return navigation.addListener('focus', () => {
			reset({
				email: '',
				password: '',
			})
		})
	}, [navigation, reset])
	
	return (
		<CustomLayout
			scrollable={false}
			hasAppBar={false}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { alignItems: 'center', gap: 50 }]}>
					<View style={style.row}>
						<Image
							source={require('../assets/logo_with_text.png')}
							tintColor={colors.primary}
							style={{ width: 300, height: 120 }}
							resizeMode="contain"
						/>
					</View>
					<View style={[style.column, { gap: 10, width: '90%' }]}>
						<View style={[style.column, { gap: 10 }]}>
							<Controller
								control={control}
								render={({ field: { onChange, value } }) => (
									<CustomInput
										label="Email"
										inputMode="email"
										keyboardType="email-address"
										autoCapitalize="none"
										errorMessage={errors.email && errors.email.message}
										onChangeText={onChange}
										rightIcon={
											value ? (
												<Icon
													name="close"
													size={24}
													onPress={() => onChange('')}
												/>
											) : null
										}
									/>
								)}
								name="email"
								rules={{ required: 'Email is required' }}
							/>
							<Controller
								control={control}
								render={({ field: { onChange } }) => (
									<CustomInput
										label="Password"
										autoCapitalize="none"
										secureTextEntry
										errorMessage={errors.password && errors.password.message}
										onChangeText={onChange}
									/>
								)}
								name="password"
								rules={{ required: 'Password is required' }}
							/>
						</View>
						<View style={[style.row, { gap: 10 }]}>
							<CustomOutlinedButton
								onPress={() => {
									console.log('Register')
									// @ts-expect-error navigation route error
									navigation.navigate('Register')
								}}>
								Register
							</CustomOutlinedButton>
							<CustomSolidButton
								onPress={handleSubmit(onSubmit)}>
								Login
							</CustomSolidButton>
						</View>
						<CustomTextDivider text="OR" vmargin={12} />
						<View style={style.column}>
							<Button
								mode="elevated"
								icon="google"
								onPress={() => googleLogin(setLoadingOverlay)}
								buttonColor={colors.primary}
								labelStyle={{
									marginVertical: 10,
								}}
								style={style.googleLoginButton}>
								Login with Google
							</Button>
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
	googleLoginButton: {
		paddingVertical: 5,
		color: 'darkred',
		backgroundColor: 'white',
		borderRadius: 20,
	},
})

export default Login
