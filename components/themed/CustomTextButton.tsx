import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { useTheme } from 'react-native-paper'
import CustomText from './CustomText'
import { useContext } from 'react'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

type CustomTextButtonProps = {
	onPress: () => void
	children: string
	size?: number
} & TouchableOpacityProps

const CustomTextButton = ({ children, onPress, size = 16, ...props }: CustomTextButtonProps) => {
	const { colors } = useTheme()
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return (
		<TouchableOpacity
			{...props}
			style={[
				styles.button,
			]}
			onPress={onPress}
			disabled={loadingOverlay.show || props.disabled}
		>
			<CustomText size={size} bold color={colors.primary}>
				{children}
			</CustomText>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	button: {
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default CustomTextButton
