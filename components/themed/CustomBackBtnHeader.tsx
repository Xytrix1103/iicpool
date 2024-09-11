import { View } from 'react-native'
import { IconButton } from 'react-native-paper'
import CustomHeading from './CustomHeading'

const CustomBackBtnHeader = ({ title, navigation, onPress }: {
	title: string,
	navigation?: any,
	onPress?: () => void
}) => {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
			<IconButton
				icon="arrow-left"
				onPress={() => {
					if (onPress) {
						onPress()
					} else if (navigation) {
						navigation.goBack()
					}
				}}
			/>
			<CustomHeading>
				{title}
			</CustomHeading>
		</View>
	)
}

export default CustomBackBtnHeader
