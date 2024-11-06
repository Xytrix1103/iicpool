import { auth, db } from '../components/firebase/FirebaseApp.tsx'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { callToast } from './toast-utils.ts'
import { doc, getDoc } from 'firebase/firestore'

const logout = async ({ callback }: { callback?: () => void } = {}): Promise<void> => {
	//delete fcm token
	const user = auth.currentUser
	
	if (!user) {
		return
	}
	
	await auth
		.signOut()
		.then(async () => {
			if (callback) {
				callback()
			}
			
			console.log('logout -> success')
		})
}

const login = (email: string, password: string, toast: any) => {
	signInWithEmailAndPassword(auth, email, password)
		.then(userCredential => {
			console.log('Login -> userCredential', userCredential)
			
			getDoc(doc(db, 'admins', userCredential.user.uid))
				.then(doc => {
					if (doc.exists()) {
						console.log('Login -> doc', doc)
						callToast(toast, 'Success', 'Logged in')
					} else {
						throw new Error('User not found')
					}
				})
				.catch(error => {
					console.log('Login -> error', error)
					callToast(toast, 'Error', 'Invalid email or password')
					logout()
						.then(() => {
							console.log('Login -> success')
						})
						.catch(error => {
							console.log('Login -> error', error)
						})
				})
		})
		.catch(error => {
			console.log('Login -> error', error)
			callToast(toast, 'Error', 'Invalid email or password')
		})
}

export { logout, login }
