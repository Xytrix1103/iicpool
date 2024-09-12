import { GoogleSignin } from '@react-native-google-signin/google-signin'
import {
	createUserWithEmailAndPassword,
	EmailAuthProvider,
	GoogleAuthProvider,
	linkWithCredential,
	signInWithCredential,
	signInWithEmailAndPassword,
} from 'firebase/auth'
import FirebaseApp from '../components/FirebaseApp'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Alert, ToastAndroid } from 'react-native'
import firebase from 'firebase/compat'
import { RegisterProps } from '../screens/Register'
import { httpsCallable } from 'firebase/functions'
import { Role } from '../database/schema'
import FirebaseError = firebase.FirebaseError

GoogleSignin.configure({
	webClientId:
		'1036262039422-a4bpd0qk0pubffjg1s5fumgdh2h0jksh.apps.googleusercontent.com', // client ID of type WEB for your server (needed to verify user ID and offline access)
})

const logout = async () => {
	const { auth } = FirebaseApp
	
	await auth.signOut()
}

const register = (data: RegisterProps) => {
	console.log('Register -> data sent', data)
	
	const { email, password } = data
	const { auth } = FirebaseApp
	
	createUserWithEmailAndPassword(auth, email, password)
		.then(async (userCredential) => {
			console.log('Register -> userCredential', userCredential)
			
			//add user to users collection
			const { db } = FirebaseApp
			const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid))
			
			if (!docSnap.exists()) {
				await setDoc(doc(db, 'users', userCredential.user.uid), {
					full_name: '',
					mobile_number: '',
					roles: [Role.PASSENGER],
					photo_url: null,
					deleted: false,
				})
			}
		})
		.catch((error: FirebaseError) => {
			console.log('Register -> error', error)
			
			if (error.code === 'auth/email-already-in-use') {
				Alert.alert('Error', 'This email is already in use. Please use another email.')
			} else {
				Alert.alert('Error', 'An error occurred. Please try again later.')
			}
		})
}

const login = (email: string, password: string) => {
	const { auth } = FirebaseApp
	
	signInWithEmailAndPassword(auth, email, password)
		.then(userCredential => {
			console.log('Login -> userCredential', userCredential)
		})
		.catch(error => {
			console.log('Login -> error', error)
		})
}

const googleLogin = async (setLoadingOverlay: (loadingOverlay: { show: boolean; message: string; }) => void) => {
	const { auth, db, functions } = FirebaseApp
	
	try {
		// Check if Google Play Services are available
		await GoogleSignin.hasPlayServices()
		//if user is signed in, sign out to allow user to prevent automatic sign in
		await GoogleSignin.signOut()
		
		//sign in with Google account
		const userInfo = await GoogleSignin.signIn()
		console.log(userInfo)
		
		//user email must end in newinti.edu.my, else throw error
		if (!userInfo.user.email.endsWith('newinti.edu.my')) {
			ToastAndroid.show('Please use your INTI email to login.', ToastAndroid.SHORT)
			return
		}
		
		setLoadingOverlay({
			show: true,
			message: 'Signing you in...',
		})
		
		const checkUser = httpsCallable(functions, 'checkEmailGoogleSignIn')
		
		const checkResult = await checkUser({ email: userInfo.user.email })
			.then(result => {
				return !!result.data
			})
			.catch(error => {
				const fbError = error as FirebaseError
				return fbError.code !== 'functions/not-found'
			})
		
		if (!checkResult) {
			Alert.alert('Error', 'Google account not linked to any account. Please sign in with your email and password.')
			return
		}
		
		// Create a new Google credential
		const googleCredential = GoogleAuthProvider.credential(userInfo.idToken)
		
		// Sign-in the user with the credential
		await signInWithCredential(auth, googleCredential)
			.then(async userCredential => {
				// If document does not exist, create a new document in the users collection
				const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid))
				
				if (!docSnap.exists()) {
					await setDoc(doc(db, 'users', userCredential.user.uid), {
						roles: [Role.PASSENGER],
						deleted: false,
					})
				}
			})
			.catch(error => {
				console.log('Google login -> error', error)
			})
	} catch (error) {
		console.error('Google login -> error', error)
	} finally {
		await GoogleSignin.signOut()
	}
}

const linkEmailPassword = async (email: string, password: string) => {
	const { auth } = FirebaseApp
	
	const credential = EmailAuthProvider.credential(email, password)
	
	if (auth.currentUser) {
		await linkWithCredential(auth.currentUser, credential)
			.then(userCredential => {
				console.log('Link Email Password -> userCredential', userCredential)
			})
			.catch(error => {
				console.log('Link Email Password -> error', error)
			})
	}
}

const linkGoogle = async () => {
	const { auth } = FirebaseApp
	
	const userInfo = await GoogleSignin.signIn()
	
	const googleCredential = GoogleAuthProvider.credential(userInfo.idToken)
	
	if (auth.currentUser) {
		await linkWithCredential(auth.currentUser, googleCredential)
			.then(userCredential => {
				console.log('Link Google -> userCredential', userCredential)
			})
			.catch(error => {
				console.log('Link Google -> error', error)
			})
	}
}

export { login, logout, googleLogin, register }
