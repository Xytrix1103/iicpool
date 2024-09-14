import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import FirebaseApp from '../FirebaseApp'
import { doc, onSnapshot } from 'firebase/firestore'
import { Profile } from '../../database/schema'
import { LoadingOverlayContext } from './LoadingOverlayContext'
import { httpsCallable } from 'firebase/functions'

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
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	const [userRecord, setUserRecord] = useState<UserRecord | null>(null)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
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
		const unsubscribe = onAuthStateChanged(
			auth,
			async (newUser) => {
				if (!loading) {
					setLoadingOverlay({ show: true, message: 'Signing you in...' })
				}
				
				setUser(newUser)
			},
			(error) => {
				console.log('AuthProvider -> error', error)
				setUser(null)
			},
		)
		
		return () => {
			unsubscribe()
		}
	}, [auth])
	
	useEffect(() => {
		let unsubscribe: () => void
		
		if (user) {
			refreshUserRecord().then(r => r)
			
			unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
				if (snapshot.exists()) {
					const data = snapshot.data() as Profile
					setProfile(data)
				} else {
					setProfile(null)
					setUserRecord(null)
				}
			})
		} else {
			setProfile(null)
			setUserRecord(null)
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe()
			}
		}
	}, [user])
	
	useEffect(() => {
		if (!loading) {
			setLoadingOverlay({ show: false, message: '' })
		} else {
			setLoading(false)
		}
	}, [profile])
	
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
