import { DimensionValue, Text, TextProps } from 'react-native'
import { ReactNode } from 'react'

export type CustomTextProps = {
	size?: number;
	children: (string | ReactNode) | (string | ReactNode)[];
	bold?: boolean;
	color?: string;
	width?: string;
	align?: 'center' | 'left' | 'right';
} & TextProps

const CustomText = (
	{
		size = 18,
		children,
		bold = false,
		color = 'black',
		width = 'auto',
		align = 'left',
		...props
	}: CustomTextProps,
) => {
	return (
		<Text
			style={{
				fontSize: size,
				color: color,
				fontWeight: bold ? 'bold' : 'normal',
				width: width as DimensionValue,
				textAlign: align,
				overflow: (props.numberOfLines ?? 0) > 1 ? 'hidden' : 'visible',
			}}
			numberOfLines={props.numberOfLines}
		>
			<Text
				{...props}
			>
				{children}
			</Text>
		</Text>
	)
}

export default CustomText
