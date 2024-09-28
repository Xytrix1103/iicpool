//create provider
import { createContext, useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native-paper'
import { Modal, StyleSheet, Text, View } from 'react-native'

type LoadingOverlayContextType = {
	loadingOverlay: {
		show: boolean,
		message: string,
	},
	setLoadingOverlay: (loadingOverlay: { show: boolean, message: string }) => void
}

const LoadingOverlayContext = createContext<LoadingOverlayContextType>({
	loadingOverlay: {
		show: false,
		message: '',
	},
	setLoadingOverlay: (loadingOverlay: { show: boolean; message: string; }) => {
	},
})

const LoadingOverlayProvider = ({ children }: any) => {
	const [loadingOverlay, setLoadingOverlay] = useState({
		show: false,
		message: '',
	})
	
	useEffect(() => {
		console.log('loadingOverlay:', loadingOverlay)
	}, [loadingOverlay])
	
	return (
		<LoadingOverlayContext.Provider value={{ loadingOverlay, setLoadingOverlay }}>
			{children}
			<Modal
				transparent={true}
				animationType="none"
				visible={loadingOverlay.show}
				onRequestClose={() => null}
			>
				<View style={styles.modalBackground}>
					<View style={styles.activityIndicatorWrapper}>
						<ActivityIndicator animating={loadingOverlay.show} size="large" />
						{
							loadingOverlay.message !== '' &&
							<Text>{loadingOverlay.message}</Text>
						}
					</View>
				</View>
			</Modal>
		</LoadingOverlayContext.Provider>
	)
}

const styles = StyleSheet.create({
	modalBackground: {
		flex: 1,
		alignItems: 'center',
		flexDirection: 'column',
		justifyContent: 'center',
		backgroundColor: '#00000040',
	},
	activityIndicatorWrapper: {
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 20,
		//square
		width: 150,
		height: 150,
	},
})

export { LoadingOverlayContext, LoadingOverlayProvider }