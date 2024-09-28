import { createContext, useEffect, useState } from 'react'
import { Role } from '../../database/schema'
import * as SecureStore from 'expo-secure-store'

const ModeContext = createContext<{
	mode: Role,
	setMode: (mode: Role) => void
}>({
	mode: Role.PASSENGER,
	setMode: () => {
	},
})

const ModeProvider = ({ children }: { children: any }) => {
	const [mode, setMode] = useState<Role>(Role.PASSENGER)
	
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
	
	return (
		<ModeContext.Provider value={{ mode, setMode }}>
			{children}
		</ModeContext.Provider>
	)
}

export { ModeContext, ModeProvider }
