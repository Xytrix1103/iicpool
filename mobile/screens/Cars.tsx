import CustomLayout from '../components/themed/CustomLayout'
import CustomHeader from '../components/themed/CustomHeader'
import { useNavigation } from '@react-navigation/native'
import { Image, View } from 'react-native'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTheme } from 'react-native-paper'
import CustomText from '../components/themed/CustomText'
import { Car } from '../database/schema'
import FirebaseApp from '../components/FirebaseApp'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomIconButton from '../components/themed/CustomIconButton'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import style from '../styles/shared'
import { handleDeleteCar } from '../api/cars'

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
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	const [cars, setCars] = useState<Car[]>([])
	const carsRef = query(collection(db, 'cars'), where('owner', '==', user?.uid), where('deleted_at', '==', null))
	
	const handleIconPress = useCallback((id?: string) => {
		// @ts-ignore
		navigation.navigate('ManageCar', { id })
	}, [navigation, isEditing])
	
	useEffect(() => {
		const unsubscribe = onSnapshot(carsRef, snapshot => {
			const cars: Car[] = []
			snapshot.forEach(doc => {
				cars.push({
					...doc.data(),
					id: doc.id,
				} as Car)
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
					navigation={navigation}
					rightNode={
						!isEditing &&
						<CustomIconButton
							icon="plus"
							onPress={() => handleIconPress()}
						/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={[style.row]}>
					<View style={[style.column, { gap: 20 }]}>
						{
							cars.map((car, index) => (
								<View key={index} style={[style.row, { gap: 20, height: 'auto' }]}>
									<View style={[style.column, {
										flex: 3,
										width: 'auto',
										height: 'auto',
										justifyContent: 'center',
										alignItems: 'center',
									}]}>
										<Image
											source={{ uri: car.photo_url || undefined }}
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
										width: 'auto',
										justifyContent: 'space-between',
									}]}>
										<View style={[style.column]}>
											<View style={[style.row]}>
												<CustomText bold size={20}>{car.plate}</CustomText>
											</View>
											<View style={[style.row, { gap: 10 }]}>
												<CustomText>
													{properCase(car.brand)} {car.model}
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
											justifyContent: 'space-between',
											alignItems: 'center',
											width: 'auto',
										}]}>
										<CustomIconButton
											icon="pencil-outline"
											onPress={() => handleIconPress(car.id)}
										/>
										<CustomIconButton
											icon="delete-outline"
											onPress={() => handleDeleteCar(car.id as string, setLoadingOverlay)}
											iconColor={colors.error}
										/>
									</View>
								</View>
							))
						}
						{
							cars.length === 0 &&
							<CustomText align="center" size={16}>
								No cars yet. Add a car to get started.
							</CustomText>
						}
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default Cars
