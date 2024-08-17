import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import FirebaseApp from '../components/FirebaseApp'
import { collection, onSnapshot } from 'firebase/firestore'
import { Appbar, Button } from 'react-native-paper'
import { logout } from '../api/auth'
import CustomText from '../components/themed/CustomText'
import { useNavigation } from '@react-navigation/native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const Home = () => {
	const [test, setTest] = useState<any[]>([])
	const navigation = useNavigation()
	const { db } = FirebaseApp
	
	useEffect(() => {
		//display all documents in "test" collection
		const unsubscribe = onSnapshot(collection(db, 'test'), snapshot => {
			const data: any[] = []
			snapshot.forEach(doc => {
				console.log(doc.data())
				data.push(doc.data())
			})
			setTest(data)
		})
		
		return () => {
			unsubscribe()
		}
	}, [db])
	
	// @ts-ignore
	return (
		<View style={{
			width: '100%',
			height: '100%',
		}}>
			<ScrollView style={{
				padding: 20,
				width: '100%',
				height: '100%',
			}}>
				<CustomText>Home</CustomText>
				<Button onPress={() => {
					// @ts-ignore
					navigation.navigate('RideToCampus')
				}}>Ride to Campus</Button>
				<Button onPress={logout}>Logout</Button>
				{test.map((item, index) => (
					<CustomText key={index}>{item.test}</CustomText>
				))}
			</ScrollView>
			<Appbar style={{
				width: '100%',
				justifyContent: 'center',
				alignItems: 'center',
			}}>
				<View style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					width: '100%',
					justifyContent: 'space-evenly',
				}}>
					<Pressable style={{
						flexDirection: 'column',
						gap: 5,
						alignItems: 'center',
					}} onPress={() => {
						// @ts-ignore
						navigation.navigate('Home')
					}}>
						<Icon name="compass" size={24} color="darkred" />
						<CustomText size={12} bold={true} color="darkred">Home</CustomText>
					</Pressable>
					<Pressable style={{
						flexDirection: 'column',
						gap: 5,
						alignItems: 'center',
					}} onPress={() => {
						// @ts-ignore
						navigation.navigate('Home')
					}}>
						<Icon name="script-text" size={24} color="grey" />
						<CustomText size={12} bold={true} color="grey">Activity</CustomText>
					</Pressable>
					<Pressable style={{
						flexDirection: 'column',
						gap: 5,
						alignItems: 'center',
					}} onPress={() => {
						// @ts-ignore
						navigation.navigate('Home')
					}}>
						<Icon name="message-processing-outline" size={24} color="grey" />
						<CustomText size={12} bold={true} color="grey">Messages</CustomText>
					</Pressable>
					<Pressable style={{
						flexDirection: 'column',
						gap: 5,
						alignItems: 'center',
					}} onPress={() => {
						// @ts-ignore
						navigation.navigate('Profile')
					}}>
						<Icon name="account-circle-outline" size={24} color="grey" />
						<CustomText size={12} bold={true} color="grey">Account</CustomText>
					</Pressable>
				</View>
			</Appbar>
		</View>
	)
}

export default Home
