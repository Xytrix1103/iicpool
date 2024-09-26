import { StyleSheet, ToastAndroid, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { useForm } from 'react-hook-form'
import React, { useContext, useEffect, useState } from 'react'
import AccountSetupStep2 from './AccountSetupComponents/AccountSetupStep2'
import CustomSolidButton from '../components/themed/CustomSolidButton'
import CustomOutlinedButton from '../components/themed/CustomOutlinedButton'
import AccountSetupStep1 from './AccountSetupComponents/AccountSetupStep1'
import CustomHeading from '../components/themed/CustomHeading'
import { ProgressBar } from 'react-native-paper'
import { doc, updateDoc } from 'firebase/firestore'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { AuthContext } from '../components/contexts/AuthContext'
import FirebaseApp from '../components/FirebaseApp'
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'

const { db, storage } = FirebaseApp

const AccountSetup = () => {
	const form = useForm({
		defaultValues: {
			photo_uri: '',
			full_name: '',
			mobile_number: '',
		},
	})
	const [step, setStep] = useState(1)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const { user } = useContext(AuthContext)
	const userRef = doc(db, 'users', user?.uid || '')
	
	const { watch, handleSubmit } = form
	const watchImage = watch('photo_uri')
	
	const onSubmit = async (data: { photo_uri: string, full_name: string, mobile_number: string }) => {
		console.log(data)
		
		setLoadingOverlay({
			show: true,
			message: 'Updating Profile',
		})
		
		const blob = await fetch(data.photo_uri).then((response) => response.blob())
		
		const newPhotoRef = storageRef(storage, `users/${user?.uid}.png`)
		
		const uploadTask = uploadBytesResumable(newPhotoRef, blob)
		
		uploadTask.on('state_changed', (snapshot) => {
			const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
			console.log(`Upload is ${progress}% done`)
		}, (error) => {
			console.error(error)
		}, async () => {
			console.log('Upload is complete')
			
			await updateDoc(userRef, {
				full_name: data.full_name,
				mobile_number: data.mobile_number,
				photo_url: await getDownloadURL(uploadTask.snapshot.ref),
			})
				.then(() => {
					console.log('Profile Updated')
					ToastAndroid.show('Profile Updated', ToastAndroid.LONG)
				})
				.catch((error) => {
					console.error('Error updating profile: ', error)
				})
				.finally(() => {
					setLoadingOverlay({ show: false, message: '' })
				})
		})
	}
	
	useEffect(() => {
		(async () => {
			await user?.reload()
		})()
	}, [])
	
	useEffect(() => {
		if (user) {
			form.reset({
				photo_uri: user.photoURL || '',
				full_name: user.displayName || '',
				mobile_number: user.phoneNumber || '',
			})
		}
	}, [user])
	
	return (
		<CustomLayout
			scrollable
			header={
				<CustomHeader
					title="Account Setup"
				/>
			}
			footer={
				(watchImage && watchImage !== '') &&
				<View style={[style.row, { gap: 10 }]}>
					{step > 1 &&
						<CustomOutlinedButton onPress={() => setStep(step - 1)}>
							Back
						</CustomOutlinedButton>
					}
					<CustomSolidButton onPress={step !== 2 ? () => setStep(step + 1) : handleSubmit(onSubmit)}>
						{step === 1 ? 'Next' : 'Submit'}
					</CustomSolidButton>
				</View>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.row, { marginBottom: 40 }]}>
					<View style={[style.column, { gap: 10 }]}>
						<CustomHeading size={18}>
							{`Step ${step} of 2: ${step === 1 ? 'Profile Picture' : 'Personal Details'}`}
						</CustomHeading>
						<ProgressBar
							progress={step === 1 ? 0.5 : 1}
							color="black"
							style={{
								height: 10,
								borderRadius: 10,
							}}
						/>
					</View>
				</View>
				{
					step === 1 &&
					<AccountSetupStep1 form={form} />
				}
				{
					step === 2 &&
					<AccountSetupStep2 form={form} />
				}
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

export default AccountSetup
