import {StyleSheet} from 'react-native';

export const base = StyleSheet.create({
	flex: {
		flex: 1,
	},
	alignC: {
		alignItems: 'center',
	},
	justifyC: {
		justifyContent: 'center',
	},
	fullW: {
		width: '100%',
	},
	fullH: {
		height: '100%',
	},
});

export const components = StyleSheet.create({
	text: {
		fontSize: 20,
	},
	loading: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	heading: {
		fontSize: 24,
		fontWeight: 'bold',
		marginVertical: 16,
		lineHeight: 32,
		textAlign: 'center',
	},
	subheading: {
		fontSize: 16,
	},
	logo: {
		height: 200,
	},
	button: {
		flex: 1,
		marginVertical: 10,
		paddingVertical: 5,
		backgroundColor: 'darkred',
		color: 'white',
	},
	buttonOutlined: {
		flex: 1,
		marginVertical: 10,
		paddingVertical: 5,
		borderColor: 'darkred',
	},
	buttonGoogle: {
		flex: 1,
		marginVertical: 10,
		paddingVertical: 5,
		backgroundColor: 'white',
		color: 'darkred',
	},
	fab: {
		position: 'absolute',
		margin: 16,
		right: 0,
		bottom: 0,
		zIndex: 1,
	},
	input: {
		width: '100%',
	},
	helperText: {
		marginLeft: '10%',
	},
});

export const baseViews = StyleSheet.create({
	container: {
		width: '100%',
		height: '100%',
	},
	flexContainer: {
		flex: 1,
	},
	flexCenterContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	centerContainer: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		width: '100%',
	}
});

export const registerStyles = StyleSheet.create({
	...baseViews,
	...components,
	form: {
		flex: 1,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonContainer: {
		width: '100%',
		position: 'absolute',
		bottom: 0,
		padding: 20,
		alignItems: 'center',
	},
});
