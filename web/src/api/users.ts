import { get, post } from './axios_component.ts'
import { Role } from '../components/firebase/schema.ts'

const refreshUsers = async (callback: (users: UserTableRow[]) => void) => {
	try {
		return await get<UserTableRow[]>('/users').then(callback)
	} catch (error) {
		console.error(error)
		return []
	}
}

const updateUser = async (id: string, data: UpdateUserData) => {
	try {
		return await post(`/users/${id}`, data).then((response) => response)
	} catch (error) {
		console.error(error)
		return null
	}
}

const addUser = async (data: AddUserData) => {
	try {
		return await post('/users', data)
	} catch (error) {
		console.error(error)
		return null
	}
}

type UpdateUserData = {
	full_name: string
	mobile_number: string
}

type AddUserData = UpdateUserData & {
	password: string
	email: string
}

type UserTableRow = {
	id: string
	full_name: string
	email: string
	roles: Role[]
	provider_data: ('google.com' | 'password')[]
	mobile_number: string
}

export { refreshUsers, updateUser, addUser }
export type { UserTableRow, AddUserData, UpdateUserData }
