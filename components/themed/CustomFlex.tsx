import { View } from 'react-native'
import { ReactNode } from 'react'

const CustomFlex = ({ children }: { children: ReactNode }) => {
	return (
		<View style={{ flex: 1 }}>
			{children}
		</View>
	)
}

export default CustomFlex
