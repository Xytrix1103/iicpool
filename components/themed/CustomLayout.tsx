//custom layout component to handle screen layout with a header and a footer (both optional) and a main content area which may or may not be scrollable
import { ScrollView, StyleSheet, View } from 'react-native'
import { FC, ReactNode } from 'react'
import { useTheme } from 'react-native-paper'
import CustomAppbar from './CustomAppbar'

type LayoutProps = {
	header?: ReactNode
	hasAppBar?: boolean
	scrollable?: boolean
	children: ReactNode
	contentPadding?: number
	containerPadding?: number
}

const CustomLayout: FC<LayoutProps> = (
	{
		header,
		hasAppBar = false,
		scrollable = false,
		children,
		containerPadding = 0,
		contentPadding = 20,
	}) => {
	const { colors } = useTheme()
	
	return (
		<View style={[style.root, { backgroundColor: colors.background, padding: containerPadding }]}>
			{
				header &&
				<View style={style.container}>
					{header}
				</View>
			}
			{
				scrollable ?
					<ScrollView style={style.scrollViewContent}>
						<View style={[style.container, { padding: contentPadding }]}>
							{children}
						</View>
					</ScrollView> :
					<View style={[style.container, { padding: contentPadding }]}>
						{children}
					</View>
			}
			{
				hasAppBar &&
				<CustomAppbar />
			}
		</View>
	)
}

const style = StyleSheet.create({
	root: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	scrollViewContent: {
		width: '100%',
		height: '100%',
	},
	container: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
})

export default CustomLayout
