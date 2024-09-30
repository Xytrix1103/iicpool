import FirebaseApp from '../components/FirebaseApp'
import { Profile } from '../database/schema'
import { doc, getDoc } from 'firebase/firestore'

const { db } = FirebaseApp

const getPassengers = async (rideId: string): Promise<(Profile | null)[]> => {
	const passengers: (Profile | null)[] = []
	
	const snapshot = await getDoc(doc(db, 'rides', rideId))
	if (snapshot.exists()) {
		const diff = snapshot.data()?.available_seats - snapshot.data()?.passengers.length
		
		for (const passenger of snapshot.data()?.passengers) {
			passengers.push(await getDoc(doc(db, 'users', passenger)).then((result) => {
				if (result.exists()) {
					return {
						...result.data(),
						id: result.id,
					} as Profile
				} else {
					return null
				}
			}))
		}
		
		if (diff > 0) {
			for (let i = 0; i < diff; i++) {
				passengers.push(null)
			}
		}
	}
	
	return passengers
}

export {
	getPassengers,
}
