import { createContext, useEffect, useState } from 'react'
import { Role } from '../../database/schema'
import SecureStore from 'expo-secure-store'

const ModeContext = createContext<{
	mode: string,
	setMode: (mode: string) => void
}>({
	mode: Role.PASSENGER,
	setMode: () => {
	},
})

const ModeProvider = ({ children }: { children: any }) => {
	const [mode, setMode] = useState<string>(Role.PASSENGER)
	
	useEffect(() => {
		//write to expo secure store
		(async () => {
			const role = await SecureStore.getItemAsync('role')
			if (role) {
				setMode(role)
			}
		})()
	}, [])
	
	useEffect(() => {
		//write to expo secure store
		(async () => {
			const currentRole = await SecureStore.getItemAsync('role')
			if (currentRole !== mode) {
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
