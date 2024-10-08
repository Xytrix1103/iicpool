import React from 'react'
import { Pressable, View } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { useTheme } from 'react-native-paper'
import style from '../../styles/shared'
import { Ride, Role } from '../../database/schema'
import CustomText from '../../components/themed/CustomText'

const CurrentRide = ({ currentRide, mode, navigation }: { currentRide: Ride, mode: Role, navigation: any }) => {
	const { colors } = useTheme()
	
	return (
		<Pressable
			style={[
				style.row,
				{
					backgroundColor: 'white',
					elevation: 5,
					padding: 20,
					borderRadius: 10,
					gap: 10,
				},
			]}
			onPress={() => {
				navigation.navigate('ViewRide', { rideId: currentRide.id })
			}}
		>
			<View style={[style.column, { gap: 20, flex: 1 }]}>
				<View style={[style.row, { gap: 5, justifyContent: 'space-between' }]}>
					<CustomText
						size={14}
						bold
						width="auto"
						color={colors.primary}
					>
						Current Ride ({mode === 'driver' ? 'Driver' : 'Passenger'})
					</CustomText>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<CustomText size={12} bold
						            color={currentRide.completed_at ? 'green' : currentRide.started_at ? 'blue' : 'black'}>
							{
								currentRide.completed_at ? 'Completed' :
									currentRide.started_at ? 'Ongoing' :
										'Pending'
							}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { gap: 10 }]}>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="calendar" size={20} />
						<CustomText size={12} bold>
							{currentRide.datetime.toDate().toLocaleString('en-GB', {
								day: 'numeric',
								month: 'numeric',
								year: 'numeric',
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="clock" size={20} />
						<CustomText size={12} bold>
							{currentRide.datetime.toDate().toLocaleString('en-GB', {
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
							})}
						</CustomText>
					</View>
					<View style={[style.row, { gap: 5, width: 'auto' }]}>
						<Icon name="cash" size={20} />
						<CustomText size={12} bold>
							RM {currentRide.fare}
						</CustomText>
					</View>
				</View>
				<View style={[style.row, { gap: 5 }]}>
					<View style={[style.column, {
						flexDirection: currentRide.to_campus ? 'column' : 'column-reverse',
					}]}>
						<View style={[style.row, { gap: 5 }]}>
							<View style={[style.column, { gap: 5, width: 'auto' }]}>
								<Icon name="map-marker" size={24} />
							</View>
							<View style={[style.column, { gap: 5, flex: 1 }]}>
								<CustomText size={14} numberOfLines={2}>
									{currentRide.to_campus ? 'From' : 'To'} {currentRide.location.name} {currentRide.to_campus ? 'to campus' : 'from campus'}
								</CustomText>
							</View>
						</View>
					</View>
				</View>
			</View>
		</Pressable>
	)
}

export default CurrentRide
