import { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import style from '../../styles/shared'

type CustomListProps = {
	items: ReactNode[]
	containerStyle?: any
}

const CustomList = ({ items, containerStyle }: CustomListProps) => {
	return (
		<ScrollView style={[style.column, containerStyle, { width: '100%' }]}>
			{
				items.map((item, index) => (
					<>
						{item}
					</>
				))
			}
		</ScrollView>
	)
}

export default CustomList
