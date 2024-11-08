import { ScrollView, StyleSheet, View } from 'react-native'
import { FC, ReactElement, ReactNode, useRef } from 'react'
import { useTheme } from 'react-native-paper'
import CustomAppbar from './CustomAppbar'

type CustomHeaderProps = {
	title: string,
	navigation?: any,
	onPress?: () => void
	rightNode?: ReactNode
}

type LayoutProps = {
	header?: ReactElement<CustomHeaderProps>,
	footer?: ReactNode,
	hasAppBar?: boolean,
	scrollable?: boolean,
	children: ReactNode,
	contentPadding?: number,
	containerPadding?: number,
	centered?: boolean,
	alwaysScrollToBottom?: boolean
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
		alwaysScrollToBottom = false,
	},
) => {
	const { colors } = useTheme()
	const scrollViewRef = useRef<ScrollView>(null)
	
	return (
		<View style={[style.root, { backgroundColor: colors.background, padding: containerPadding }]}>
			{header && (
				<View style={[style.headerContainer, { padding: 20 }]}>
					{header}
				</View>
			)}
			{scrollable ? (
				<ScrollView
					style={style.scrollViewContent}
					contentContainerStyle={style.scrollViewContainer}
					ref={scrollViewRef}
					onContentSizeChange={() => {
						if (alwaysScrollToBottom) {
							scrollViewRef.current?.scrollToEnd({ animated: true })
						}
					}}
				>
					<View style={[style.container, {
						paddingTop: header && contentPadding > 0 ? 10 : contentPadding,
						paddingBottom: hasAppBar && contentPadding > 0 ? 10 : contentPadding,
						paddingHorizontal: contentPadding,
						justifyContent: centered ? 'center' : 'flex-start',
						marginBottom: footer ? 20 : 0,
						height: '100%',
					}]}>
						{children}
					</View>
				</ScrollView>
			) : (
				<View style={[style.container, {
					paddingTop: header && contentPadding > 0 ? 10 : contentPadding,
					paddingBottom: hasAppBar && contentPadding > 0 ? 10 : contentPadding,
					paddingHorizontal: contentPadding,
					justifyContent: centered ? 'center' : 'flex-start',
					marginBottom: footer ? 20 : 0,
				}]}>
					{children}
				</View>
			)}
			{footer && <View style={style.footerContainer}>{footer}</View>}
			{hasAppBar && <CustomAppbar />}
		</View>
	)
}

const style = StyleSheet.create({
	root: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	scrollViewContent: {
		flex: 1,
		width: '100%',
		alignSelf: 'flex-start',
	},
	scrollViewContainer: {
		flexGrow: 1,
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
