import { GoogleSignin } from '@react-native-google-signin/google-signin'
import {
	createUserWithEmailAndPassword,
	deleteUser,
	EmailAuthProvider,
	GoogleAuthProvider,
	linkWithCredential,
	reauthenticateWithCredential,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithCredential,
	signInWithEmailAndPassword,
	unlink,
	User,
} from 'firebase/auth'
import { deleteField, doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore'
import FirebaseApp from '../components/FirebaseApp'
import { Alert, ToastAndroid } from 'react-native'
import firebase from 'firebase/compat'
import { RegisterProps } from '../screens/Register'
import { httpsCallable } from 'firebase/functions'
import { Profile, ProfileNotificationSettings, Role } from '../database/schema'
import { Timestamp } from '@firebase/firestore'
import * as SecureStore from 'expo-secure-store'
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
			}
			
			await SecureStore.deleteItemAsync('currentRide')
			await SecureStore.deleteItemAsync('userId')
			
			if (callback) {
				callback()
			}
			
			console.log('logout -> success')
		})
		.catch((error: FirebaseError) => {
			console.log('logout -> error', error)
		})
}

const register = async (
	{
		data,
		notificationSettings,
		setLoadingOverlay,
	}: {
		data: RegisterProps
		notificationSettings: ProfileNotificationSettings,
		setLoadingOverlay: (loadingOverlay: { show: boolean; message: string }) => void
	}) => {
	console.log('Register -> data sent', data)
	
	const { email, password } = data
	
	setLoadingOverlay({
		show: true,
		message: 'Registering...',
	})
	
	await createUserWithEmailAndPassword(auth, email, password)
		.then(async (userCredential) => {
			console.log('Register -> userCredential', userCredential)
			
			await runTransaction(db, async (transaction) => {
				const userRef = doc(db, 'users', userCredential.user.uid)
				
				transaction.set(userRef, {
					full_name: '',
					mobile_number: '',
					roles: [Role.PASSENGER],
					deleted_at: null,
					notification_settings: notificationSettings,
					created_at: Timestamp.now(),
				} as Profile)
			})
				.then(() => {
					console.log('Register -> success')
				})
				.catch(error => {
					console.log('Register -> error', error)
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

const login = async (email: string, password: string) => {
	return await signInWithEmailAndPassword(auth, email, password)
		.then(userCredential => {
			console.log('Login -> userCredential', userCredential)
			
			return userCredential
		})
		.catch(error => {
			console.log('Login -> error', error)
			
			throw error
		})
}

const googleLogin = async (
	{
		setLoadingOverlay,
		notificationSettings,
	}: {
		setLoadingOverlay: (loadingOverlay: { show: boolean; message: string }) => void
		notificationSettings: ProfileNotificationSettings
	},
) => {
	try {
		// Check if Google Play Services are available
		const hasPlayServices = await GoogleSignin.hasPlayServices()
		
		console.log('Google login -> hasPlayServices', hasPlayServices)
		
		if (!hasPlayServices) {
			ToastAndroid.show('Google Play Services are not available.', ToastAndroid.SHORT)
			return
		}
		
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
					const userRef = doc(db, 'users', userCredential.user.uid)
					
					if (await getDoc(userRef).then((doc) => doc.exists())) {
						return
					}
					
					transaction.set(userRef, {
						full_name: userCredential.user.displayName ?? '',
						mobile_number: userCredential.user.phoneNumber ?? '',
						roles: [Role.PASSENGER],
						deleted_at: null,
						notification_settings: notificationSettings,
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
	await GoogleSignin.signOut()
	const userInfo = await GoogleSignin.signIn()
	
	if (auth.currentUser?.email !== userInfo.user.email) {
		await GoogleSignin.signOut()
		throw new Error('The Google account email does not match the current user email.')
	}
	
	const googleCredential = GoogleAuthProvider.credential(userInfo.idToken)
	
	await GoogleSignin.signOut()
	
	if (auth.currentUser) {
		return await linkWithCredential(auth.currentUser, googleCredential)
	} else {
		throw new Error('User not signed in')
	}
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

const deleteAccount = async (password: string) => {
	if (!auth.currentUser) {
		return
	}
	
	const credential = EmailAuthProvider.credential(
		auth.currentUser?.email ?? '',
		password,
	)
	
	try {
		await reauthenticateWithCredential(<User>auth.currentUser, credential)
	} catch (error) {
		Alert.alert('Error', 'Invalid password')
		return
	}
	
	Alert.alert(
		'Delete Account',
		'Are you sure you want to delete your account? This action is irreversible.',
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Delete Account',
				onPress: async () => {
					//soft delete user from db
					await runTransaction(db, async (transaction) => {
						const userRef = doc(
							db,
							'users',
							auth.currentUser?.uid ?? '',
						)
						const userDoc = await transaction.get(userRef)
						
						if (userDoc.exists()) {
							transaction.update(userRef, {
								deletedAt: new Date(),
							})
						}
						
						await deleteUser(<User>auth.currentUser)
					})
				},
			},
		],
	)
}

const forgotPassword = async (email: string) => {
	return await sendPasswordResetEmail(auth, email)
		.then(() => {
			console.log('forgotPassword -> success')
			
			return true
		})
		.catch(error => {
			console.log('forgotPassword -> error', error)
			
			throw error
		})
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
	backgroundLogout,
	forgotPassword,
	deleteAccount,
}
