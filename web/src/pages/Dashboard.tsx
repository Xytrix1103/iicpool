import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../components/firebase/FirebaseApp.tsx'
import { Ride, Role } from '../components/firebase/schema.ts'
import OverallStat from '../components/themed/components/OverallStat.tsx'
import { Separator } from '../components/themed/ui-kit/separator.tsx'
import { QueryDocumentSnapshot, Timestamp } from '@firebase/firestore'

type UserStatistics = {
	total_users: number
}

type AdminStatistics = {
	total_admins: number
}

type RideStatistics = {
	ongoing: number
	completed: number
	cancelled: number
	sos_triggered: number
	sos_ongoing: number
}

const Dashboard = () => {
	const [userStatistics, setUserStatistics] = useState<UserStatistics>({
		total_users: 0,
	})
	const [adminStatistics, setAdminStatistics] = useState<AdminStatistics>({
		total_admins: 0,
	})
	const [rideStatistics, setRideStatistics] = useState<RideStatistics>({
		ongoing: 0,
		completed: 0,
		cancelled: 0,
		sos_triggered: 0,
		sos_ongoing: 0,
	})

	useEffect(() => {
		const unsubscribeFuncs: (() => void)[] = []

		unsubscribeFuncs.push(onSnapshot(collection(db, 'users'), (snapshot) => {
			setUserStatistics({
				total_users: snapshot.docs.filter((doc) => doc.data().roles.includes(Role.PASSENGER)).length,
			})
		}))

		unsubscribeFuncs.push(onSnapshot(collection(db, 'admins'), (snapshot) => {
			setAdminStatistics({
				total_admins: snapshot.docs.length || 0,
			})
		}))

		unsubscribeFuncs.push(onSnapshot(query(collection(db, 'rides'), where('datetime', '>=', Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))))), (snapshot) => {
			const todayRides = snapshot.docs as QueryDocumentSnapshot<Ride>[]

			setRideStatistics({
				ongoing: todayRides.filter((doc) => {
					const data = doc.data()
					return data.started_at !== null && data.completed_at === null && data.sos?.triggered_at === null
				}).length,
				sos_triggered: todayRides.filter((doc) => {
					const data = doc.data()
					return data.sos?.triggered_at !== null && data.sos?.responded_at === null
				}).length,
				completed: todayRides.filter((doc) => {
					const data = doc.data()
					return data.completed_at !== null
				}).length,
				cancelled: todayRides.filter((doc) => {
					const data = doc.data()
					return data.cancelled_at !== null
				}).length,
				sos_ongoing: todayRides.filter((doc) => {
					const data = doc.data()
					return data.sos?.responded_at !== null && data.sos?.started_at === null && data.completed_at === null
				}).length,
			})
		}))

		return () => {
			unsubscribeFuncs.forEach((unsubscribe) => unsubscribe())
		}
	}, [])

	return (
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<div className="pt-1 pb-8 flex flex-col gap-4">
				<div className="border border-input rounded-3xl backdrop-blur bg-white/[.4] flex">
					<div className="px-4 py-2 flex items-center gap-2.5">
						<OverallStat status_text="Date" flex number={new Date().toLocaleDateString()} />
						<OverallStat status_text="Users" number={userStatistics.total_users} />
						<OverallStat status_text="Admins" number={adminStatistics.total_admins} />
					</div>
					<div>
						<Separator orientation="vertical" />
					</div>
					<div className="px-4 py-2 flex items-center gap-2.5">
						<OverallStat status_text="Cancelled" color="yellow"
									 number={rideStatistics.cancelled} />
						<OverallStat status_text="Ongoing" color="blue"
									 number={rideStatistics.ongoing} />
						<OverallStat status_text="Completed" color="green"
									 number={rideStatistics.completed} />
						<OverallStat status_text="SOS Triggered" color="red"
									 number={rideStatistics.sos_triggered} />
						<OverallStat status_text="SOS Ongoing" color="red"
									 number={rideStatistics.sos_ongoing} />
					</div>
				</div>
			</div>
		</section>
	)
}

export default Dashboard
