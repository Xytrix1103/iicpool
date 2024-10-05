import React, { ReactNode, useContext } from 'react'
import { Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

interface CustomBackgroundButtonProps extends PressableProps {
	icon: string;
	iconColor?: string;
	size?: number;
	padding?: number;
	backgroundColor?: string;
	borderRadius?: number;
	elevation?: number;
	borderColor?: string;
	children?: ReactNode;
	style?: ViewStyle;
}

const CustomBackgroundButton: React.FC<CustomBackgroundButtonProps> = (
	{
		icon,
		iconColor = 'black',
		size = 24,
		padding = 10,
		backgroundColor = 'white',
		borderRadius = 10,
		elevation = 5,
		borderColor,
		children,
		style,
		...props
	},
) => {
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return (
		<Pressable
			onPress={props.onPress}
			disabled={loadingOverlay.show || props.disabled}
			style={({ pressed }) => [
				styles.pressable,
				{ opacity: pressed ? 0.8 : 1 },
				style,
			]}
			{...props}
		>
			<View
				style={[
					styles.container,
					{
						backgroundColor,
						padding,
						borderRadius,
						elevation,
						borderColor,
						borderWidth: borderColor ? 1 : 0,
					},
				]}
			>
				{/* @ts-ignore */}
				<Icon name={icon} size={size} color={iconColor} />
				{children}
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	pressable: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 5,
	},
})

export default CustomBackgroundButton
