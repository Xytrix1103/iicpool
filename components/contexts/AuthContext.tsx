import React, { createContext, useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import FirebaseApp from '../FirebaseApp'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { Profile } from '../../database/schema'
import { httpsCallable } from 'firebase/functions'
import { Alert } from 'react-native'
import { backgroundLogout } from '../../api/auth'
import * as SecureStore from 'expo-secure-store'

const AuthContext = createContext<AuthContextType>({
	loading: true,
	setLoading: () => {
	},
	user: null,
	profile: null,
	userRecord: null,
	refreshUserRecord: () => {
	},
})

type AuthContextType = {
	loading: boolean;
	setLoading: (loading: boolean) => void;
	user: User | null;
	profile: Profile | null;
	userRecord: UserRecord | null;
	refreshUserRecord: () => void;
}

type UserRecord = {
	uid: string;
	email?: string;
	emailVerified: boolean;
	displayName?: string;
	photoURL?: string;
	phoneNumber?: string;
	disabled: boolean;
	metadata: {
		creationTime: string;
		lastSignInTime: string;
	};
	providerData: Array<{
		uid: string;
		displayName?: string;
		email?: string;
		photoURL?: string;
		providerId: string;
		phoneNumber?: string;
	}>;
	customClaims?: { [key: string]: any };
};

const { auth, db, functions } = FirebaseApp

const AuthProvider = ({ children }: any) => {
	const [loading, setLoading] = useState<boolean>(true)
	const [isAttachingListener, setIsAttachingListener] = useState<boolean>(true)
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	const [userRecord, setUserRecord] = useState<UserRecord | null>(null)
	const checkUser = httpsCallable(functions, 'getUserInfo')
	
	const refreshUserRecord = useCallback(async () => {
		const checkResult = await checkUser({ email: user?.email })
		
		console.log('AuthProvider -> checkResult', checkResult)
		
		if (!checkResult.data) {
			setUserRecord(null)
			return
		} else {
			setUserRecord(checkResult.data as UserRecord)
		}
	}, [functions, user])
	
	useEffect(() => {
		setIsAttachingListener(true)
		
		const unsubscribe = onAuthStateChanged(
			auth,
			async (newUser) => {
				if (newUser) {
					setLoading(true)
					await newUser.reload()
				}
				
				if (!newUser) {
					console.log('auth state changed, user is null')
					setUser(newUser)
					await SecureStore.deleteItemAsync('userId')
				} else {
					console.log('auth state changed, user is not null')
					
					if (
						newUser.metadata.creationTime &&
						newUser.metadata.lastSignInTime
					) {
						console.log('checking if user is new')
						const creationTime = new Date(
							newUser.metadata.creationTime,
						)
						const lastSignInTime = new Date()
						
						console.log('creationTime', creationTime)
						console.log('lastSignInTime', lastSignInTime)
						
						if (
							Math.abs(
								creationTime.getTime() -
								lastSignInTime.getTime(),
							) < 15000
						) {
							console.log('new user')
							
							setTimeout(() => {
								setUser(newUser)
								SecureStore.setItemAsync('userId', newUser.uid)
							}, 3000)
						} else {
							console.log('old user')
							
							await getDoc(doc(db, 'users/' + newUser?.uid))
								.then((doc) => {
									if (!doc.exists()) {
										throw new Error('User not found')
									} else {
										setUser(newUser)
										SecureStore.setItemAsync('userId', newUser.uid)
									}
								})
								.catch(async (error) => {
									console.log('AuthProvider -> error', error)
									
									await backgroundLogout({
										callback: () => {
											setUser(null)
											SecureStore.deleteItemAsync('userId')
										},
									})
										.then(() => {
											console.log(
												'AuthProvider -> success',
											)
										})
										.catch((error) => {
											console.log(
												'AuthProvider -> error',
												error,
											)
										})
								})
						}
					} else {
						console.log('old user')
						
						await getDoc(doc(db, 'users/' + newUser?.uid))
							.then((doc) => {
								if (!doc.exists()) {
									throw new Error('User not found')
								} else {
									setUser(newUser)
									SecureStore.setItemAsync('userId', newUser.uid)
								}
							})
							.catch(async (error) => {
								console.log('AuthProvider -> error', error)
								
								await backgroundLogout({
									callback: () => {
										setUser(null)
										SecureStore.deleteItemAsync('userId')
									},
								})
									.then(() => {
										console.log('AuthProvider -> success')
									})
									.catch((error) => {
										console.log(
											'AuthProvider -> error',
											error,
										)
									})
							})
					}
				}
				
				setIsAttachingListener(false)
			},
			async (error) => {
				console.log('AuthProvider -> error', error)
				
				setIsAttachingListener(false)
				
				await backgroundLogout({
					callback: () => {
						setUser(null)
						SecureStore.deleteItemAsync('userId')
					},
				})
					.then(() => {
						console.log('AuthProvider -> success')
					})
					.catch((error) => {
						console.log('AuthProvider -> error', error)
					})
			},
		)
		
		return () => {
			unsubscribe()
		}
	}, [])
	
	useEffect(() => {
		let unsubscribe: () => void
		
		if (isAttachingListener) {
			return
		}
		
		if (user) {
			unsubscribe = onSnapshot(doc(db, 'users', user.uid),
				async (snapshot) => {
					refreshUserRecord().then(r => r)
					
					if (snapshot.exists()) {
						setProfile(snapshot.data() as Profile)
						setLoading(false)
					} else {
						//check metadata if user is new, because there is a delay in firestore
						if (
							user?.metadata.creationTime &&
							user?.metadata.lastSignInTime
						) {
							const creationTime = new Date(
								user.metadata.creationTime,
							)
							const lastSignInTime = new Date(
								user.metadata.lastSignInTime,
							)
							
							if (
								Math.abs(
									creationTime.getTime() -
									lastSignInTime.getTime(),
								) > 15000
							) {
								await backgroundLogout({
									callback: () => {
										setProfile(null)
										setLoading(false)
										SecureStore.deleteItemAsync('userId')
									},
								})
									.then(() => {
										console.log('AuthProvider -> success')
									})
									.catch((error) => {
										console.log(
											'AuthProvider -> error',
											error,
										)
									})
									.finally(() => {
										Alert.alert(
											'Error',
											'User not found',
										)
									})
							} else {
								console.log('new user')
							}
						}
					}
				},
				async (error) => {
					console.log('AuthProvider -> error', error)
					
					await backgroundLogout({
						callback: () => {
							setUser(null)
							setProfile(null)
							setLoading(false)
							SecureStore.deleteItemAsync('userId')
						},
					})
						.then(() => {
							console.log('AuthProvider -> success')
						})
						.catch((error) => {
							console.log('AuthProvider -> error', error)
						})
				},
			)
		} else {
			setProfile(null)
			setLoading(false)
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [user, refreshUserRecord, isAttachingListener])
	
	return (
		<AuthContext.Provider value={{ loading, setLoading, user, profile, userRecord, refreshUserRecord }}>
			{children}
		</AuthContext.Provider>
	)
}

export { AuthContext, AuthProvider }
