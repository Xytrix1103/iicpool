import React, { createContext, useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import FirebaseApp from '../FirebaseApp'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { Profile } from '../../database/schema'
import { httpsCallable } from 'firebase/functions'
import { Alert } from 'react-native'

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
				console.log('AuthProvider -> newUser', newUser)
				
				if (newUser) {
					console.log('auth state changed, user is not null')
					setLoading(true)
				}
				
				if (!newUser) {
					console.log('auth state changed, user is null')
					
					setUser(newUser)
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
						const lastSignInTime = new Date(
							newUser.metadata.lastSignInTime,
						)
						
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
							}, 3000)
						} else {
							console.log('old user')
							
							await getDoc(doc(db, 'users/' + newUser?.uid))
								.then((doc) => {
									if (!doc.exists()) {
										throw new Error('User not found')
									} else {
										setUser(newUser)
									}
								})
								.catch((error) => {
									console.log('AuthProvider -> error', error)
									
									auth.signOut()
										.then(() => {
											setUser(null)
										})
										.catch((error) => {
											console.log('AuthProvider -> error', error)
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
								}
							})
							.catch((error) => {
								console.log('AuthProvider -> error', error)
								
								auth.signOut()
									.then(() => {
										setUser(null)
									})
									.catch((error) => {
										console.log('AuthProvider -> error', error)
									})
							})
					}
				}
				
				setIsAttachingListener(false)
			},
			async (error) => {
				console.log('AuthProvider -> error', error)
				
				auth.signOut()
					.then(() => {
						setUser(null)
					})
					.catch((error) => {
						console.log('AuthProvider -> error', error)
					})
				
				setIsAttachingListener(false)
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
			refreshUserRecord().then(r => r)
			
			unsubscribe = onSnapshot(doc(db, 'users', user.uid),
				(snapshot) => {
					if (snapshot.exists()) {
						//account for bad internet connection by comparing last sign in time and account created time
						const data = snapshot.data() as Profile
						setProfile(data)
						setLoading(false)
					} else {
						auth.signOut()
							.then(() => {
								setProfile(null)
								setLoading(false)
							})
							.catch((error) => {
								console.log('AuthProvider -> error', error)
							})
						
						Alert.alert('Error', 'User not found')
					}
				},
				(error) => {
					console.log('AuthProvider -> error', error)
					auth.signOut()
						.then(() => {
							setUser(null)
							setProfile(null)
							setLoading(false)
						})
						.catch((error) => {
							console.log('AuthProvider -> error', error)
						})
				},
			)
		} else {
			setProfile(null)
			setUserRecord(null)
			setLoading(false)
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [user, refreshUserRecord, isAttachingListener])
	
	useEffect(() => {
		console.log('AuthProvider -> user', !!user, 'profile', profile, 'loading', loading)
	}, [user, profile, loading])
	
	return (
		<AuthContext.Provider value={{ loading, setLoading, user, profile, userRecord, refreshUserRecord }}>
			{children}
		</AuthContext.Provider>
	)
}

export { AuthContext, AuthProvider }
