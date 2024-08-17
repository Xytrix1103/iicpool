import React, { createContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import FirebaseApp from './FirebaseApp'

const AuthContext = createContext<AuthContextType>({
	loading: true,
	user: null,
})

interface AuthContextType {
	loading: boolean;
	user: User | null;
}

const AuthProvider = ({ children }: any) => {
	const { auth } = FirebaseApp
	const [loading, setLoading] = useState<boolean>(true)
	const [user, setUser] = useState<User | null>(null)
	
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			async (newUser) => {
				console.log('AuthProvider -> newUser', newUser)
				setUser(newUser)
				setLoading(false) // Set loading to false in the success callback
			},
			(error) => {
				console.log('AuthProvider -> error', error)
				setUser(null)
				setLoading(false) // Set loading to false in the error callback
			},
		)
		
		return () => {
			unsubscribe()
		}
	}, [auth])
	
	return (
		<AuthContext.Provider value={{ loading, user }}>
			{children}
		</AuthContext.Provider>
	)
}

export { AuthContext, AuthProvider }
