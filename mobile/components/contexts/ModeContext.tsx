import { createContext, useContext, useEffect, useState } from 'react'
import { Role } from '../../database/schema'
import * as SecureStore from 'expo-secure-store'
import { and, collection, onSnapshot, or, query, where } from 'firebase/firestore'
import { AuthContext } from './AuthContext'
import FirebaseApp from '../FirebaseApp'

const ModeContext = createContext<{
	mode: Role,
	setMode: (mode: Role) => void,
	isInRide: string | null,
	setIsInRide: (isInRide: string | null) => void,
}>({
	mode: Role.PASSENGER,
	setMode: () => {
	},
	isInRide: null,
	setIsInRide: () => {
	},
})

const { db } = FirebaseApp

const ModeProvider = ({ children }: { children: any }) => {
	const [mode, setMode] = useState<Role>(Role.PASSENGER)
	const [isInRide, setIsInRide] = useState<string | null>(null)
	const { user } = useContext(AuthContext)
	const ridesQuery = query(collection(db, 'rides'), and(or(where('driver', '==', user?.uid || ''), where('passengers', 'array-contains', user?.uid || ''), where('sos.responded_by', '==', user?.uid || '')), where('completed_at', '==', null), where('cancelled_at', '==', null)))
	
	useEffect(() => {
		//write to expo secure store
		(async () => {
			const role = await SecureStore.getItemAsync('role') as Role
			
			if (role) {
				console.log('Role found', role)
				setMode(role)
			}
		})()
	}, [])
	
	useEffect(() => {
		//write to expo secure store
		(async () => {
			const currentRole = await SecureStore.getItemAsync('role')
			if (currentRole !== mode) {
				console.log('Role changed', mode)
				await SecureStore.setItemAsync('role', mode)
			}
		})()
	}, [mode])
	
	useEffect(() => {
		const unsubscribe = onSnapshot(ridesQuery, (snapshot => {
			if (snapshot.docs.length > 0) {
				setIsInRide(snapshot.docs[0].id)
				console.log('Is in ride', snapshot.docs[0].id)
				
				if (snapshot.docs[0].data().driver === user?.uid) {
					setMode(Role.DRIVER)
				} else {
					if (snapshot.docs[0].data().passengers.includes(user?.uid)) {
						setMode(Role.PASSENGER)
					} else {
						setMode(Role.DRIVER)
					}
				}
			} else {
				setIsInRide(null)
			}
		}))
		
		return () => unsubscribe()
	}, [user])
	
	useEffect(() => {
		console.log('Mode', mode)
		console.log('Is in ride', isInRide)
	}, [mode, isInRide])
	
	return (
		<ModeContext.Provider value={{ mode, setMode, isInRide, setIsInRide }}>
			{children}
		</ModeContext.Provider>
	)
}

export { ModeContext, ModeProvider }
