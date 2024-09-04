import { View } from 'react-native'
import { IconButton } from 'react-native-paper'
import CustomHeading from './CustomHeading'

const CustomBackBtnHeader = ({ title, navigation }: { title: string, navigation: any }) => {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
			<IconButton
				icon="arrow-left"
				onPress={() => navigation.goBack()}
			/>
			<CustomHeading>
				{title}
			</CustomHeading>
		</View>
	)
}

export default CustomBackBtnHeader