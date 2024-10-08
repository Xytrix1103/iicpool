// `screens/ManageCar.tsx`
import React, { useContext, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, ToastAndroid, View } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Car } from '../database/schema'
import FirebaseApp from '../components/FirebaseApp'
import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import CustomText from '../components/themed/CustomText'
import CustomInput from '../components/themed/CustomInput'
import { Controller, useForm } from 'react-hook-form'
import * as ImagePicker from 'expo-image-picker'
import { CameraType } from 'expo-image-picker'
import CustomIconButton from '../components/themed/CustomIconButton'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { Timestamp } from '@firebase/firestore'

const { db } = FirebaseApp

type EditingCarForm = Car & { new_photo_uri?: string, id?: string }

type ManageCarRouteProp = RouteProp<{ ManageCar: { id?: string } }, 'ManageCar'>;

const ManageCar = () => {
	const navigation = useNavigation()
	const route = useRoute<ManageCarRouteProp>()
	const id: string | undefined = route.params?.id
	const { user } = useContext(AuthContext)
	const [isImageFocused, setIsImageFocused] = useState(false)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const form = useForm<EditingCarForm>({
		defaultValues: {
			id: id,
			owner: user?.uid,
			brand: '',
			model: '',
			color: '',
			plate: '',
			photo_url: undefined,
			new_photo_uri: undefined,
			deleted_at: null,
		},
	})
	
	const { control, formState: { errors }, reset, watch, handleSubmit } = form
	
	const handleLibrary = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})
		
		if (!result.canceled) {
			form.setValue('new_photo_uri', result.assets[0].uri)
		}
	}
	
	const handleCamera = async () => {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			cameraType: CameraType.back,
			exif: true,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})
		
		if (!result.canceled) {
			form.setValue('new_photo_uri', result.assets[0].uri)
		}
	}
	
	const onSubmit = async (data: EditingCarForm) => {
		console.log(data)
		
		if (!data.new_photo_uri) {
			ToastAndroid.show('Please select a photo', ToastAndroid.SHORT)
		}
		
		setLoadingOverlay({
			show: true,
			message: `${id ? 'Updating' : 'Adding'} car...`,
		})
		
		if (id) {
			const imageUpdated = data.photo_url !== data.new_photo_uri
			
			if (imageUpdated) {
				const blob = await fetch(data.new_photo_uri as string).then(res => res.blob())
				
				const storage = storageRef(FirebaseApp.storage, `cars/${data.plate}.png`)
				
				const uploadTask = uploadBytesResumable(storage, blob)
				
				uploadTask.on('state_changed',
					(snapshot) => {
						const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
						console.log('Upload is ' + progress + '% done')
						switch (snapshot.state) {
							case 'paused':
								console.log('Upload is paused')
								break
							case 'running':
								console.log('Upload is running')
								break
						}
					},
					(error) => {
						console.error('Error uploading image:', error)
					},
					async () => {
						const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
						console.log('File available at', downloadURL)
						
						await runTransaction(db, async (transaction) => {
							const carRef = doc(db, 'cars', id)
							const carSnapshot = await transaction.get(carRef)
							
							if (!carSnapshot.exists()) {
								throw 'Car does not exist'
							}
							
							transaction.update(carRef, {
								//remove the photo_url and new_photo_uri fields
								brand: data.brand,
								model: data.model,
								color: data.color,
								photo_url: downloadURL,
							})
						})
							.then(() => {
								console.log('Transaction successfully committed!')
							})
							.catch(async (error) => {
								console.error('Transaction failed: ', error)
								
								//delete the uploaded image and data
								await deleteObject(storage)
									.then(() => {
										console.log('File deleted successfully')
									})
									.catch((error) => {
										console.error('Error deleting file:', error)
									})
							})
							.finally(() => {
								setLoadingOverlay({
									show: false,
									message: '',
								})
								navigation.goBack()
							})
					},
				)
			} else {
				await runTransaction(db, async (transaction) => {
					const carRef = doc(db, 'cars', id)
					const carSnapshot = await transaction.get(carRef)
					
					if (!carSnapshot.exists()) {
						throw 'Car does not exist'
					}
					
					transaction.update(carRef, {
						brand: data.brand,
						model: data.model,
						color: data.color,
					})
				})
					.then(() => {
						console.log('Transaction successfully committed!')
					})
					.catch((error) => {
						console.error('Transaction failed: ', error)
					})
					.finally(() => {
						setLoadingOverlay({
							show: false,
							message: '',
						})
						navigation.goBack()
					})
			}
		} else {
			const blob = await fetch(data.new_photo_uri as string).then(res => res.blob())
			
			const storage = storageRef(FirebaseApp.storage, `cars/${data.plate}`)
			
			const uploadTask = uploadBytesResumable(storage, blob)
			
			uploadTask.on('state_changed',
				(snapshot) => {
					const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
					console.log('Upload is ' + progress + '% done')
					switch (snapshot.state) {
						case 'paused':
							console.log('Upload is paused')
							break
						case 'running':
							console.log('Upload is running')
							break
					}
				},
				(error) => {
					console.error('Error uploading image:', error)
				},
				async () => {
					const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
					console.log('File available at', downloadURL)
					
					await setDoc(doc(db, 'cars', data.plate), {
						owner: user?.uid,
						brand: data.brand,
						model: data.model,
						color: data.color,
						plate: data.plate,
						photo_url: downloadURL,
						deleted_at: null,
						created_at: Timestamp.now(),
					})
						.then(() => {
							console.log('Document successfully written!')
						})
						.catch((error) => {
							console.error('Error writing document: ', error)
						})
						.finally(() => {
							setLoadingOverlay({
								show: false,
								message: '',
							})
							navigation.goBack()
						})
				},
			)
		}
	}
	
	useEffect(() => {
		let unsubscribe: () => void
		
		if (id) {
			unsubscribe = onSnapshot(doc(db, 'cars', id), snapshot => {
				if (snapshot.exists()) {
					const oldCar = snapshot.data() as Car
					console.log('Old car:', oldCar)
					const car = {
						...oldCar,
						id: snapshot.id,
						new_photo_uri: oldCar.photo_url,
					} as EditingCarForm
					
					reset(car)
				}
			})
		}
		
		return () => unsubscribe?.()
	}, [id])
	
	const watchNewImage = watch('new_photo_uri')
	console.log(watchNewImage)
	
	return (
		<CustomLayout
			scrollable={true}
			contentPadding={0}
			header={
				<CustomHeader
					title={route.params?.id ? 'Edit Car' : 'Add Car'}
					navigation={navigation}
					rightNode={
						<View style={[style.row, { gap: 5, width: 'auto' }]}>
							<CustomIconButton
								icon="check"
								onPress={handleSubmit(onSubmit)}
							/>
						</View>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { justifyContent: 'center' }]}>
						<Image
							source={{ uri: watchNewImage || undefined }}
							resizeMode="cover"
							style={{
								width: null,
								height: 200,
								flex: 1,
							}}
						/>
						<Pressable
							style={{
								position: 'absolute',
								flexDirection: 'row',
								width: '100%',
								height: '100%',
								backgroundColor: (watchNewImage ? isImageFocused : true) ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
								justifyContent: 'center',
								alignItems: 'center',
							}}
							onPress={() => setIsImageFocused(!isImageFocused)}
						>
							{
								(watchNewImage ? isImageFocused : true) &&
								<>
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
								</>
							}
						</Pressable>
					</View>
					<View style={[style.column, { gap: 20, padding: 20 }]}>
						<View style={style.row}>
							<View style={[style.column, { gap: 10 }]}>
								<CustomText bold size={14}>
									Number Plate
								</CustomText>
								<Controller
									control={form.control}
									name="plate"
									rules={{
										required: 'Number Plate is required',
										pattern: {
											value: /^[A-Z0-9]{6,8}$/,
											message: 'Invalid Number Plate',
										},
									}}
									render={({ field: { onChange, value } }) => (
										<CustomInput
											autoCapitalize="characters"
											label="Please enter your car's number plate"
											hideLabelOnFocus={true}
											editable={!id}
											value={value}
											onChangeText={onChange}
											errorMessage={errors.plate && errors.plate?.message}
										/>
									)}
								/>
							</View>
						</View>
						<View style={style.row}>
							<View style={[style.column, { gap: 10 }]}>
								<CustomText bold size={14}>
									Brand
								</CustomText>
								<Controller
									control={form.control}
									name="brand"
									render={({ field: { onChange, value } }) => (
										<CustomInput
											label="Please enter your car's brand"
											autoCapitalize="words"
											hideLabelOnFocus={true}
											editable={true}
											value={value}
											onChangeText={onChange}
											errorMessage={errors.brand && errors.brand?.message}
										/>
									)}
								/>
							</View>
						</View>
						<View style={style.row}>
							<View style={[style.column, { gap: 10 }]}>
								<CustomText bold size={14}>
									Model
								</CustomText>
								<Controller
									control={form.control}
									name="model"
									render={({ field: { onChange, value } }) => (
										<CustomInput
											label="Please enter your car's model"
											autoCapitalize="words"
											hideLabelOnFocus={true}
											editable={true}
											value={value}
											onChangeText={onChange}
											errorMessage={errors.model && errors.model?.message}
										/>
									)}
								/>
							</View>
						</View>
						<View style={style.row}>
							<View style={[style.column, { gap: 10 }]}>
								<CustomText bold size={14}>
									Color
								</CustomText>
								<Controller
									control={form.control}
									name="color"
									render={({ field: { onChange, value } }) => (
										<CustomInput
											label="Please enter your car's color"
											autoCapitalize="words"
											hideLabelOnFocus={true}
											editable={true}
											value={value}
											onChangeText={onChange}
											errorMessage={errors.color && errors.color?.message}
										/>
									)}
								/>
							</View>
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

export default ManageCar
