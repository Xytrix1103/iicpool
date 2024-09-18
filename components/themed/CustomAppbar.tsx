import { Pressable, StyleSheet, View } from 'react-native'
import { Appbar } from 'react-native-paper'
import React, { useMemo } from 'react'
import CustomText from './CustomText'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'

const CustomAppbarItem = ({ icon, text, onPress, active = false }: {
	icon: string,
	text: string,
	onPress: () => void,
	active?: boolean
}) => {
	return (
		<Pressable style={style.button} onPress={onPress}>
			<Icon
				// @ts-ignore
				name={icon} size={24} color={active ? 'darkred' : 'grey'}
			/>
			<CustomText size={12} bold={true} color={active ? 'darkred' : 'grey'}>{text}</CustomText>
		</Pressable>
	)
}

const CustomAppbar = () => {
	const navigation = useNavigation()
	
	const route = useMemo(() => navigation?.getState()?.routes?.[navigation?.getState()?.index || 0]?.name, [navigation])
	console.log(route)
	
	return (
		navigation &&
		<Appbar style={style.appbar}>
			<View style={style.buttonsContainer}>
				<CustomAppbarItem
					icon="compass"
					text="Home"
					active={route === 'Home'}
					onPress={() => {
						console.log('Home')
						// @ts-ignore
						navigation.navigate('Home')
					}}
				/>
				<CustomAppbarItem
					icon="script-text"
					text="Activity"
					active={route === 'Activity'}
					onPress={() => {
						console.log('Activity')
						// @ts-ignore
						navigation.navigate('Home')
					}}
				/>
				<CustomAppbarItem
					icon="message-processing-outline"
					text="Messages"
					active={route === 'Messages'}
					onPress={() => {
						console.log('Messages')
						// @ts-ignore
						navigation.navigate('Home')
					}}
				/>
				<CustomAppbarItem
					icon="account-circle-outline"
					text="Profile"
					active={route === 'Profile'}
					onPress={() => {
						console.log('Profile')
						// @ts-ignore
						navigation.navigate('Profile')
					}}
				/>
			</View>
		</Appbar>
	)
}

const style = StyleSheet.create({
	appbar: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'white',
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

export default CustomAppbar
