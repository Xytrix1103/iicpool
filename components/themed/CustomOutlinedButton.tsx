import { Button, useTheme } from 'react-native-paper'
import React, { ReactElement } from 'react'
import { GestureResponderEvent } from 'react-native'

const CustomOutlinedButton = ({ children, onPress }: {
	children: ReactElement | string,
	onPress: ((e: GestureResponderEvent) => void) | undefined
}) => {
	const { colors } = useTheme()
	
	return (
		<Button
			mode="outlined"
			onPress={onPress}
			labelStyle={{
				paddingVertical: 5,
			}}
			style={{
				flex: 1,
				borderColor: colors.primary,
			}}>
			{children}
		</Button>
	)
}

export default CustomOutlinedButton
