import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import { Image, StyleSheet, View } from 'react-native'
import { useCallback, useContext, useEffect, useState } from 'react'
import { IconButton, useTheme } from 'react-native-paper'
import CustomText from '../components/themed/CustomText'
import { Car } from '../database/schema'
import FirebaseApp from '../components/FirebaseApp'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { AuthContext } from '../components/contexts/AuthContext'

const { db } = FirebaseApp

const properCase = (str: string): string => {
	return str.replace(/\w\S*/g, (txt) => {
		return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
	})
}

const Cars = () => {
	const navigation = useNavigation()
	const { user } = useContext(AuthContext)
	const { colors } = useTheme()
	const [isEditing, setIsEditing] = useState(false)
	const [cars, setCars] = useState<Car[]>([])
	const carsRef = query(collection(db, 'cars'), where('owner', '==', user?.uid), where('deleted_at', '==', null))
	
	const handleIconPress = useCallback(() => {
		// @ts-ignore
		navigation.navigate('ManageCar', { isEditing: isEditing })
	}, [navigation, isEditing])
	
	useEffect(() => {
		const unsubscribe = onSnapshot(carsRef, snapshot => {
			const cars: Car[] = []
			snapshot.forEach(doc => {
				cars.push(doc.data() as Car)
			})
			setCars(cars)
		})
		return () => unsubscribe()
	}, [])
	
	return (
		<CustomLayout
			scrollable={true}
			header={
				<CustomHeader
					title="My Cars"
					justifyContent="space-between"
					hasBackButton={true}
					rightNode={
						!isEditing &&
						<IconButton
							icon="plus"
							onPress={handleIconPress}
						/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.column, { gap: 20 }]}>
					{
						cars.length === 0 ?
							<CustomText>No cars found</CustomText> :
							cars.map((car, index) => (
								<View key={index} style={[style.row, { gap: 20, flex: 1 }]}>
									<View style={[style.column, {
										flex: 3,
										width: 'auto',
										justifyContent: 'center',
										alignItems: 'center',
									}]}>
										<Image
											source={{ uri: car.photo_url }}
											resizeMode="cover"
											style={{
												width: '100%',
												height: null,
												flex: 1,
												borderRadius: 10,
											}}
										/>
									</View>
									<View style={[style.column, {
										flex: 6,
										height: '100%',
										width: 'auto',
										justifyContent: 'space-between',
									}]}>
										<View style={[style.column]}>
											<View style={[style.row]}>
												<CustomText bold size={20}>{car.plate}</CustomText>
											</View>
											<View style={[style.row, { gap: 10 }]}>
												<CustomText>
													{properCase(`${car.brand} ${car.model}`)}
												</CustomText>
											</View>
										</View>
										<View style={[style.column]}>
											<CustomText size={14}>
												{`Color: ${properCase(car.color)}`}
											</CustomText>
											<CustomText size={14}>
												{`Added On: ${car.created_at.toDate().toLocaleDateString()}`}
											</CustomText>
										</View>
									</View>
									<View
										style={[style.column, {
											flex: 1,
											height: '100%',
											justifyContent: 'space-between',
											alignItems: 'center',
											width: 'auto',
										}]}>
										<IconButton
											icon="pencil-outline"
											onPress={handleIconPress}
											animated={true}
											style={{ margin: 0 }}
										/>
										<IconButton
											icon="delete-outline"
											onPress={() => console.log('Delete car')}
											iconColor={colors.error}
											animated={true}
											style={{ margin: 0 }}
										/>
									</View>
								</View>
							))
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
})

export default Cars
