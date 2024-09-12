import { DimensionValue, Text } from 'react-native'

export type CustomTextProps = {
	size?: number;
	children: string;
	bold?: boolean;
	color?: string;
	width?: string;
	align?: 'center' | 'left' | 'right';
}

const CustomText = (
	{
		size = 18,
		children,
		bold = false,
		color = 'black',
		width = 'auto',
		align = 'left',
	}: CustomTextProps) => {
	return (
		<Text
			style={{
				fontSize: size,
				color: color,
				fontWeight: bold ? 'bold' : 'normal',
				width: width as DimensionValue,
				textAlign: align,
				overflow: 'hidden',
			}}
			numberOfLines={1}
		>
			{children}
		</Text>
	)
}

export default CustomText
