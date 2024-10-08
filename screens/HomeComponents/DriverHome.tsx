import { View } from 'react-native'
import CustomLayout from '../../components/themed/CustomLayout'
import style from '../../styles/shared'
import CustomBackgroundButton from '../../components/themed/CustomBackgroundButton'
import CustomText from '../../components/themed/CustomText'

const DriverHome = ({ navigation }: { navigation: any }) => {
	return (
		<CustomLayout scrollable={true} contentPadding={20}>
			<View style={style.mainContent}>
				<View style={style.column}>
					<View style={[style.row]}>
						<CustomBackgroundButton
							icon="car-multiple"
							size={30}
							onPress={() => {
								navigation.navigate('MyRides')
							}}
							style={{ width: '100%', flex: 1 }}
							elevation={10}
							backgroundColor="white"
							padding={20}
							borderRadius={30}
						>
							<CustomText size={16}>My Rides</CustomText>
						</CustomBackgroundButton>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default DriverHome
