import { useTheme } from 'react-native-paper'
import { Text } from 'react-native'

const CustomHeading = ({ children }: {
	children: string
}) => {
	const { colors } = useTheme()
	
	return (
		// @ts-expect-error colors type
		<Text style={[style.heading, { color: colors.text }]}>
			{children}
		</Text>
	)
}

const style = {
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins',
	},
}

export default CustomHeading
