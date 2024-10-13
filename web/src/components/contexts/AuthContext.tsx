import { createContext } from 'react'
import { User } from 'firebase/auth'
import { Profile } from '../firebase/schema.ts'


type AuthContextType = {
	loading: boolean;
	setLoading: (loading: boolean) => void;
	user: User | null;
	profile: Profile | null;
}

const AuthContext = createContext<AuthContextType>({
	loading: true,
	setLoading: () => {
	},
	user: null,
	profile: null,
})

export { AuthContext }
