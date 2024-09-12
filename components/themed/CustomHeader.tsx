import { View } from 'react-native'
import { IconButton } from 'react-native-paper'
import CustomHeading from './CustomHeading'

const CustomHeader = ({ title, navigation, onPress, hasBackButton = true }: {
	title: string,
	navigation?: any,
	onPress?: () => void
	hasBackButton?: boolean
}) => {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
			{
				((onPress || navigation) && hasBackButton) &&
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
			}
			<CustomHeading>
				{title}
			</CustomHeading>
		</View>
	)
}

export default CustomHeader
