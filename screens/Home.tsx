import React from 'react'
import { StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'
import { logout } from '../api/auth'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import CustomLayout from '../components/themed/CustomLayout'
import CustomFlex from '../components/themed/CustomFlex'

const Home = () => {
	const navigation = useNavigation()
	
	return (
		<CustomLayout
			hasAppBar={true}
			scrollable={true}
		>
			<CustomFlex>
				<CustomText>Home</CustomText>
				<Button onPress={() => {
					// @ts-ignore
					navigation.navigate('RideToCampus')
				}}>Ride to Campus</Button>
				<Button onPress={logout}>Logout</Button>
			</CustomFlex>
		</CustomLayout>
	)
}

const style = StyleSheet.create({
	appbar: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
		justifyContent: 'space-evenly',
	},
	button: {
		flexDirection: 'column',
		gap: 5,
		alignItems: 'center',
	},
})

export default Home
