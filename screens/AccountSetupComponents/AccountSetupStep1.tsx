import { View } from 'react-native'
import CustomLayout from '../../components/themed/CustomLayout'
import style from '../../styles/shared'
import { Avatar } from 'react-native-paper'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../components/contexts/AuthContext'
import * as ImagePicker from 'expo-image-picker'
import CustomBackgroundButton from '../../components/themed/CustomBackgroundButton'

const AccountSetupStep1 = (
	{
		form,
	}: {
		form: any
	},
) => {
	const {
		profile,
	} = useContext(AuthContext)
	const [imageUri, setImageUri] = useState<string | null>(null)
	
	const handleLibrary = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		})
		
		if (!result.canceled) {
			setImageUri(result.assets[0].uri)
		}
	}
	
	const handleCamera = async () => {
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		})
		
		if (!result.canceled) {
			setImageUri(result.assets[0].uri)
		}
	}
	
	const { setValue } = form
	
	useEffect(() => {
		if (imageUri) {
			setValue('photo_uri', imageUri)
		}
	}, [imageUri])
	
	return (
		<CustomLayout
			contentPadding={0}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20, height: '100%' }]}>
					<View style={[style.row, { justifyContent: 'center' }]}>
						<Avatar.Image
							source={
								imageUri ?
									{ uri: imageUri } :
									(props: { size: number }) => {
										return <Icon name="account-circle" size={props.size} />
									}
							}
							style={{
								backgroundColor: 'transparent',
							}}
							size={200}
						/>
					</View>
					<View style={[style.row, {
						alignItems: 'center',
						justifyContent: 'center',
						paddingVertical: 50,
						gap: 30,
					}]}>
						<CustomBackgroundButton
							icon="camera"
							onPress={handleCamera}
							size={50}
							padding={20}
							backgroundColor="white"
							borderRadius={20}
							elevation={20}
							iconColor="black"
						/>
						<CustomBackgroundButton
							icon="image"
							onPress={handleLibrary}
							size={50}
							padding={20}
							backgroundColor="white"
							borderRadius={20}
							elevation={20}
							iconColor="black"
						/>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default AccountSetupStep1
