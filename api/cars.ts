import { doc, runTransaction } from 'firebase/firestore'
import { Alert, ToastAndroid } from 'react-native'
import { LoadingOverlayContextType } from '../components/contexts/LoadingOverlayContext'
import FirebaseApp from '../components/FirebaseApp'

const { db } = FirebaseApp

const handleDeleteCar = (id: string, setLoadingOverlay: LoadingOverlayContextType['setLoadingOverlay']) => {
	Alert.alert(
		'Delete Car',
		'Are you sure you want to delete this car?',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Delete',
				onPress: async () => {
					setLoadingOverlay({ show: true, message: 'Deleting car...' })
					await runTransaction(db, async (transaction) => {
						const carRef = doc(db, 'cars', id)
						transaction.update(carRef, {
							deleted_at: new Date(),
						})
					})
						.then(() => {
							console.log('Car deleted successfully')
							ToastAndroid.show('Car deleted successfully', ToastAndroid.SHORT)
						})
						.catch((error) => {
							console.error('Error deleting car', error)
						})
						.finally(() => {
							setLoadingOverlay({ show: false, message: '' })
						})
				},
				style: 'destructive',
			},
		],
	)
}

export { handleDeleteCar }
