import React from 'react'
import { View } from 'react-native'
import { Avatar } from 'react-native-paper'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Profile } from '../../database/schema'

type DriverInfoComponentProps = {
	driver: Profile | null;
	sosResponder?: Profile | null;
};

const DriverInfoComponent: React.FC<DriverInfoComponentProps> = ({ driver, sosResponder }) => {
	return (
		<View
			style={[style.column, {
				backgroundColor: 'white',
				elevation: 5,
				padding: 20,
				borderRadius: 10,
				gap: 20,
				height: 'auto',
			}]}
		>
			<View style={[style.column, { gap: 10 }]}>
				{
					sosResponder &&
					<View style={[style.row, { gap: 10 }]}>
						<CustomText size={16}>
							<CustomText size={16} bold color="red">
								SOS{' '}
							</CustomText>
							triggered by
						</CustomText>
					</View>
				}
				<View style={[style.row, { gap: 10 }]}>
					<Avatar.Image
						size={50}
						source={{ uri: driver?.photo_url }}
					/>
					<View style={[style.column, { gap: 5, flex: 1, height: '100%' }]}>
						<CustomText size={16}>
							<CustomText size={16} bold>{driver?.full_name}</CustomText>
						</CustomText>
						<CustomText size={14}>{driver?.mobile_number}</CustomText>
					</View>
				</View>
			</View>
			{
				sosResponder &&
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { gap: 10 }]}>
						<CustomText size={16}>
							<CustomText size={16} bold color="red"> SOS</CustomText>{' '}responded to by
						</CustomText>
					</View>
					<View style={[style.row, { gap: 10 }]}>
						<Avatar.Image
							size={50}
							source={{ uri: sosResponder.photo_url }}
						/>
						<View style={[style.column, { gap: 5, flex: 1, height: '100%' }]}>
							<CustomText size={16}>
								<CustomText size={16} bold>{sosResponder.full_name}</CustomText>
							</CustomText>
							<CustomText size={14}>{sosResponder.mobile_number}</CustomText>
						</View>
					</View>
				</View>
			}
		</View>
	)
}

export default DriverInfoComponent
