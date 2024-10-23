import { Car, Profile } from '../components/firebase/schema.ts'
import { get } from './axios_component.ts'

const refreshCars = async (callback?: (admins: CarTableRow[]) => void) => {
	try {
		return await get<CarTableRow[]>('/cars').then(callback ? callback : (cars) => cars)
	} catch (error) {
		console.error(error)
		return []
	}
}

type CarTableRow = Car & {
	ownerData: Profile,
}

export {
	refreshCars,
}
export type {
	CarTableRow,
}