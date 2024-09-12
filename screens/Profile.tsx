import CustomLayout from '../components/themed/CustomLayout'
import { StyleSheet, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../components/contexts/AuthContext'
import FirebaseApp from '../components/FirebaseApp'
import { doc, updateDoc } from 'firebase/firestore'
import CustomHeading from '../components/themed/CustomHeading'
import { Avatar, IconButton } from 'react-native-paper'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomText from '../components/themed/CustomText'
import CustomTextButton from '../components/themed/CustomTextButton'
import { httpsCallable } from 'firebase/functions'
import { useNavigation } from '@react-navigation/native'

type ProfileData = {
	full_name: string
	mobile_number: string
}

type ProviderObject = {
	displayName: string
	email: string
	phoneNumber: string
	photoURL: string
	providerId: string
	uid: string
}

const { db, functions } = FirebaseApp

const Profile = () => {
	const { profile, user } = useContext(AuthContext)
	const userRef = doc(db, 'users', user?.uid || '')
	const [isEditing, setIsEditing] = useState(false)
	const [providerData, setProviderData] = useState<ProviderObject[]>([])
	const navigation = useNavigation()
	
	const form = useForm<ProfileData>({
		defaultValues: {
			full_name: profile?.full_name || '',
			mobile_number: profile?.mobile_number || '',
		},
	})
	
	const updateProfile = async (data: ProfileData) => {
		console.log(data)
		
		await updateDoc(userRef, {
			full_name: data.full_name,
			mobile_number: data.mobile_number,
		})
			.then(() => {
				console.log('Profile Updated')
			})
			.catch((error) => {
				console.error('Error updating profile: ', error)
			})
	}
	
	const {
		handleSubmit,
		formState: { errors },
		setValue,
	} = form
	
	useEffect(() => {
		setValue('full_name', profile?.full_name || '')
		setValue('mobile_number', profile?.mobile_number || '')
	}, [profile])
	
	useEffect(() => {
		(async () => {
			const res = await httpsCallable<{
				email: string
			}>(functions, 'checkEmailGoogleSignIn')({ email: user?.email || '' })
			
			console.log('checkEmailGoogleSignIn', res)
			
			if (res.data) {
				// @ts-ignore
				setProviderData(res.data.providerData as ProviderObject[])
			}
		})()
	}, [])
	
	return (
		<CustomLayout
			hasAppBar={!isEditing}
			scrollable={true}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { justifyContent: 'space-between' }]}>
						<CustomHeading>
							{isEditing ? 'Edit Profile' : 'Profile'}
						</CustomHeading>
						<IconButton icon={isEditing ? 'check' : 'pencil-outline'} onPress={() => {
							if (isEditing) {
								console.log('submitting')
							}
							setIsEditing(!isEditing)
						}} size={30} />
					</View>
					<View style={[style.row, { justifyContent: 'center' }]}>
						<Avatar.Image source={
							profile?.photo_url ? { uri: profile.photo_url } :
								user?.photoURL ? { uri: user.photoURL } :
									(props: { size: number }) => {
										return <Icon name="account-circle" size={props.size} />
									}
						} size={160} />
					</View>
					{/*<View style={style.row}>*/}
					{/*	<View style={[style.column, { gap: 10 }]}>*/}
					{/*		<CustomText size={14}>*/}
					{/*			Email*/}
					{/*		</CustomText>*/}
					{/*		<CustomInput*/}
					{/*			editable={false}*/}
					{/*			value={user?.email || ''}*/}
					{/*			onChangeText={() => null}*/}
					{/*		/>*/}
					{/*	</View>*/}
					{/*</View>*/}
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText size={14}>
								Full Name
							</CustomText>
							<Controller
								control={form.control}
								name="full_name"
								render={({ field: { onChange, value } }) => (
									<CustomInput
										hideLabelOnFocus={true}
										editable={isEditing}
										value={value}
										onChangeText={isEditing ? onChange : () => null}
										errorMessage={errors.full_name}
									/>
								)}
							/>
						</View>
					</View>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText size={14}>
								Mobile Number
							</CustomText>
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
								render={({ field: { onChange, value } }) => (
									<CustomInput
										hideLabelOnFocus={true}
										editable={isEditing}
										value={value}
										keyboardType="phone-pad"
										onChangeText={isEditing ? onChange : () => null}
										errorMessage={errors.mobile_number}
									/>
								)}
							/>
						</View>
					</View>
					{
						!isEditing &&
						<View style={[style.row, { gap: 10 }]}>
							<View style={[style.column, { gap: 10 }]}>
								<CustomText size={14}>
									Sign-in Methods
								</CustomText>
								<View
									style={[style.row, {
										justifyContent: 'space-between',
										gap: 10,
										alignItems: 'center',
									}]}
								>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										flex: 1,
										gap: 10,
									}}>
										<Icon name="email" size={30} />
										<CustomText size={16}>
											E-mail
										</CustomText>
									</View>
									{
										providerData.some((provider) => provider.providerId === 'password') ?
											<IconButton
												icon="check-circle"
												size={30}
												iconColor="green"
												onPress={() => null}
											/> :
											<CustomTextButton onPress={() => null}>
												Link
											</CustomTextButton>
									}
								</View>
								<View style={[style.row, {
									gap: 10,
									justifyContent: 'space-between',
								}]}>
									<View style={{ alignItems: 'center', gap: 10, flexDirection: 'row' }}>
										<Icon name="google" size={30} />
										<CustomText size={16}>
											Google
										</CustomText>
									</View>
									{
										providerData.some((provider) => provider.providerId === 'google.com') ?
											<IconButton
												icon="check-circle"
												size={30}
												iconColor="green"
												onPress={() => null}
											/> :
											<CustomTextButton onPress={() => null}>
												Link
											</CustomTextButton>
									}
								</View>
							</View>
						</View>
					}
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
