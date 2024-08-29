import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import FirebaseApp from '../FirebaseApp'
import { doc, onSnapshot } from 'firebase/firestore'
import { Profile } from '../../database/schema'
import { LoadingOverlayContext } from './LoadingOverlayContext'

const AuthContext = createContext<AuthContextType>({
	loading: true,
	setLoading: () => {
	},
	user: null,
	profile: null,
})

type AuthContextType = {
	loading: boolean;
	setLoading: (loading: boolean) => void;
	user: User | null;
	profile: Profile | null;
}
const AuthProvider = ({ children }: any) => {
	const { auth, db } = FirebaseApp
	const [loading, setLoading] = useState<boolean>(true)
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	const { setLoadingOverlay } = useContext(LoadingOverlayContext)
	
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
		if (user) {
			const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
				if (snapshot.exists()) {
					const data = snapshot.data() as Profile
					setProfile(data)
				} else {
					setProfile(null)
				}
			})
			
			return () => {
				unsubscribe()
			}
		} else {
			setProfile(null)
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
		<AuthContext.Provider value={{ loading, setLoading, user, profile }}>
			{children}
		</AuthContext.Provider>
	)
}

export { AuthContext, AuthProvider }
