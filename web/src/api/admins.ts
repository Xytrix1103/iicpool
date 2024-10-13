import { get } from './axios_component.ts'

const refreshAdmins = async () => {
	try {
		return await get<AdminTableRow[]>('/admins')
	} catch (error) {
		console.error(error)
		return []
	}
}

type AdminTableRow = {
	uid: string
	full_name: string
	email: string
	mobile_number: string
}

export type { AdminTableRow }
export { refreshAdmins }
