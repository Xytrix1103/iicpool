import React from 'react'
import { Text, View } from 'react-native'

const CustomTextDivider = ({ text, vmargin = 0 }: { text: string; vmargin: number }) => {
	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				marginVertical: vmargin,
			}}>
			<View style={{ flex: 1, height: 1, backgroundColor: 'darkred' }} />
			<View>
				<Text
					style={{ width: 50, textAlign: 'center', color: 'darkred' }}>
					{text}
				</Text>
			</View>
			<View style={{ flex: 1, height: 1, backgroundColor: 'darkred' }} />
		</View>
	)
}

export default CustomTextDivider
