import { Button, ButtonProps, useTheme } from 'react-native-paper'
import React, { ReactElement, useContext } from 'react'
import { GestureResponderEvent } from 'react-native'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

const CustomOutlinedButton = (
	{
		children, onPress, textSize, paddingVertical = 5,
		...props
	}: {
		children: ReactElement | string,
		onPress: ((e: GestureResponderEvent) => void) | undefined,
		textSize?: number,
		paddingVertical?: number,
	} & ButtonProps,
) => {
	const { colors } = useTheme()
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return (
		<Button
			mode="outlined"
			onPress={onPress}
			{...props}
			labelStyle={{
				fontSize: textSize,
				color: props.disabled ? 'grey' : colors.primary,
				paddingVertical: paddingVertical,
			}}
			style={{
				flex: 1,
				borderColor: props.disabled ? 'grey' : colors.primary,
			}}
			disabled={loadingOverlay.show}
			//remove all animations when disabled
			rippleColor={props.disabled ? 'transparent' : colors.primary}
		>
			{children}
		</Button>
	)
}

export default CustomOutlinedButton
