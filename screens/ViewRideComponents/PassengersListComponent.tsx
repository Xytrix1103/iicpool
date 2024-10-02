import React, { useContext } from 'react'
import { View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Profile, Ride } from '../../database/schema'
import { Avatar } from 'react-native-paper'
import { AuthContext } from '../../components/contexts/AuthContext'
import FirebaseApp from '../../components/FirebaseApp'
import CustomIconButton from '../../components/themed/CustomIconButton'
import { handleBookRide } from '../../api/rides'

type PassengersListComponentProps = {
	ride: Ride,
	passengers: (Profile | null)[],
};

const { db } = FirebaseApp

const PassengersListComponent: React.FC<PassengersListComponentProps> = ({ ride, passengers }) => {
	const { user } = useContext(AuthContext)
	
	
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
							<CustomText
								size={14}
								bold
								color={ride.passengers?.length === ride.available_seats || passengers?.some((passenger) => passenger?.id === user?.uid) ? 'red' : 'green'}
							>
								{
									passengers?.every((passenger) => passenger?.id !== user?.uid) ?
										ride.passengers?.length === ride.available_seats
											? 'Full' :
											'Available'
										: 'Booked'
								}
							</CustomText>
						</View>
					</View>
				</View>
				<View style={[style.row, { gap: 5, justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
					{
						passengers?.map((passenger, index) => (
							passenger ?
								<View key={index} style={[style.column, { gap: 5, width: 'auto' }]}>
									<Avatar.Image
										size={50}
										source={{ uri: passenger.photo_url }}
									/>
									<CustomText size={14} align="center">
										{passenger.id === user?.uid ? 'You' : passenger.full_name}
									</CustomText>
								</View> :
								passengers.every((passenger) => passenger?.id !== user?.uid) &&
								<View key={index} style={[style.column, { gap: 5, width: 'auto' }]}>
									<CustomIconButton
										size={30}
										icon="plus-circle-outline"
										iconColor="black"
										onPress={() => handleBookRide({ ride, user })}
									/>
									<CustomText size={14} align="center">
										{''}
									</CustomText>
								</View>
						))
					}
				</View>
			</View>
		</View>
	)
}

export default PassengersListComponent
