import { StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from 'react-native-paper'
import CustomText from './CustomText'

const CustomTextButton = ({ children, ...props }: any) => {
	const { colors } = useTheme()
	
	return (
		<TouchableOpacity
			{...props}
			style={[
				styles.button,
				{
					backgroundColor: colors.primary,
				},
			]}
		>
			<CustomText size={16} bold color={colors.background}>
				{children}
			</CustomText>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	button: {
		padding: 10,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 5,
	},
})

export default CustomTextButton
