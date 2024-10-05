import { Alert, View } from 'react-native'
import CustomHeading from './CustomHeading'
import { FC, ReactNode } from 'react'
import CustomIconButton from './CustomIconButton'

type CustomHeaderProps = {
	title: string,
	navigation?: any,
	onPress?: () => void,
	rightNode?: ReactNode,
	isHome?: boolean,
	confirmationMessage?: string
}

const CustomHeader: FC<CustomHeaderProps> = (
	{
		title,
		navigation,
		onPress,
		rightNode,
		isHome = false,
		confirmationMessage,
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
					((onPress || navigation) && !isHome) &&
					<CustomIconButton
						icon="arrow-left"
						onPress={() => {
							if (onPress) {
								if (confirmationMessage) {
									//show alert dialog
									Alert.alert(
										'Go Back',
										confirmationMessage,
										[
											{
												text: 'Cancel',
												style: 'cancel',
											},
											{
												text: 'OK',
												onPress: onPress,
											},
										],
										{ cancelable: false },
									)
								} else {
									onPress()
								}
							} else if (navigation) {
								if (confirmationMessage) {
									//show alert dialog
									Alert.alert(
										'Go Back',
										confirmationMessage,
										[
											{
												text: 'Cancel',
												style: 'cancel',
											},
											{
												text: 'OK',
												onPress: () => {
													navigation.goBack()
												},
											},
										],
										{ cancelable: false },
									)
								} else {
									navigation.goBack()
								}
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
