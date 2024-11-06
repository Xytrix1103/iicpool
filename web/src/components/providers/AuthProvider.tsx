import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, db } from '../firebase/FirebaseApp'
import { doc, onSnapshot } from 'firebase/firestore'
import { Profile } from '../firebase/schema'
import { logout } from '../../api/auth.ts'
import { AuthContext } from '../contexts/AuthContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AuthProvider = ({ children }: any) => {
	const [loading, setLoading] = useState<boolean>(true)
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	const [isAttachingListener, setIsAttachingListener] = useState<boolean>(true)
	
	useEffect(() => {
		setIsAttachingListener(true)
		
		const unsubscribe = onAuthStateChanged(
			auth,
			async (newUser) => {
				if (newUser) {
					setLoading(true)
				}
				
				setUser(newUser)
				setIsAttachingListener(false)
			},
			async (error) => {
				console.log('AuthProvider -> error', error)
				setIsAttachingListener(false)
				
				await logout({
					callback: () => {
						setUser(null)
					},
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
			unsubscribe = onSnapshot(doc(db, 'admins', user.uid),
				async (snapshot) => {
					if (snapshot.exists()) {
						setProfile(snapshot.data() as Profile)
						setLoading(false)
					} else {
						await logout({
							callback: () => {
								setUser(null)
							},
						})
					}
				},
				async (error) => {
					console.log('AuthProvider -> error', error)
					
					await logout({
						callback: () => {
							setUser(null)
							setProfile(null)
							setLoading(false)
						},
					})
				})
		} else {
			setProfile(null)
			setLoading(false)
		}
		
		return () => {
			unsubscribe?.()
		}
	}, [isAttachingListener, user])
	
	return (
		<AuthContext.Provider value={{ loading, setLoading, user, profile }}>
			{children}
		</AuthContext.Provider>
	)
}

export { AuthProvider }
