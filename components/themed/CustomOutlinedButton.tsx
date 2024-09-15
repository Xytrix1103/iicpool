import { Button, useTheme } from 'react-native-paper'
import React, { ReactElement, useContext } from 'react'
import { GestureResponderEvent } from 'react-native'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

const CustomOutlinedButton = ({ children, onPress }: {
	children: ReactElement | string,
	onPress: ((e: GestureResponderEvent) => void) | undefined
}) => {
	const { colors } = useTheme()
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
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
			}}
			disabled={loadingOverlay.show}
		>
			{children}
		</Button>
	)
}

export default CustomOutlinedButton
