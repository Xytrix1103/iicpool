import React from 'react'
import { Image, View } from 'react-native'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Car } from '../../database/schema'

type CarInfoComponentProps = {
	car: Car | null;
};

const CarInfoComponent: React.FC<CarInfoComponentProps> = ({ car }) => {
	return (
		<View
			style={[style.row, { backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 10 }]}>
			<View style={[style.column, { gap: 5, flex: 1 }]}>
				<Image
					source={{ uri: car?.photo_url ?? '' }}
					style={{ width: 50, height: 50 }}
					resizeMode="cover"
				/>
			</View>
			<View style={[style.column, { gap: 5, flex: 3 }]}>
				<CustomText size={16} bold numberOfLines={3}>{car?.plate}</CustomText>
				<CustomText size={14}>{car?.brand} {car?.model} ({car?.color})</CustomText>
			</View>
		</View>
	)
}

export default CarInfoComponent
