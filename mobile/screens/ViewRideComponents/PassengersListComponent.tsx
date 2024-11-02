import React, { useContext } from 'react'
import { View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Profile, Ride } from '../../database/schema'
import { Avatar } from 'react-native-paper'
import { AuthContext } from '../../components/contexts/AuthContext'

type PassengersListComponentProps = {
	ride: Ride,
	passengers: (Profile | null)[],
	isInRide: string | null,
};

const PassengersListComponent: React.FC<PassengersListComponentProps> = ({ ride, passengers, isInRide }) => {
	const { user } = useContext(AuthContext)
	const isRideOngoing = ride.started_at && !ride.completed_at && !ride.cancelled_at
	
	return (
		<View
			style={[style.row, { backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 10 }]}
		>
			<View style={[style.column, { gap: 10, flex: 1 }]}>
				<View style={[style.row, { gap: 10 }]}>
					<View style={[style.column, { gap: 5 }]}>
						<View style={[style.row, { gap: 10 }]}>
							<Icon name="seat" size={30} />
							<CustomText size={16} bold>
								Passengers ({ride.passengers?.length}/{ride.available_seats})
							</CustomText>
							{
								(!ride.started_at && !ride.completed_at && !ride.cancelled_at) &&
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
							}
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
								</View> : null
						))
					}
				</View>
			</View>
		</View>
	)
}

export default PassengersListComponent
