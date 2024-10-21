import { get, post } from './axios_component.ts'

const refreshAdmins = async (callback: (admins: AdminTableRow[]) => void) => {
	try {
		return await get<AdminTableRow[]>('/admins').then(callback)
	} catch (error) {
		console.error(error)
		return []
	}
}

const updateAdmin = async (id: string, data: UpdateAdminData) => {
	try {
		return await post(`/admins/${id}`, data).then((response) => response)
	} catch (error) {
		console.error(error)
		return null
	}
}

const addAdmin = async (data: AddAdminData) => {
	try {
		return await post('/admins', data)
	} catch (error) {
		console.error(error)
		return null
	}
}

type UpdateAdminData = {
	full_name: string
	mobile_number: string
}

type AddAdminData = UpdateAdminData & {
	password: string
	email: string
}

type AdminTableRow = {
	id: string
	full_name: string
	email: string
	mobile_number: string
}

export type { AdminTableRow, AddAdminData, UpdateAdminData }
export { refreshAdmins, updateAdmin, addAdmin }
