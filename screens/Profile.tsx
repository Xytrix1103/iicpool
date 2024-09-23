import CustomLayout from '../components/themed/CustomLayout'
import { Alert, Pressable, StyleSheet, ToastAndroid, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import CustomInput from '../components/themed/CustomInput'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../components/contexts/AuthContext'
import FirebaseApp from '../components/FirebaseApp'
import { doc, updateDoc } from 'firebase/firestore'
import { Avatar } from 'react-native-paper'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import CustomHeader from '../components/themed/CustomHeader'
import { linkGoogle, unlinkEmailPassword, unlinkGoogle } from '../api/auth'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import * as ImagePicker from 'expo-image-picker'
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'

type ProfileData = {
	full_name: string
	mobile_number: string
	photo_uri: string
}

const { db } = FirebaseApp

const Profile = () => {
	const { profile, user, userRecord, refreshUserRecord } = useContext(AuthContext)
	const userRef = doc(db, 'users', user?.uid || '')
	const [isEditing, setIsEditing] = useState(false)
	const [isEditingImage, setIsEditingImage] = useState(false)
	const navigation = useNavigation()
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	
	const linkedPassword = userRecord?.providerData.some((provider) => provider.providerId === 'password')
	const linkedGoogle = userRecord?.providerData.some((provider) => provider.providerId === 'google.com')
	
	const form = useForm<ProfileData>({
		defaultValues: {
			photo_uri: '',
			full_name: '',
			mobile_number: '',
		},
	})
	
	const updateProfile = async (data: ProfileData) => {
		console.log(data)
		
		setLoadingOverlay({
			show: true,
			message: 'Updating Profile',
		})
		
		const blob = await (await fetch(data.photo_uri)).blob()
		
		const newStorageRef = storageRef(FirebaseApp.storage, `users/${user?.uid}.png`)
		
		const uploadTask = uploadBytesResumable(newStorageRef, blob)
		
		uploadTask.on('state_changed',
			(snapshot) => {
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
				console.log('Upload is ' + progress + '% done')
			},
			(error) => {
				console.error('Error uploading image: ', error)
			},
			async () => {
				await getDownloadURL(uploadTask.snapshot.ref)
					.then(async (downloadURL) => {
						console.log('File available at', downloadURL)
						
						await updateDoc(userRef, {
							full_name: data.full_name,
							mobile_number: data.mobile_number,
							photo_url: downloadURL,
						})
							.then(() => {
								console.log('Profile Updated')
								Alert.alert('Profile Updated', 'Your profile has been updated successfully.')
								setIsEditing(false)
							})
							.catch((error) => {
								console.error('Error updating profile: ', error)
							})
							.finally(() => {
								refreshUserRecord()
								setLoadingOverlay({ show: false, message: '' })
							})
					})
					.catch((error) => {
						console.error('Error getting download URL: ', error)
					})
			},
		)
	}
	
	const {
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
		reset,
	} = form
	
	useEffect(() => {
		setValue('photo_uri', profile?.photo_url || '')
		setValue('full_name', profile?.full_name || '')
		setValue('mobile_number', profile?.mobile_number || '')
	}, [profile])
	
	const watchPhotoUri = watch('photo_uri')
	
	const handleLibrary = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})
		
		if (!result.canceled) {
			form.setValue('photo_uri', result.assets[0].uri)
		}
	}
	
	const handleCamera = async () => {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})
		
		if (!result.canceled) {
			form.setValue('photo_uri', result.assets[0].uri)
		}
	}
	
	useEffect(() => {
		if (!isEditing) {
			reset({
				full_name: profile?.full_name || '',
				mobile_number: profile?.mobile_number || '',
				photo_uri: profile?.photo_url || '',
			})
		}
	}, [isEditing])
	
	return (
		<CustomLayout
			hasAppBar={!isEditing}
			scrollable={true}
			header={
				<CustomHeader
					title={isEditing ? 'Edit Profile' : 'Profile'}
					onPress={isEditing ? () => setIsEditing(false) : undefined}
					rightNode={
						<View style={[style.row, {
							gap: 5,
							width: 'auto',
							justifyContent: 'flex-end',
							alignItems: 'center',
						}]}>
							{
								!isEditing &&
								<CustomIconButton
									icon="car"
									onPress={() => {
										//@ts-ignore
										navigation.navigate('Cars')
									}}
								/>
							}
							<CustomIconButton
								icon={isEditing ? 'check' : 'pencil-outline'}
								onPress={
									isEditing ?
										handleSubmit(updateProfile) : () => setIsEditing(!isEditing)
								}
							/>
						</View>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20 }]}>
					<View style={[style.row, { justifyContent: 'center' }]}>
						<Pressable
							onPress={() => {
								isEditing ? setIsEditingImage(!isEditingImage) : null
							}}
						>
							<Avatar.Image
								source={
									watchPhotoUri ?
										{ uri: watchPhotoUri } :
										(props: { size: number }) => {
											return <Icon name="account-circle" size={props.size} />
										}
								}
								style={{
									backgroundColor: 'transparent',
								}}
								size={200}
							/>
							{(isEditingImage && isEditing) && (
								<View style={style.overlay}>
									<CustomIconButton
										icon="camera"
										onPress={handleCamera}
										iconColor="white"
									/>
									<CustomIconButton
										icon="image"
										onPress={handleLibrary}
										iconColor="white"
									/>
								</View>
							)}
						</Pressable>
					</View>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText bold size={14}>
								Email
							</CustomText>
							<CustomInput
								autoCapitalize="none"
								editable={false}
								value={user?.email || ''}
								onChangeText={() => null}
							/>
						</View>
					</View>
					<View style={style.row}>
						<View style={[style.column, { gap: 10 }]}>
							<CustomText bold size={14}>
								Full Name
							</CustomText>
							<Controller
								control={form.control}
								name="full_name"
								render={({ field: { onChange, value } }) => (
									<CustomInput
										autoCapitalize="words"
										hideLabelOnFocus={true}
										editable={isEditing}
										value={value}
										onChangeText={isEditing ? onChange : () => null}
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
								control={form.control}
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
										editable={isEditing}
										value={value}
										keyboardType="phone-pad"
										onChangeText={isEditing ? onChange : () => null}
										errorMessage={errors.mobile_number && errors.mobile_number?.message}
									/>
								)}
							/>
						</View>
					</View>
					{
						!isEditing &&
						<View style={[style.row, { gap: 10 }]}>
							<View style={[style.column, { gap: 10 }]}>
								<CustomText bold size={14}>
									Sign-in Methods
								</CustomText>
								<View
									style={[style.row, {
										gap: 10,
										justifyContent: 'space-between',
									}]}
								>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 10,
									}}>
										<Icon name="email" size={30} />
										<CustomText size={16}>
											E-mail
										</CustomText>
									</View>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: 10,
										}}
									>
										<CustomText size={14} color={linkedPassword ? 'green' : 'grey'}>
											{linkedPassword ? 'Linked' : 'Not Linked'}
										</CustomText>
										<CustomIconButton
											icon={linkedPassword ? 'link' : 'link-off'}
											containerColor={linkedPassword ? 'green' : 'grey'}
											iconColor="white"
											onPress={() => {
												if (!linkedPassword) {
													//@ts-ignore
													navigation.navigate('UpdatePassword', { type: 'link' })
												} else {
													if ((userRecord?.providerData.length ?? 0) > 1) {
														Alert.alert(
															'Unlink Email Sign-In',
															'Are you sure you want to unlink your email sign-in?',
															[
																{
																	text: 'Cancel',
																	style: 'cancel',
																},
																{
																	text: 'Unlink',
																	onPress: () => {
																		setLoadingOverlay({
																			show: true,
																			message: 'Unlinking Email...',
																		})
																		
																		unlinkEmailPassword()
																			.then(() => {
																				ToastAndroid.show('Email unlinked successfully', ToastAndroid.SHORT)
																			})
																			.catch((error) => {
																				console.error('Error unlinking email: ', error)
																				ToastAndroid.show('An error occurred. Please try again later.', ToastAndroid.SHORT)
																			})
																			.finally(() => {
																				refreshUserRecord()
																				setLoadingOverlay({
																					show: false,
																					message: '',
																				})
																			})
																	},
																},
															],
															{ cancelable: true },
														)
													} else {
														ToastAndroid.show('You must have at least one sign-in method.', ToastAndroid.SHORT)
													}
												}
											}}
										/>
									</View>
								</View>
								<View
									style={[style.row, {
										gap: 10,
										justifyContent: 'space-between',
									}]}
								>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 10,
									}}>
										<Icon name="google" size={30} />
										<CustomText size={16}>
											Google
										</CustomText>
									</View>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: 10,
										}}
									>
										<CustomText size={14} color={linkedGoogle ? 'green' : 'grey'}>
											{linkedGoogle ? 'Linked' : 'Not Linked'}
										</CustomText>
										<CustomIconButton
											icon={linkedGoogle ? 'link' : 'link-off'}
											containerColor={linkedGoogle ? 'green' : 'grey'}
											iconColor="white"
											//@ts-ignore
											onPress={() => {
												setLoadingOverlay({
													show: true,
													message: 'Linking Google...',
												})
												
												if (!linkedGoogle) {
													linkGoogle()
														.then(() => {
															ToastAndroid.show('Google linked successfully', ToastAndroid.SHORT)
														})
														.catch((error) => {
															console.error('Error linking Google: ', error)
															ToastAndroid.show('An error occurred. Please try again later.', ToastAndroid.SHORT)
														})
														.finally(() => {
															refreshUserRecord()
															setLoadingOverlay({
																show: false,
																message: '',
															})
														})
												} else {
													if ((userRecord?.providerData.length ?? 0) > 1) {
														Alert.alert(
															'Unlink Google Sign-In',
															'Are you sure you want to unlink your Google sign-in?',
															[
																{
																	text: 'Cancel',
																	style: 'cancel',
																},
																{
																	text: 'Unlink',
																	onPress: () => {
																		unlinkGoogle()
																			.then(() => {
																				ToastAndroid.show('Google unlinked successfully', ToastAndroid.SHORT)
																			})
																			.catch((error) => {
																				console.error('Error unlinking Google: ', error)
																				ToastAndroid.show('An error occurred. Please try again later.', ToastAndroid.SHORT)
																			})
																			.finally(() => {
																				refreshUserRecord()
																				setLoadingOverlay({
																					show: false,
																					message: '',
																				})
																			})
																	},
																},
															],
															{ cancelable: true },
														)
													} else {
														ToastAndroid.show('You must have at least one sign-in method.', ToastAndroid.SHORT)
													}
												}
												
												setLoadingOverlay({
													show: false,
													message: '',
												})
											}}
										/>
									</View>
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
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		gap: 10,
		borderRadius: 100,
	},
})

export default Profile
