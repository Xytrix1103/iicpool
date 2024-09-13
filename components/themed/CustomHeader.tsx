import { View } from 'react-native'
import { IconButton } from 'react-native-paper'
import CustomHeading from './CustomHeading'
import { ReactNode } from 'react'

const CustomHeader = ({ title, navigation, onPress, hasBackButton = true, rightNode, justifyContent }: {
	title: string,
	navigation?: any,
	onPress?: () => void
	hasBackButton?: boolean
	rightNode?: ReactNode
	justifyContent?: 'space-between' | 'center' | 'flex-start' | 'flex-end'
}) => {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent }}>
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
			{rightNode}
		</View>
	)
}

export default CustomHeader
