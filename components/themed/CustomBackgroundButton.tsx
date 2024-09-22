import { IconButtonProps } from 'react-native-paper'
import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable } from 'react-native'

//override style margin to 0
const CustomBackgroundButton = (
	{
		iconColor,
		padding,
		backgroundColor,
		borderRadius,
		elevation,
		borderColor,
		...props
	}: IconButtonProps & {
		padding?: number;
		backgroundColor?: string;
		borderRadius?: number;
		elevation?: number,
		borderColor?: string,
		iconColor?: string
	},
) => {
	return (
		<Pressable
			style={{
				backgroundColor: backgroundColor,
				padding: padding,
				borderRadius: borderRadius,
				elevation: elevation,
				borderColor: borderColor,
				borderWidth: borderColor ? 1 : 0,
			}}
			onPress={props.onPress}
		>
			<Icon
				// @ts-expect-error icon type
				name={props.icon}
				size={props.size}
				color={iconColor}
			/>
		</Pressable>
	)
}

export default CustomBackgroundButton

