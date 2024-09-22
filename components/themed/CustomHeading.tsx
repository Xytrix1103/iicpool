import { useTheme } from 'react-native-paper'
import { Text } from 'react-native'

const CustomHeading = ({ size = 24, children }: {
	size: number,
	children: string
}) => {
	const { colors } = useTheme()
	
	return (
		// @ts-expect-error colors type
		<Text style={[style.heading, { color: colors.text, fontSize: size }]}>
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
