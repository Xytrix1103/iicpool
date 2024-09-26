import { StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from 'react-native-paper'
import CustomText from './CustomText'
import { FC } from 'react'

type CustomTextButtonProps = {
	onPress: () => void
	children: string
	size?: number
}

const CustomTextButton: FC<CustomTextButtonProps> = ({ children, onPress, size = 16, ...props }) => {
	const { colors } = useTheme()
	
	return (
		<TouchableOpacity
			{...props}
			style={[
				styles.button,
			]}
			onPress={onPress}
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
