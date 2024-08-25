import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Appbar, Button } from 'react-native-paper'
import { logout } from '../api/auth'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomLayout from '../components/themed/CustomLayout'
import CustomFlex from '../components/themed/CustomFlex'

const CustomAppbarItem = ({ icon, text, onPress }: { icon: string, text: string, onPress: () => void }) => {
	return (
		<Pressable style={style.button} onPress={onPress}>
			<Icon
				// @ts-ignore
				name={icon} size={24} color="grey"
			/>
			<CustomText size={12} bold={true} color="grey">{text}</CustomText>
		</Pressable>
	)
}

const Home = () => {
	const navigation = useNavigation()
	
	const footer = (
		<Appbar style={style.appbar}>
			<View style={style.buttonsContainer}>
				<CustomAppbarItem
					icon="compass"
					text="Home"
					onPress={() => {
						// @ts-ignore
						navigation.navigate('Home')
					}}
				/>
				<CustomAppbarItem
					icon="script-text"
					text="Activity"
					onPress={() => {
						// @ts-ignore
						navigation.navigate('Home')
					}}
				/>
				<CustomAppbarItem
					icon="message-processing-outline"
					text="Messages"
					onPress={() => {
						// @ts-ignore
						navigation.navigate('Home')
					}}
				/>
				<CustomAppbarItem
					icon="account-circle-outline"
					text="Profile"
					onPress={() => {
						// @ts-ignore
						navigation.navigate('Profile')
					}}
				/>
			</View>
		</Appbar>
	)
	
	return (
		<CustomLayout
			footer={footer}
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
