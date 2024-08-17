import { Button, useTheme } from 'react-native-paper'
import React, { ReactElement } from 'react'

const SolidButton = ({ children, onPress }: { children: ReactElement | string, onPress: () => void }) => {
	const { colors } = useTheme()
	
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
			}}>
			{children}
		</Button>
	)
}

export default SolidButton
