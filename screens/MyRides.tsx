import CustomLayout from '../components/themed/CustomLayout'
import { View } from 'react-native'
import style from '../styles/shared'
import { useContext, useEffect, useState } from 'react'
import { Ride } from '../database/schema'
import { useNavigation } from '@react-navigation/native'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { AuthContext } from '../components/contexts/AuthContext'
import CustomText from '../components/themed/CustomText'
import CustomHeader from '../components/themed/CustomHeader'
import CustomIconButton from '../components/themed/CustomIconButton'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'

const { db } = FirebaseApp

const RideComponent = ({ ride }: { ride: Ride }) => {
	return (
		<View
			style={[style.row, {
				gap: 20,
				elevation: 10,
				borderRadius: 30,
				backgroundColor: 'white',
				padding: 20,
			}]}>
			<View style={[style.column, {
				flex: 1,
				gap: 5,
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
			}]}>
				<Icon name="clock" size={24} color="grey" />
			</View>
			<View style={[style.column, { flex: 5, gap: 5 }]}>
				<View style={[style.row, { gap: 5 }]}>
					<CustomText size={14} bold numberOfLines={1}>
						{`${ride.to_campus ? 'From' : 'To'} ${ride.location?.name}`}
					</CustomText>
				</View>
				<View style={[style.row, { gap: 5 }]}>
					<CustomText size={14}>
						{ride.datetime.toDate().toLocaleString('en-GB', {
							day: 'numeric',
							month: 'numeric',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
							hour12: true,
						})}
					</CustomText>
				</View>
			</View>
			<View style={[style.column, {
				flex: 1,
				justifyContent: 'center',
				gap: 5,
				alignItems: 'center',
				height: '100%',
			}]}>
				<Icon name="car" size={20} color="black" />
				<CustomText align="center" bold>{ride.available_seats}</CustomText>
			</View>
		</View>
	)
}

const MyRides = () => {
	const [rides, setRides] = useState<Ride[]>([])
	const navigation = useNavigation()
	const { user } = useContext(AuthContext)
	
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
								<RideComponent key={ride.id} ride={ride} />
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
