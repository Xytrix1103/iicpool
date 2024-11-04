import { get, post } from './axios_component.ts'
import { Profile } from '../components/firebase/schema.ts'

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

const updatePassword = async (id: string, data: { password: string }) => {
	try {
		return await post(`/users/${id}/updatePassword`, data).then((response) => response)
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

type UserTableRow = Profile & {
	email: string
	provider_data: ('google.com' | 'password')[]
}

export { refreshUsers, updateUser, addUser, updatePassword }
export type { UserTableRow, AddUserData, UpdateUserData }
