import CustomLayout from '../components/themed/CustomLayout'
import CustomFlex from '../components/themed/CustomFlex'
import CustomText from '../components/themed/CustomText'
import { Button } from 'react-native-paper'
import { logout } from '../api/auth'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

const Profile = () => {
	const navigation = useNavigation()
	
	return (
		<CustomLayout
			hasAppBar={true}
			scrollable={true}
		>
			<CustomFlex>
				<CustomText>Profile</CustomText>
				<Button onPress={() => {
					// @ts-ignore
					navigation.navigate('RideToCampus')
				}}>Ride to Campus</Button>
				<Button onPress={logout}>Logout</Button>
			</CustomFlex>
		</CustomLayout>
	)
}

export default Profile
