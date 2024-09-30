import React, { useContext } from 'react'
import { View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Profile, Ride } from '../../database/schema'
import { Avatar } from 'react-native-paper'
import { AuthContext } from '../../components/contexts/AuthContext'
import { arrayUnion, doc, runTransaction } from 'firebase/firestore'
import FirebaseApp from '../../components/FirebaseApp'

type PassengersListComponentProps = {
	ride: Ride,
	passengers: (Profile | null)[],
};

const { db } = FirebaseApp

const PassengersListComponent: React.FC<PassengersListComponentProps> = ({ ride, passengers }) => {
	const { user } = useContext(AuthContext)
	
	const handleBookRide = async () => {
		await runTransaction(db, async (transaction) => {
			const rideRef = doc(db, 'rides', ride?.id || '')
			
			transaction.update(rideRef, {
				passengers: arrayUnion(user?.uid),
			})
		})
	}
	
	return (
		<View
			style={[style.row, { backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 10 }]}>
			<View style={[style.column, { gap: 10, flex: 1 }]}>
				<View style={[style.row, { gap: 10 }]}>
					<View style={[style.column, { gap: 5 }]}>
						<View style={[style.row, { gap: 10 }]}>
							<Icon name="seat" size={30} />
							<CustomText size={16} bold>
								Passengers ({ride.passengers?.length}/{ride.available_seats})
							</CustomText>
						</View>
					</View>
				</View>
				<View style={[style.row, { gap: 10, justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
					{
						passengers?.map((passenger, index) => (
							passenger ?
								<View key={index} style={[style.column, { gap: 5, width: 'auto' }]}>
									<Avatar.Image
										size={60}
										source={{ uri: passenger.photo_url }}
									/>
								</View> :
								<View key={index} style={[style.column, { gap: 5, width: 'auto' }]}>
									<Icon name="circle-outline" size={60} color="grey" />
								</View>
						))
					}
				</View>
			</View>
		</View>
	)
}

export default PassengersListComponent
