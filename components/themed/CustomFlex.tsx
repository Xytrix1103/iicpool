import { StyleSheet, View } from 'react-native'
import { ReactNode } from 'react'

const CustomFlex = ({ children }: { children: ReactNode }) => {
	return (
		<View style={style.root}>
			{children}
		</View>
	)
}

const style = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
})

export default CustomFlex
