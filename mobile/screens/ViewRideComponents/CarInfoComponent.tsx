import React from 'react'
import { Image, View } from 'react-native'
import CustomText from '../../components/themed/CustomText'
import style from '../../styles/shared'
import { Car } from '../../database/schema'

type CarInfoComponentProps = {
	car: Car | null,
	sosCar?: Car | null
};

const CarInfoComponent: React.FC<CarInfoComponentProps> = ({ car, sosCar }) => {
	return (
		<View
			style={[style.column, { backgroundColor: 'white', elevation: 5, padding: 20, borderRadius: 10, gap: 20 }]}>
			<View style={[style.column, { gap: 10 }]}>
				{
					sosCar &&
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
					<Image
						source={{ uri: car?.photo_url ?? '' }}
						style={{ width: 50, height: 50 }}
						resizeMode="cover"
					/>
					<View style={[style.column, { gap: 5, flex: 1 }]}>
						<CustomText size={16} bold numberOfLines={3}>{car?.plate}</CustomText>
						<CustomText size={14}>{car?.brand} {car?.model} ({car?.color})</CustomText>
					</View>
				</View>
			</View>
			{
				sosCar &&
				<View style={[style.column, { gap: 10 }]}>
					<View style={[style.row, { gap: 10 }]}>
						<CustomText size={16}>
							<CustomText size={16} bold color="red"> SOS</CustomText>{' '}responded to by
						</CustomText>
					</View>
					<View style={[style.row, { gap: 10 }]}>
						<Image
							source={{ uri: sosCar.photo_url ?? '' }}
							style={{ width: 50, height: 50 }}
							resizeMode="cover"
						/>
						<View style={[style.column, { gap: 5, flex: 1 }]}>
							<CustomText size={16} bold numberOfLines={3}>{sosCar?.plate}</CustomText>
							<CustomText size={14}>{sosCar?.brand} {sosCar?.model} ({sosCar?.color})</CustomText>
						</View>
					</View>
				</View>
			}
		</View>
	)
}

export default CarInfoComponent
