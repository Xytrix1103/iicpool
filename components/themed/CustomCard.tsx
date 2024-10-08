import { StyleSheet, View } from 'react-native'
import { ReactNode } from 'react'

type CustomCardProps = {
	children: ReactNode
	borderRadius?: number
	elevation?: number
	padding?: number
	gap?: number
}

const CustomCard = ({ children, borderRadius = 10, elevation = 5, padding = 20, gap = 10 }: CustomCardProps) => {
	return (
		<View style={[
			styles.card,
			{ borderRadius, elevation, padding, gap },
		]}>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: 'white',
		elevation: 5,
		padding: 20,
		borderRadius: 10,
		gap: 10,
	},
})

export default CustomCard
