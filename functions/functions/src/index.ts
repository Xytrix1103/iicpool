/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {HttpsError, onCall, onRequest} from 'firebase-functions/v2/https'
import {setGlobalOptions} from "firebase-functions/v2";
import {initializeApp} from 'firebase-admin/app'
import {getAuth} from 'firebase-admin/auth'
import {beforeUserSignedIn, HttpsError as IdentityError,} from "firebase-functions/v2/identity";

//set region to asia-southeast2

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Initialize the Firebase Admin SDK
initializeApp()

// Set global options
setGlobalOptions({
	timeoutSeconds: 540,
	memory: '2GiB',
	region: 'asia-southeast1',
})

const auth = getAuth()

// authentication function to return an email's sign-in methods
export const getSignInMethods = onRequest(async (request, response) => {
	const {email} = request.body
	
	if (!email) {
		response.status(400).send('Email is required')
		return
	}
	
	try {
		const result = await auth.getUserByEmail(email)
		response.send(result)
	} catch (error) {
		response.status(500).send(error)
	}
})

export const getUserInfo = onCall(async (request) => {
	const {email} = request.data
	
	if (!email || email === '') {
		throw new HttpsError('invalid-argument', 'Email is required')
	}
	
	try {
		return await auth.getUserByEmail(email)
	} catch (error) {
		throw new HttpsError('not-found', 'User not found')
	}
})

export const checkEmailGoogleSignIn = onCall(async (request) => {
	const {email} = request.data
	
	if (!email || email === '') {
		throw new HttpsError('invalid-argument', 'Email is required')
	}
	
	if (!email.endsWith('newinti.edu.my')) {
		throw new HttpsError('invalid-argument', 'Please use your INTI email to login')
	}
	
	const user = await auth.getUserByEmail(email)
	
	if (!(user.providerData.some(provider => provider.providerId === 'google.com'))) {
		throw new HttpsError('not-found', 'Google account not linked to any account')
	}
	
	return user
})

export const blockSignIn = beforeUserSignedIn(async (event) => {
	const {additionalUserInfo, credential} = event
	const email = additionalUserInfo?.profile?.email
	
	if (!email || email === '') {
		throw new IdentityError('invalid-argument', 'Email is required')
	}
	
	if (!email.endsWith('newinti.edu.my')) {
		throw new IdentityError('invalid-argument', 'Please use your INTI email to login')
	}
	
	const user = await auth.getUserByEmail(email)
	
	if (credential?.providerId === 'google.com') {
		if (user.providerData.some(provider => provider.providerId === 'password') && !user.providerData.some(provider => provider.providerId === 'google.com')) {
			throw new IdentityError('already-exists', 'Email is already linked to a password account')
		}
	} else {
		if (user.providerData.some(provider => provider.providerId === 'google.com') && !user.providerData.some(provider => provider.providerId === 'password')) {
			throw new IdentityError('already-exists', 'Email is already linked to a Google account')
		}
	}
})
