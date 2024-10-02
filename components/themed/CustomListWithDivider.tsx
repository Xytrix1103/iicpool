import { Fragment, ReactNode } from 'react'
import { View } from 'react-native'
import style from '../../styles/shared'

type CustomListWithDividerProps = {
	items: ReactNode[]
	dividerComponent: ReactNode
	containerStyle?: any
}

const CustomListWithDivider = ({ items, dividerComponent, containerStyle }: CustomListWithDividerProps) => {
	return (
		<View style={[style.column, containerStyle]}>
			{
				items.map((item, index) => (
					<>
						{item}
						{index < items.length - 1 && dividerComponent}
					</>
				))
			}
		</View>
	)
}

export default CustomListWithDivider