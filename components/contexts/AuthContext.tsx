import React, { createContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import FirebaseApp from '../FirebaseApp'
import { doc, onSnapshot } from 'firebase/firestore'
import { Profile } from '../../database/schema'

const AuthContext = createContext<AuthContextType>({
	loading: true,
	user: null,
	profile: null,
})

type AuthContextType = {
	loading: boolean;
	user: User | null;
	profile: Profile | null;
}
const AuthProvider = ({ children }: any) => {
	const { auth, db } = FirebaseApp
	const [loading, setLoading] = useState<boolean>(true)
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			async (newUser) => {
				console.log('AuthProvider -> newUser', newUser)
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
		setLoading(false)
	}, [user, profile])
	
	return (
		<AuthContext.Provider value={{ loading, user, profile }}>
			{children}
		</AuthContext.Provider>
	)
}

export { AuthContext, AuthProvider }
