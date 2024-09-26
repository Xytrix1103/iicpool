import { Button, ButtonProps, useTheme } from 'react-native-paper'
import React, { ReactElement, useContext } from 'react'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

const CustomSolidButton = ({ children, onPress, ...props }: {
	children: ReactElement | string,
	onPress: () => void,
} & ButtonProps) => {
	const { colors } = useTheme()
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return (
		<Button
			mode="contained"
			onPress={onPress}
			buttonColor={colors.background}
			labelStyle={{
				paddingVertical: 5,
			}}
			style={{
				flex: 1,
				backgroundColor: colors.primary,
			}}
			disabled={loadingOverlay.show || props.disabled}
		>
			{children}
		</Button>
	)
}

export default CustomSolidButton
