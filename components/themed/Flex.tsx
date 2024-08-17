import { View, ViewProps } from 'react-native'

export type FlexProps = ViewProps & {
	flex?: number
	align?: 'center' | 'flex-start' | 'flex-end'
	justify?: 'center' | 'flex-start' | 'flex-end'
}

const Flex = ({ flex, align, justify, style, ...props }: FlexProps) => {
	return (
		<View
			style={[
				{
					flex: flex,
					alignItems: align,
					justifyContent: justify,
				},
				style,
			]}
			{...props}
		/>
	)
}

export default Flex
