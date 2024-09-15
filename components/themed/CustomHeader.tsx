import { View } from 'react-native'
import CustomHeading from './CustomHeading'
import { FC, ReactNode } from 'react'
import CustomIconButton from './CustomIconButton'

type CustomHeaderProps = {
	title: string,
	navigation?: any,
	onPress?: () => void
	rightNode?: ReactNode
}

const CustomHeader: FC<CustomHeaderProps> = (
	{
		title,
		navigation,
		onPress,
		rightNode,
	},
) => {
	return (
		<View style={{
			flexDirection: 'row',
			alignItems: 'center',
			width: '100%',
			justifyContent: rightNode ? 'space-between' : 'flex-start',
		}}>
			<View
				style={{
					flex: 1,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				{
					(onPress || navigation) &&
					<CustomIconButton
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
			{rightNode}
		</View>
	)
}

export default CustomHeader
