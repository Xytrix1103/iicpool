import { auth } from '../components/firebase/FirebaseApp.tsx'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { callToast } from './toast-utils.ts'

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
		})
		.catch(error => {
			console.log('Login -> error', error)
			callToast(toast, 'Error', 'Invalid email or password')
		})
}

export { logout, login }
