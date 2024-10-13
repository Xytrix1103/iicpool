import { auth, db } from '../components/firebase/FirebaseApp.tsx'
import { deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

const logout = async ({ callback }: { callback?: () => void } = {}): Promise<void> => {
	//delete fcm token
	const user = auth.currentUser
	
	if (!user) {
		return
	}
	
	const userId = user.uid
	const userRef = doc(db, 'admins', userId)
	
	await auth
		.signOut()
		.then(async () => {
			//check if user is mobile user or contractor
			if (await getDoc(userRef).then((doc) => doc.exists())) {
				await updateDoc(userRef, {
					expoPushToken: deleteField(),
				})
			}
			
			if (callback) {
				callback()
			}
			
			console.log('logout -> success')
		})
}

const login = (email: string, password: string) => {
	signInWithEmailAndPassword(auth, email, password)
		.then(userCredential => {
			console.log('Login -> userCredential', userCredential)
		})
		.catch(error => {
			console.log('Login -> error', error)
		})
}

export { logout, login }
