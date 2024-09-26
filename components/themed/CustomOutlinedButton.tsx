import { Button, useTheme } from 'react-native-paper'
import React, { ReactElement, useContext } from 'react'
import { GestureResponderEvent } from 'react-native'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

const CustomOutlinedButton = (
	{
		children, onPress, textSize, paddingVertical = 5,
	}: {
		children: ReactElement | string,
		onPress: ((e: GestureResponderEvent) => void) | undefined,
		textSize?: number,
		paddingVertical?: number,
	}) => {
	const { colors } = useTheme()
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return (
		<Button
			mode="outlined"
			onPress={onPress}
			labelStyle={{
				fontSize: textSize,
				color: colors.primary,
				paddingVertical: paddingVertical,
			}}
			style={{
				flex: 1,
				borderColor: colors.primary,
			}}
			disabled={loadingOverlay.show}
		>
			{children}
		</Button>
	)
}

export default CustomOutlinedButton
