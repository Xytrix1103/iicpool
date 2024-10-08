import CustomLayout from '../components/themed/CustomLayout'
import { useNavigation } from '@react-navigation/native'
import { Image, View } from 'react-native'
import style from '../styles/shared'
import React, { useContext, useEffect, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { CameraType } from 'expo-image-picker'
import { useForm } from 'react-hook-form'
import CustomBackgroundButton from '../components/themed/CustomBackgroundButton'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomHeader from '../components/themed/CustomHeader'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomText from '../components/themed/CustomText'
import CustomIconButton from '../components/themed/CustomIconButton'
import { arrayUnion, collection, doc, runTransaction } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'

type FormData = {
	photo_uri: string
}

const { db, storage } = FirebaseApp

const ManageLicense = () => {
	const navigation = useNavigation()
	const { profile, user } = useContext(AuthContext)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const [isEditing, setIsEditing] = useState(false)
	const userRef = doc(collection(db, 'users'), user?.uid || '')
	const form = useForm<FormData>({
		defaultValues: {
			photo_uri: profile?.driver_license || '',
		},
	})
	
	const { setValue, watch } = form
	const imageUri = watch('photo_uri')
	
	const handleLibrary = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		})
		
		if (!result.canceled) {
			setValue('photo_uri', result.assets[0].uri)
		}
	}
	
	const handleCamera = async () => {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			cameraType: CameraType.back,
			exif: true,
			allowsEditing: true,
			aspect: [17, 11],
			quality: 1,
		})
		
		if (!result.canceled) {
			setValue('photo_uri', result.assets[0].uri)
		}
	}
	
	const onSubmit = async (data: FormData) => {
		if (data.photo_uri !== profile?.driver_license) {
			setLoadingOverlay({
				show: true,
				message: 'Uploading Driver License',
			})
			
			const blob = await fetch(data.photo_uri).then((response) => response.blob())
			const newPhotoRef = storageRef(storage, `licenses/${user?.uid}.png`)
			const uploadTask = uploadBytesResumable(newPhotoRef, blob)
			
			uploadTask.on('state_changed', (snapshot) => {
				const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
				console.log(`Upload is ${progress}% done`)
			}, (error) => {
				console.error(error)
			}, async () => {
				console.log('Upload is complete')
				
				await runTransaction(db, async (transaction) => {
					const userDoc = await transaction.get(userRef)
					if (!userDoc.exists()) {
						throw 'Document does not exist!'
					}
					
					transaction.update(userRef, {
						driver_license: await getDownloadURL(uploadTask.snapshot.ref),
						roles: arrayUnion('driver'),
					})
				})
				
				console.log('Driver License Updated')
				setValue('photo_uri', await getDownloadURL(uploadTask.snapshot.ref))
				setLoadingOverlay({ show: false, message: '' })
				setIsEditing(false)
			})
		} else {
			setIsEditing(false)
		}
	}
	
	useEffect(() => {
		if (profile?.driver_license) {
			setValue('photo_uri', profile.driver_license)
		}
	}, [profile])
	
	return (
		<CustomLayout
			header={
				<CustomHeader
					title="Activate Driver"
					navigation={navigation}
					confirmationMessage={(isEditing && imageUri !== profile?.driver_license) ? 'You have unsaved changes. Are you sure you want to go back?' : undefined}
					rightNode={
						isEditing ?
							<CustomIconButton
								icon="check"
								onPress={form.handleSubmit(onSubmit)}
							/> :
							<CustomIconButton
								icon="pencil"
								onPress={() => {
									setIsEditing(true)
								}}
							/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20, height: '100%' }]}>
					<View style={[style.row, { justifyContent: 'center' }]}>
						<CustomText size={14}>
							Please upload a clear photo of your driver's license to activate your driver account.
						</CustomText>
					</View>
					<View style={[style.row, { justifyContent: 'center', alignItems: 'center' }]}>
						{
							imageUri ?
								<Image
									source={{ uri: imageUri }}
									style={{
										width: '100%',
										height: 250,
										borderRadius: 20,
									}}
									resizeMode="contain"
								/> :
								<View
									style={{
										width: '100%',
										height: 250,
										borderRadius: 20,
										backgroundColor: 'white',
										borderColor: 'black',
										borderWidth: 1,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Icon name="card-account-details" size={20} />
								</View>
						}
					</View>
					{
						isEditing &&
						<View style={[style.row, {
							alignItems: 'center',
							justifyContent: 'center',
							paddingVertical: 50,
							gap: 30,
						}]}>
							<CustomBackgroundButton
								icon="camera"
								onPress={handleCamera}
								size={30}
								padding={20}
								backgroundColor="white"
								borderRadius={20}
								elevation={20}
								iconColor="black"
							/>
							<CustomBackgroundButton
								icon="image"
								onPress={handleLibrary}
								size={30}
								padding={20}
								backgroundColor="white"
								borderRadius={20}
								elevation={20}
								iconColor="black"
							/>
						</View>
					}
				</View>
			</View>
		</CustomLayout>
	)
}

export default ManageLicense
