import { View } from 'react-native'
import CustomLayout from '../../components/themed/CustomLayout'
import style from '../../styles/shared'
import CustomBackgroundButton from '../../components/themed/CustomBackgroundButton'
import CustomText from '../../components/themed/CustomText'

const PassengerHome = (
	{
		navigation,
	}: {
		navigation: any
	},
) => {
	return (
		<CustomLayout scrollable={true} contentPadding={0}>
			<View style={style.mainContent}>
				<View style={style.column}>
					<View style={[style.row, { padding: 20 }]}>
						<CustomBackgroundButton
							icon="hail"
							size={40}
							onPress={() => {
								navigation.navigate('FindRides')
							}}
							elevation={10}
							backgroundColor="white"
							padding={20}
							borderRadius={30}
						>
							<CustomText size={14} bold>Find Rides</CustomText>
						</CustomBackgroundButton>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default PassengerHome
