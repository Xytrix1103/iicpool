import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getReactNativePersistence, initializeAuth } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
	apiKey: 'AIzaSyBsT2Z8Md3LNRIeuj34_aaFKzKbu12k2Ls',
	authDomain: 'iicpool.firebaseapp.com',
	projectId: 'iicpool',
	storageBucket: 'iicpool.appspot.com',
	messagingSenderId: '1036262039422',
	appId: '1:1036262039422:web:5c0302bc06d8906d8b1d2f',
	measurementId: 'G-L0NK913GP8',
}

const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, {
	persistence: getReactNativePersistence(AsyncStorage),
})
auth.useDeviceLanguage()
const db = getFirestore(app)
const storage = getStorage(app)
const functions = getFunctions(app)

export default { auth, db, storage, functions }
