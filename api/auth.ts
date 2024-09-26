import { GoogleSignin } from '@react-native-google-signin/google-signin'
import {
	createUserWithEmailAndPassword,
	EmailAuthProvider,
	GoogleAuthProvider,
	linkWithCredential,
	sendEmailVerification,
	signInWithCredential,
	signInWithEmailAndPassword,
	unlink,
} from 'firebase/auth'
import { deleteField, doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { Alert, ToastAndroid } from 'react-native'
import firebase from 'firebase/compat'
import { RegisterProps } from '../screens/Register'
import { httpsCallable } from 'firebase/functions'
import { Profile, Role } from '../database/schema'
import { useContext } from 'react'
import { LoadingOverlayContext } from '../components/contexts/LoadingOverlayContext'
import { Timestamp } from '@firebase/firestore'
import FirebaseError = firebase.FirebaseError

GoogleSignin.configure({
	webClientId:
		'1036262039422-a4bpd0qk0pubffjg1s5fumgdh2h0jksh.apps.googleusercontent.com', // client ID of type WEB for your server (needed to verify user ID and offline access)
})

const { auth, db, functions } = FirebaseApp

const logout = async () => {
	Alert.alert('Logout', 'Are you sure you want to logout?', [
		{
			text: 'Cancel',
			style: 'cancel',
		},
		{
			text: 'Logout',
			onPress: async () => {
				await backgroundLogout()
			},
		},
	])
}

const backgroundLogout = async ({ callback }: { callback?: () => void } = {}): Promise<void> => {
	//delete fcm token
	const user = auth.currentUser
	
	if (!user) {
		return
	}
	
	const userId = user.uid
	const userRef = doc(db, 'users', userId)
	
	await auth
		.signOut()
		.then(async () => {
			//check if user is mobile user or contractor
			if (await getDoc(userRef).then((doc) => doc.exists())) {
				await updateDoc(userRef, {
					expoPushToken: deleteField(),
				})
			} else {
				const contractorRef = doc(db, 'Contractors', userId)
				await updateDoc(contractorRef, {
					expoPushToken: deleteField(),
				})
			}
			
			if (callback) {
				callback()
			}
			
			console.log('logout -> success')
		})
		.catch((error: FirebaseError) => {
			console.log('logout -> error', error)
		})
}

const register = async (data: RegisterProps) => {
	console.log('Register -> data sent', data)
	
	const { email, password } = data
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	
	setLoadingOverlay({
		show: true,
		message: 'Registering...',
	})
	
	await createUserWithEmailAndPassword(auth, email, password)
		.then(async (userCredential) => {
			console.log('Register -> userCredential', userCredential)
			
			await runTransaction(db, async (transaction) => {
				const userRef = doc(db, 'MobileUsers', userCredential.user.uid)
				
				transaction.set(userRef, {
					full_name: '',
					mobile_number: '',
					roles: [Role.PASSENGER],
					deleted: false,
					notification_settings: {
						new_rides: false,
						ride_updates: false,
						new_messages: false,
						new_passengers: false,
						booking_confirmation: false,
						driver_registration: false,
					},
					created_at: Timestamp.now(),
				} as Profile)
			})
				.then(() => {
					console.log('Register -> success')
				})
				.catch(error => {
					throw error
				})
		})
		.catch((error: FirebaseError) => {
			console.log('Register -> error', error)
			
			if (error.code === 'auth/email-already-in-use') {
				Alert.alert('Error', 'This email is already in use. Please use another email.')
			} else {
				Alert.alert('Error', 'An error occurred. Please try again later.')
			}
		})
		.finally(() => {
			setLoadingOverlay({
				show: false,
				message: '',
			})
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

const googleLogin = async (setLoadingOverlay: (loadingOverlay: { show: boolean; message: string; }) => void) => {
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
				console.log('Google login -> error', fbError)
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
				await runTransaction(db, async (transaction) => {
					const userRef = doc(db, 'MobileUsers', userCredential.user.uid)
					
					transaction.set(userRef, {
						full_name: userCredential.user.displayName ?? '',
						mobile_number: userCredential.user.phoneNumber ?? '',
						roles: [Role.PASSENGER],
						deleted: false,
						notification_settings: {
							new_rides: false,
							ride_updates: false,
							new_messages: false,
							new_passengers: false,
							booking_confirmation: false,
							driver_registration: false,
						},
						created_at: Timestamp.now(),
					} as Profile)
				})
					.then(() => {
						console.log('Google login -> success')
					})
					.catch(error => {
						throw error
					})
			})
			.catch(error => {
				console.log('Google login -> error', error)
			})
	} catch (error) {
		console.error('Google login -> error', error)
	} finally {
		await GoogleSignin.signOut()
		setLoadingOverlay({
			show: false,
			message: '',
		})
	}
}

const linkEmailPassword = async (email: string, password: string) => {
	const credential = EmailAuthProvider.credential(email, password)
	
	if (auth.currentUser) {
		return await linkWithCredential(auth.currentUser, credential)
	}
	
	return null
}

const linkGoogle = async () => {
	const userInfo = await GoogleSignin.signIn()
	
	//validate
	if (!userInfo.user.email.endsWith('newinti.edu.my')) {
		ToastAndroid.show('Please use your INTI email to login.', ToastAndroid.SHORT)
		return null
	}
	
	if (auth.currentUser?.email !== userInfo.user.email) {
		Alert.alert('Error', 'The Google account email does not match the current user email.')
		return null
	}
	
	const googleCredential = GoogleAuthProvider.credential(userInfo.idToken)
	
	if (auth.currentUser) {
		return await linkWithCredential(auth.currentUser, googleCredential)
	}
	
	return null
}

const unlinkEmailPassword = async () => {
	if (auth.currentUser) {
		return await unlink(auth.currentUser, 'password')
	}
	
	return null
}

const unlinkGoogle = async () => {
	if (auth.currentUser) {
		return await unlink(auth.currentUser, 'google.com')
	}
	
	return null
}

const sendVerificationEmail = async () => {
	if (auth.currentUser) {
		return await sendEmailVerification(auth.currentUser)
	}
}

export {
	login,
	logout,
	googleLogin,
	register,
	linkEmailPassword,
	linkGoogle,
	unlinkEmailPassword,
	unlinkGoogle,
	sendVerificationEmail,
}
