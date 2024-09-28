import CustomLayout from '../components/themed/CustomLayout'
import { View } from 'react-native'
import style from '../styles/shared'
import { useContext, useEffect, useState } from 'react'
import { Ride } from '../database/schema'
import { useNavigation } from '@react-navigation/native'
import { collection, getCountFromServer, onSnapshot, query, where } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomText from '../components/themed/CustomText'
import CustomHeader from '../components/themed/CustomHeader'
import CustomIconButton from '../components/themed/CustomIconButton'

const { db } = FirebaseApp

const MyRides = () => {
	const [rides, setRides] = useState<Ride[]>([])
	const navigation = useNavigation()
	const { user } = useContext(AuthContext)
	const [vehicleCount, setVehicleCount] = useState<number>(0)
	const carsCountRef = query(collection(db, 'rides'), where('driver', '==', user?.uid))
	
	useEffect(() => {
		let unsubscribe: () => void
		
		(async () => {
			unsubscribe = onSnapshot(query(collection(db, 'rides'), where('driver', '==', user?.uid)), (snapshot) => {
				const ridesData: Ride[] = snapshot.docs.map(doc => ({
					...doc.data(),
					id: doc.id,
				})) as Ride[]
				setRides(ridesData)
			})
			
			getCountFromServer(carsCountRef)
				.then((snapshot) => {
					setVehicleCount(snapshot.data().count)
				})
				.catch((error) => {
					console.log('MyRides -> error', error)
				})
		})()
		
		return (
			() => {
				unsubscribe()
			}
		)
	}, [])
	
	
	return (
		<CustomLayout
			scrollable={true}
			header={
				<CustomHeader
					title="My Rides"
					navigation={navigation}
					rightNode={
						<CustomIconButton
							icon="plus"
							onPress={() => {
								// @ts-ignore
								navigation.navigate('AddRide')
							}}
						/>
					}
				/>
			}
		>
			<View style={style.mainContent}>
				<View style={style.column}>
					{
						rides.length > 0 ? (
							rides.map(ride => (
								<View key={ride.id} style={style.row}>
									<CustomText>{ride.location?.formatted_address}</CustomText>
									<CustomText>{ride.available_seats}</CustomText>
								</View>
							))
						) : (
							<View style={[style.row, { alignItems: 'center', justifyContent: 'center' }]}>
								<CustomText>No rides found</CustomText>
							</View>
						)
					}
				</View>
			</View>
		</CustomLayout>
	)
}

export default MyRides
