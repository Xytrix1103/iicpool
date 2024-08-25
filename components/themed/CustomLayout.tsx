//custom layout component to handle screen layout with a header and a footer (both optional) and a main content area which may or may not be scrollable
import { ScrollView, StyleSheet, View } from 'react-native'
import { FC, ReactNode } from 'react'
import { useTheme } from 'react-native-paper'

type LayoutProps = {
	header?: ReactNode
	footer?: ReactNode
	scrollable?: boolean
	children: ReactNode
	contentPadding?: number
	containerPadding?: number
}

const CustomLayout: FC<LayoutProps> = (
	{
		header,
		footer,
		scrollable = false,
		children,
		containerPadding = 0,
		contentPadding = 0,
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
					<ScrollView style={[style.scrollViewContent, { padding: contentPadding }]}>
						<View style={style.container}>
							{children}
						</View>
					</ScrollView> :
					<View style={style.container}>
						{children}
					</View>
			}
			{
				footer &&
				<View style={{ width: '100%' }}>
					{footer}
				</View>
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
