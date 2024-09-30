import React from 'react'
import { View } from 'react-native'
import { Avatar } from 'react-native-paper'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Profile } from '../../database/schema'

type DriverInfoComponentProps = {
	driver: Profile | null;
};

const DriverInfoComponent: React.FC<DriverInfoComponentProps> = ({ driver }) => {
	return (
		<View
			style={[style.row, { backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 10 }]}>
			<View style={[style.column, { gap: 5, flex: 1 }]}>
				<Avatar.Image
					size={50}
					source={{ uri: driver?.photo_url }}
				/>
			</View>
			<View style={[style.column, { gap: 5, flex: 3 }]}>
				<CustomText size={16}>
					<CustomText size={16} bold>{driver?.full_name}</CustomText>{' '}is driving
				</CustomText>
				<CustomText size={14}>{driver?.mobile_number}</CustomText>
			</View>
		</View>
	)
}

export default DriverInfoComponent
