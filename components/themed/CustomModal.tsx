import { ReactNode } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import CustomIconButton from './CustomIconButton'
import style from '../../styles/shared'

type CustomModalProps = {
	visible: boolean
	onClose?: () => void
	children: ReactNode
	style?: StyleProp<ViewStyle>
}

const CustomModal = ({ visible, onClose, children, style: customStyle }: CustomModalProps) => {
	return (
		<View style={style.mainContent}>
			<View style={[style.column, customStyle]}>
				<View style={[style.row, { justifyContent: 'flex-end', alignItems: 'center' }]}>
					{
						onClose && <CustomIconButton icon="close" onPress={onClose} />
					}
				</View>
				{visible && children}
			</View>
		</View>
	)
}

export default CustomModal
