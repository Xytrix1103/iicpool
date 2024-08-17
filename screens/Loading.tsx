import { ActivityIndicator } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'

const Loading = () => {
	return (
		<View style={style.container}>
			<ActivityIndicator size="large" color="darkred" />
		</View>
	)
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
})

export default Loading
