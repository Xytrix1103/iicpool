import { ActivityIndicator } from 'react-native-paper'
import { View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import style from '../styles/shared'
import CustomText from '../components/themed/CustomText'

const Loading = () => {
	return (
		<CustomLayout>
			<View style={[style.mainContent, { justifyContent: 'center' }]}>
				<View style={[style.column, { gap: 20 }]}>
					<View style={[style.row, { alignItems: 'center', justifyContent: 'center' }]}>
						<ActivityIndicator animating={true} size="large" />
						<CustomText
							size={16}
							bold
						>
							Loading...
						</CustomText>
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default Loading
