import { IconButton, IconButtonProps } from 'react-native-paper'
import { useContext } from 'react'
import { LoadingOverlayContext } from '../contexts/LoadingOverlayContext'

//override style margin to 0
const CustomIconButton = (props: IconButtonProps) => {
	const { loadingOverlay } = useContext(LoadingOverlayContext)
	
	return <IconButton
		{...props}
		style={{ margin: 0, paddingHorizontal: 0 }}
		animated={true}
		disabled={loadingOverlay.show}
	/>
}

export default CustomIconButton

