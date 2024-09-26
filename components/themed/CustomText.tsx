import { DimensionValue, Text } from 'react-native'
import { ReactNode } from 'react'

export type CustomTextProps = {
	size?: number;
	children: (string | ReactNode) | (string | ReactNode)[];
	bold?: boolean;
	color?: string;
	width?: string;
	align?: 'center' | 'left' | 'right';
	numberOflines?: number;
}

const CustomText = (
	{
		size = 18,
		children,
		bold = false,
		color = 'black',
		width = 'auto',
		align = 'left',
		numberOflines = 1,
	}: CustomTextProps) => {
	return (
		<Text
			style={{
				fontSize: size,
				color: color,
				fontWeight: bold ? 'bold' : 'normal',
				width: width as DimensionValue,
				textAlign: align,
				overflow: numberOflines > 1 ? 'hidden' : 'visible',
			}}
			numberOfLines={numberOflines}
		>
			{children}
		</Text>
	)
}

export default CustomText
