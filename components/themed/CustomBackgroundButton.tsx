import { IconButtonProps } from 'react-native-paper'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable, View } from 'react-native'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'
import { ReactNode, useContext } from 'react'

//override style margin to 0
const CustomBackgroundButton = (
	{
		iconColor,
		padding,
		backgroundColor,
		borderRadius,
		elevation,
		borderColor,
		children,
		...props
	}: IconButtonProps & {
		padding?: number;
		backgroundColor?: string;
		borderRadius?: number;
		elevation?: number,
		borderColor?: string,
		iconColor?: string,
		children?: ReactNode
	},
) => {
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return (
		<Pressable
			onPress={props.onPress}
			disabled={loadingOverlay.show || props.disabled}
		>
			<View
				style={{
					backgroundColor: backgroundColor,
					padding: padding,
					borderRadius: borderRadius,
					elevation: elevation,
					borderColor: borderColor,
					borderWidth: borderColor ? 1 : 0,
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 5,
				}}
			>
				<Icon
					// @ts-expect-error icon type
					name={props.icon}
					size={props.size}
					color={iconColor}
				/>
				{children}
			</View>
		</Pressable>
	)
}

export default CustomBackgroundButton

