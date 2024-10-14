import { get } from './axios_component.ts'
import { Role } from '../components/firebase/schema.ts'

const refreshUsers = async () => {
	try {
		return await get<UserTableRow[]>('/users')
	} catch (error) {
		console.error(error)
		return []
	}
}

type UserTableRow = {
	id: string
	full_name: string
	email: string
	roles: Role[]
	provider_data: ('google.com' | 'password')[]
	mobile_number: string
}

export { refreshUsers }
export type { UserTableRow }
