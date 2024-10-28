import { ActivityIndicator } from 'react-native-paper'
import { Image, View } from 'react-native'
import CustomLayout from '../components/themed/CustomLayout'
import style from '../styles/shared'
import React from 'react'

const Loading = () => {
	return (
		<CustomLayout>
			<View style={[style.mainContent, { justifyContent: 'center' }]}>
				<View style={[style.column, { gap: 20 }]}>
					<View style={[style.column, { alignItems: 'center', justifyContent: 'center', gap: 20 }]}>
						<Image
							source={
								require('../assets/logo.png')
							}
							style={{ width: '50%', height: '50%' }}
							resizeMode="contain"
						/>
						<ActivityIndicator animating={true} size="large" />
					</View>
				</View>
			</View>
		</CustomLayout>
	)
}

export default Loading
