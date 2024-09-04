//custom layout component to handle screen layout with a header and a footer (both optional) and a main content area which may or may not be scrollable
import { ScrollView, StyleSheet, View } from 'react-native'
import { FC, ReactNode } from 'react'
import { useTheme } from 'react-native-paper'
import CustomAppbar from './CustomAppbar'

type LayoutProps = {
	header?: ReactNode
	footer?: ReactNode
	hasAppBar?: boolean
	scrollable?: boolean
	children: ReactNode
	contentPadding?: number
	containerPadding?: number
	centered?: boolean
}

const CustomLayout: FC<LayoutProps> = (
	{
		header,
		footer,
		hasAppBar = false,
		scrollable = false,
		children,
		containerPadding = 0,
		contentPadding = 20,
		centered = false,
	}) => {
	const { colors } = useTheme()
	
	return (
		<View style={[style.root, { backgroundColor: colors.background, padding: containerPadding }]}>
			{
				header &&
				<View style={style.headerContainer}>
					{header}
				</View>
			}
			{
				scrollable ?
					<ScrollView
						style={[style.scrollViewContent]}>
						<View style={[style.container, {
							paddingTop: header && contentPadding > 0 ? 10 : contentPadding,
							paddingBottom: hasAppBar && contentPadding > 0 ? 10 : contentPadding,
							paddingHorizontal: contentPadding,
							justifyContent: centered ? 'center' : 'flex-start',
						}]}>
							{children}
						</View>
					</ScrollView> :
					<View style={[style.container, {
						paddingTop: header && contentPadding > 0 ? 10 : contentPadding,
						paddingBottom: hasAppBar && contentPadding > 0 ? 10 : contentPadding,
						paddingHorizontal: contentPadding,
						justifyContent: centered ? 'center' : 'flex-start',
					}]}>
						{children}
					</View>
			}
			{
				footer &&
				<View style={style.footerContainer}>
					{footer}
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
		flex: 1,
		width: '100%',
		height: '100%',
		alignItems: 'center',
	},
	scrollViewContent: {
		flex: 1,
		width: '100%',
	},
	container: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		gap: 10,
	},
	headerContainer: {
		width: '100%',
		flexShrink: 0,
		alignItems: 'center',
	},
	footerContainer: {
		width: '100%',
		flexShrink: 0,
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
})

export default CustomLayout
