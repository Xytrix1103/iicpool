import { useEffect, useRef, useState } from 'react'
import { collection, collectionGroup, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../components/firebase/FirebaseApp.tsx'
import { Car, Message, MessageType, Profile, Ride } from '../components/firebase/schema.ts'
import OverallStat from '../components/themed/components/OverallStat.tsx'
import { Separator } from '../components/themed/ui-kit/separator.tsx'
import { QueryDocumentSnapshot } from '@firebase/firestore'
import { Chart } from 'primereact/chart'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../components/themed/ui-kit/dropdown-menu.tsx'
import { Button } from '../components/themed/ui-kit/button.tsx'
import { ChevronDownIcon } from 'lucide-react'
import { ScrollArea } from '../components/themed/ui-kit/scroll-area.tsx'
import { Link } from 'react-router-dom'

type CustomMessage = Message & {
	userData: Profile
	driverData: Profile
	carData: Car
	ride_id: string
}

interface RideStatistics {
	ongoing: number
	today_ongoing: number
	completed: number
	today_completed: number
	cancelled: number
	today_cancelled: number
	sos_triggered: number
	today_sos_triggered: number
	sos_responded: number
	today_sos_responded: number
	sos_ongoing: number
	today_sos_ongoing: number
	today_arrived_cars: number
	today_departed_cars: number
}

enum WeekChartFilter {
	LIFETIME = 'lifetime',
	YEAR = 'year',
	MONTH = 'month',
}

type YearlyWeekChartValue = {
	year: number
}

type MonthlyWeekChartValue = {
	year: number
	month: number
}

type WeekChartFilterProps = {
	type: WeekChartFilter
	values?: (YearlyWeekChartValue | MonthlyWeekChartValue | undefined)[]
	value?: (YearlyWeekChartValue | MonthlyWeekChartValue)
}

type DayTimeChartFilterProps = {
	type: WeekChartFilter
	weekday: number
	values?: (YearlyWeekChartValue | MonthlyWeekChartValue | undefined)[]
	value?: (YearlyWeekChartValue | MonthlyWeekChartValue)
}

type DayTimeChartData = {
	to: { [key in 1 | 2 | 3 | 4 | 5]: number[] },
	from: { [key in 1 | 2 | 3 | 4 | 5]: number[] }
}

const CurrentTimeComponent = () => {
	const [currentTime, setCurrentTime] = useState(new Date())
	
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date())
		}, 1000)
		return () => {
			clearInterval(timer)
		}
	}, [])
	
	return (
		<OverallStat flex status_text={`Today: ${currentTime.toLocaleDateString()}`}
		             number={currentTime.toLocaleTimeString()} />
	)
}

const Dashboard = () => {
	const [rideStatistics, setRideStatistics] = useState<RideStatistics>({
		ongoing: 0,
		today_ongoing: 0,
		completed: 0,
		today_completed: 0,
		cancelled: 0,
		today_cancelled: 0,
		sos_triggered: 0,
		today_sos_triggered: 0,
		sos_responded: 0,
		today_sos_responded: 0,
		sos_ongoing: 0,
		today_sos_ongoing: 0,
		today_arrived_cars: 0,
		today_departed_cars: 0,
	})
	const [rides, setRides] = useState<Ride[]>([])
	const [weekChartFilter, setWeekChartFilter] = useState<WeekChartFilterProps>({
		type: WeekChartFilter.LIFETIME,
	})
	const [weekChartData, setWeekChartData] = useState<{ to: number[], from: number[] }>({
		to: [],
		from: [],
	})
	const [dayTimeChartFilter, setDayTimeChartFilter] = useState<DayTimeChartFilterProps>({
		type: WeekChartFilter.LIFETIME,
		weekday: 1,
	})
	const nowRef = useRef(new Date())
	const [dayTimeChartData, setDayTimeChartData] = useState<DayTimeChartData>({
		to: {
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
		},
		from: {
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
		},
	})
	const [rideLogs, setRideLogs] = useState<CustomMessage[]>([])
	const [today, setToday] = useState(nowRef.current.toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }))
	
	useEffect(() => {
		const timer = setInterval(() => {
			const newDateString = nowRef.current.toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })
			if (newDateString !== today) {
				setToday(newDateString)
			}
		}, 1000)
		return () => {
			clearInterval(timer)
		}
	}, [today])
	
	useEffect(() => {
		const unsubscribeFuncs: (() => void)[] = []
		
		unsubscribeFuncs.push(onSnapshot(query(collection(db, 'rides')), (snapshot) => {
			const allRides = snapshot.docs as QueryDocumentSnapshot<Ride>[]
			
			setRides(allRides.map((doc) => {
				return { ...doc.data(), id: doc.id } as Ride
			}))
		}))
		
		// 	const weekChartFilterValues = weekChartFilter.type === WeekChartFilter.LIFETIME ? undefined : allRides.map((doc) => {
		// 		const datetimeDate = new Date(doc.data().datetime.toDate())
		// 		const year = datetimeDate.getFullYear()
		// 		const month = datetimeDate.getMonth()
		//
		// 		if (weekChartFilter.type === WeekChartFilter.YEAR) {
		// 			return { year } as YearlyWeekChartValue
		// 		} else if (weekChartFilter.type === WeekChartFilter.MONTH) {
		// 			return { year, month } as MonthlyWeekChartValue
		// 		}
		// 	})
		//
		// 	//only get unique values
		// 	const values = weekChartFilterValues ? Array.from(new Set(weekChartFilterValues.map(value => JSON.stringify(value)))).map(value => JSON.parse(value)) : undefined
		//
		// 	const value = values && values.length > 0 ? values[0] : undefined
		//
		// 	setWeekChartFilter((prev) => ({
		// 		...prev,
		// 		values,
		// 		value,
		// 	}))
		//
		// 	setDayTimeChartFilter((prev) => ({
		// 		...prev,
		// 		values,
		// 		value,
		// 	}))
		//
		// 	const dayOfWeekCountTo = Array(5).fill(0)
		// 	const dayOfWeekCountFrom = Array(5).fill(0)
		//
		// 	if (weekChartFilter.type !== WeekChartFilter.LIFETIME && !weekChartFilter.values && !weekChartFilter.value) {
		// 		return
		// 	}
		//
		// 	const weekChartFilteredRides = allRides.filter((doc) => {
		// 		const datetimeDate = new Date(doc.data().datetime.toDate())
		// 		const year = datetimeDate.getFullYear()
		// 		const month = datetimeDate.getMonth()
		//
		// 		if (weekChartFilter.type === WeekChartFilter.LIFETIME) {
		// 			return doc.data().cancelled_at === null
		// 		} else if (weekChartFilter.type === WeekChartFilter.YEAR) {
		// 			return year === (weekChartFilter.value as YearlyWeekChartValue).year && doc.data().cancelled_at === null
		// 		} else if (weekChartFilter.type === WeekChartFilter.MONTH) {
		// 			return year === (weekChartFilter.value as MonthlyWeekChartValue).year &&
		// 				month === (weekChartFilter.value as MonthlyWeekChartValue).month && doc.data().cancelled_at === null
		// 		}
		// 	})
		//
		// 	// get the day of the week for each ride
		// 	const dayOfWeek = weekChartFilteredRides.map((doc) => {
		// 		return {
		// 			day: new Date(doc.data().datetime.toDate()).getDay(),
		// 			direction: doc.data().to_campus ? 'to' : 'from',
		// 		}
		// 	})
		//
		// 	// count the number of rides for each day of the week except Sunday (0) and Saturday (6)
		// 	dayOfWeek.forEach(({ day, direction }) => {
		// 		if (day !== 0 && day !== 6) {
		// 			if (direction === 'to') {
		// 				dayOfWeekCountTo[day - 1]++
		// 			} else {
		// 				dayOfWeekCountFrom[day - 1]++
		// 			}
		// 		}
		// 	})
		//
		// 	console.log(dayOfWeekCountTo)
		// 	console.log(dayOfWeekCountFrom)
		//
		// 	//fill in the days that have no rides with 0
		// 	for (let i = 1; i <= 5; i++) {
		// 		if (dayOfWeekCountTo[i] === 0) {
		// 			dayOfWeekCountTo[i] = 0
		// 		}
		// 		if (dayOfWeekCountFrom[i] === 0) {
		// 			dayOfWeekCountFrom[i] = 0
		// 		}
		// 	}
		//
		// 	console.log(dayOfWeekCountTo)
		//
		// 	const scheduleTimes: DayTimeChartData = {
		// 		to: {
		// 			1: Array(14).fill(0),
		// 			2: Array(14).fill(0),
		// 			3: Array(14).fill(0),
		// 			4: Array(14).fill(0),
		// 			5: Array(14).fill(0),
		// 		},
		// 		from: {
		// 			1: Array(14).fill(0),
		// 			2: Array(14).fill(0),
		// 			3: Array(14).fill(0),
		// 			4: Array(14).fill(0),
		// 			5: Array(14).fill(0),
		// 		},
		// 	}
		//
		// 	const dayTimeChartFilteredRides = allRides.filter((doc) => {
		// 		const datetimeDate = new Date(doc.data().datetime.toDate())
		// 		const year = datetimeDate.getFullYear()
		// 		const month = datetimeDate.getMonth()
		//
		// 		if (dayTimeChartFilter.type === WeekChartFilter.LIFETIME) {
		// 			return doc.data().cancelled_at === null
		// 		} else if (dayTimeChartFilter.type === WeekChartFilter.YEAR) {
		// 			return year === (weekChartFilter.value as YearlyWeekChartValue).year && doc.data().cancelled_at === null
		// 		} else if (dayTimeChartFilter.type === WeekChartFilter.MONTH) {
		// 			return year === (dayTimeChartFilter.value as MonthlyWeekChartValue).year &&
		// 				month === (dayTimeChartFilter.value as MonthlyWeekChartValue).month && doc.data().cancelled_at === null
		// 		}
		// 	})
		//
		// 	const x_steps = Array(14).fill(0).map((_, i) => i + 6)
		//
		// 	dayTimeChartFilteredRides.forEach((doc) => {
		// 		const datetimeDate = new Date(doc.data().datetime.toDate())
		// 		const time = datetimeDate.getHours()
		// 		const weekday = datetimeDate.getDay()
		//
		// 		if ([1, 2, 3, 4, 5].includes(weekday)) {
		// 			if (x_steps.indexOf(time) === -1) {
		// 				return
		// 			}
		//
		// 			if (doc.data().to_campus) {
		// 				console.log('Ride to campus is on the weekday: ', weekday)
		// 				scheduleTimes.to[weekday as 1 | 2 | 3 | 4 | 5][x_steps.indexOf(time)]++
		// 			} else {
		// 				console.log('Ride from campus is on the weekday: ', weekday)
		// 				scheduleTimes.from[weekday as 1 | 2 | 3 | 4 | 5][x_steps.indexOf(time)]++
		// 			}
		// 		}
		// 	})
		//
		// 	console.log(scheduleTimes)
		//
		// 	setDayTimeChartData(scheduleTimes)
		//
		// 	setWeekChartData({
		// 		to: dayOfWeekCountTo,
		// 		from: dayOfWeekCountFrom,
		// 	})
		//
		// 	const rideStats = allRides.reduce((stats, doc) => {
		// 		const data = doc.data()
		// 		const datetimeDate = new Date(data.datetime.toDate())
		// 		const isToday = datetimeDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }) === today
		//
		// 		if (data.started_at !== null && data.completed_at === null && data.sos?.triggered_at === null) {
		// 			stats.ongoing++
		// 			if (isToday) stats.today_ongoing++
		// 		}
		// 		if (data.sos?.triggered_at !== null && data.sos?.responded_at === null) {
		// 			stats.sos_triggered++
		// 			if (isToday) stats.today_sos_triggered++
		// 		}
		// 		if (data.sos?.responded_at !== null && data.sos?.started_at === null) {
		// 			stats.sos_responded++
		// 			if (isToday) stats.today_sos_responded++
		// 		}
		// 		if (data.completed_at !== null) {
		// 			stats.completed++
		// 			if (isToday) stats.today_completed++
		// 			if (data.to_campus) {
		// 				stats.today_arrived_cars++
		// 			} else {
		// 				stats.today_departed_cars++
		// 			}
		// 		}
		// 		if (data.cancelled_at !== null) {
		// 			stats.cancelled++
		// 			if (isToday) stats.today_cancelled++
		// 		}
		// 		if (data.sos?.responded_at !== null && data.sos?.started_at === null && data.completed_at === null) {
		// 			stats.sos_ongoing++
		// 			if (isToday) stats.today_sos_ongoing++
		// 		}
		//
		// 		return stats
		// 	}, {
		// 		ongoing: 0,
		// 		today_ongoing: 0,
		// 		completed: 0,
		// 		today_completed: 0,
		// 		cancelled: 0,
		// 		today_cancelled: 0,
		// 		sos_triggered: 0,
		// 		today_sos_triggered: 0,
		// 		sos_responded: 0,
		// 		today_sos_responded: 0,
		// 		sos_ongoing: 0,
		// 		today_sos_ongoing: 0,
		// 		today_arrived_cars: 0,
		// 		today_departed_cars: 0,
		// 	})
		//
		// 	setRideStatistics(rideStats)
		// }))
		
		return () => {
			unsubscribeFuncs.forEach((unsubscribe) => unsubscribe())
		}
	}, [today])
	
	useEffect(() => {
		// perform the filtering and counting of rides for the week chart
		const weekChartFilterValues = weekChartFilter.type === WeekChartFilter.LIFETIME ? undefined : rides.map((ride) => {
			const datetimeDate = new Date(ride.datetime.toDate())
			const year = datetimeDate.getFullYear()
			const month = datetimeDate.getMonth()
			
			if (weekChartFilter.type === WeekChartFilter.YEAR) {
				return { year } as YearlyWeekChartValue
			} else if (weekChartFilter.type === WeekChartFilter.MONTH) {
				return { year, month } as MonthlyWeekChartValue
			}
		})
		
		//only get unique values
		const values = weekChartFilterValues ? Array.from(new Set(weekChartFilterValues.map(value => JSON.stringify(value)))).map(value => JSON.parse(value)) : undefined
		
		const value = values && values.length > 0 ? values[0] : undefined
		
		setWeekChartFilter((prev) => ({
			...prev,
			values,
			value,
		}))
	}, [rides, weekChartFilter.type])
	
	useEffect(() => {
		// perform the filtering and counting of rides for the day time chart
		const dayTimeChartFilterValues = dayTimeChartFilter.type === WeekChartFilter.LIFETIME ? undefined : rides.map((ride) => {
			const datetimeDate = new Date(ride.datetime.toDate())
			const year = datetimeDate.getFullYear()
			const month = datetimeDate.getMonth()
			
			if (dayTimeChartFilter.type === WeekChartFilter.YEAR) {
				return { year } as YearlyWeekChartValue
			} else if (dayTimeChartFilter.type === WeekChartFilter.MONTH) {
				return { year, month } as MonthlyWeekChartValue
			}
		})
		
		//only get unique values
		const values = dayTimeChartFilterValues ? Array.from(new Set(dayTimeChartFilterValues.map(value => JSON.stringify(value)))).map(value => JSON.parse(value)) : undefined
		
		const value = values && values.length > 0 ? values[0] : undefined
		
		setDayTimeChartFilter((prev) => ({
			...prev,
			values,
			value,
		}))
	}, [rides, dayTimeChartFilter.type])
	
	useEffect(() => {
		// update data for the week chart when the filter changes
		const dayOfWeekCountTo = Array(5).fill(0)
		const dayOfWeekCountFrom = Array(5).fill(0)
		
		if (weekChartFilter.type !== WeekChartFilter.LIFETIME && !weekChartFilter.values && !weekChartFilter.value) {
			return
		}
		
		const weekChartFilteredRides = rides.filter((ride) => {
			const datetimeDate = new Date(ride.datetime.toDate())
			const year = datetimeDate.getFullYear()
			const month = datetimeDate.getMonth()
			
			if (weekChartFilter.type === WeekChartFilter.LIFETIME) {
				return ride.cancelled_at === null
			} else if (weekChartFilter.type === WeekChartFilter.YEAR) {
				return year === (weekChartFilter.value as YearlyWeekChartValue).year && ride.cancelled_at === null
			} else if (weekChartFilter.type === WeekChartFilter.MONTH) {
				return year === (weekChartFilter.value as MonthlyWeekChartValue).year &&
					month === (weekChartFilter.value as MonthlyWeekChartValue).month && ride.cancelled_at === null
			}
		})
		
		// get the day of the week for each ride
		const dayOfWeek = weekChartFilteredRides.map((ride) => {
			return {
				day: new Date(ride.datetime.toDate()).getDay(),
				direction: ride.to_campus ? 'to' : 'from',
			}
		})
		
		// count the number of rides for each day of the week except Sunday (0) and Saturday (6)
		dayOfWeek.forEach(({ day, direction }) => {
			if (day !== 0 && day !== 6) {
				if (direction === 'to') {
					dayOfWeekCountTo[day - 1]++
				} else {
					dayOfWeekCountFrom[day - 1]++
				}
			}
		})
		
		//fill in the days that have no rides with 0
		for (let i = 1; i <= 5; i++) {
			if (dayOfWeekCountTo[i] === 0) {
				dayOfWeekCountTo[i] = 0
			}
			if (dayOfWeekCountFrom[i] === 0) {
				dayOfWeekCountFrom[i] = 0
			}
		}
		
		setWeekChartData({
			to: dayOfWeekCountTo,
			from: dayOfWeekCountFrom,
		})
	}, [rides, weekChartFilter])
	
	useEffect(() => {
		// update data for the day time chart when the filter changes
		const scheduleTimes: DayTimeChartData = {
			to: {
				1: Array(14).fill(0),
				2: Array(14).fill(0),
				3: Array(14).fill(0),
				4: Array(14).fill(0),
				5: Array(14).fill(0),
			},
			from: {
				1: Array(14).fill(0),
				2: Array(14).fill(0),
				3: Array(14).fill(0),
				4: Array(14).fill(0),
				5: Array(14).fill(0),
			},
		}
		
		if (dayTimeChartFilter.type !== WeekChartFilter.LIFETIME && !dayTimeChartFilter.values && !dayTimeChartFilter.value) {
			return
		}
		
		const dayTimeChartFilteredRides = rides.filter((ride) => {
			const datetimeDate = new Date(ride.datetime.toDate())
			const year = datetimeDate.getFullYear()
			const month = datetimeDate.getMonth()
			
			if (dayTimeChartFilter.type === WeekChartFilter.LIFETIME) {
				return ride.cancelled_at === null
			} else if (dayTimeChartFilter.type === WeekChartFilter.YEAR) {
				return year === (dayTimeChartFilter.value as YearlyWeekChartValue).year && ride.cancelled_at === null
			} else if (dayTimeChartFilter.type === WeekChartFilter.MONTH) {
				return year === (dayTimeChartFilter.value as MonthlyWeekChartValue).year &&
					month === (dayTimeChartFilter.value as MonthlyWeekChartValue).month && ride.cancelled_at === null
			}
		})
		
		const x_steps = Array(14).fill(0).map((_, i) => i + 6)
		
		dayTimeChartFilteredRides.forEach((ride) => {
			const datetimeDate = new Date(ride.datetime.toDate())
			const time = datetimeDate.getHours()
			const weekday = datetimeDate.getDay()
			
			if ([1, 2, 3, 4, 5].includes(weekday)) {
				if (x_steps.indexOf(time) === -1) {
					return
				}
				
				if (ride.to_campus) {
					scheduleTimes.to[weekday as 1 | 2 | 3 | 4 | 5][x_steps.indexOf(time)]++
				} else {
					scheduleTimes.from[weekday as 1 | 2 | 3 | 4 | 5][x_steps.indexOf(time)]++
				}
			}
		})
		
		setDayTimeChartData(scheduleTimes)
	}, [rides, dayTimeChartFilter])
	
	useEffect(() => {
		const rideStats = rides.reduce((stats, ride) => {
			const datetimeDate = new Date(ride.datetime.toDate())
			const isToday = datetimeDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }) === today
			
			if (ride.started_at !== null && ride.completed_at === null && ride.sos?.triggered_at === null) {
				stats.ongoing++
				if (isToday) stats.today_ongoing++
			}
			if (ride.sos?.triggered_at !== null && ride.sos?.responded_at === null) {
				stats.sos_triggered++
				if (isToday) stats.today_sos_triggered++
			}
			if (ride.sos?.responded_at !== null && ride.sos?.started_at === null) {
				stats.sos_responded++
				if (isToday) stats.today_sos_responded++
			}
			if (ride.completed_at !== null) {
				stats.completed++
				if (isToday) stats.today_completed++
				if (ride.to_campus) {
					stats.today_arrived_cars++
				} else {
					stats.today_departed_cars++
				}
			}
			if (ride.cancelled_at !== null) {
				stats.cancelled++
				if (isToday) stats.today_cancelled++
			}
			if (ride.sos?.responded_at !== null && ride.sos?.started_at === null && ride.completed_at === null) {
				stats.sos_ongoing++
				if (isToday) stats.today_sos_ongoing++
			}
			
			return stats
		}, {
			ongoing: 0,
			today_ongoing: 0,
			completed: 0,
			today_completed: 0,
			cancelled: 0,
			today_cancelled: 0,
			sos_triggered: 0,
			today_sos_triggered: 0,
			sos_responded: 0,
			today_sos_responded: 0,
			sos_ongoing: 0,
			today_sos_ongoing: 0,
			today_arrived_cars: 0,
			today_departed_cars: 0,
		})
		
		setRideStatistics(rideStats)
	}, [rides, today])
	
	useEffect(() => {
		const unsubscribeFuncs: (() => void)[] = []
		
		unsubscribeFuncs.push(onSnapshot(query(collectionGroup(db, 'messages'), where('type', '!=', MessageType.MESSAGE), orderBy('timestamp', 'desc')), async (snapshot) => {
			const tempRideLogs: CustomMessage[] = await Promise.all(snapshot.docs.map(async (snapshotDoc) => {
				const data = { ...snapshotDoc.data(), id: snapshotDoc.id } as Message
				
				const parentRide = (await getDoc(snapshotDoc.ref.parent.parent!)).data() as Ride
				
				const driverData = await getDoc(doc(db, 'users', parentRide.sos?.responded_by ? parentRide.sos?.responded_by : parentRide.driver)).then((doc) => {
					return {
						...doc.data(),
						id: doc.id,
					} as Profile
				})
				
				const userData = (!data.user && !data.sender) ? undefined : await getDoc(doc(db, 'users', (data.type === MessageType.MESSAGE ? data.sender : data.user) as string)).then((doc) => {
					return {
						...doc.data(),
						id: doc.id,
					} as Profile
				})
				
				const carData = await getDoc(doc(db, 'cars', parentRide.sos?.car ? parentRide.sos?.car : parentRide.car)).then((doc) => {
					return {
						...doc.data(),
						id: doc.id,
					} as Car
				})
				
				return {
					...data,
					userData,
					carData,
					ride_id: snapshotDoc.ref.parent.parent?.id || '',
					driverData,
				} as CustomMessage
			}))
			
			setRideLogs(tempRideLogs.filter((log) => log !== null))
		}))
		
		return () => {
			unsubscribeFuncs.forEach((unsubscribe) => unsubscribe())
		}
	}, [])
	
	return (
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<div className="flex flex-col gap-4">
				<div className="border border-input rounded-3xl backdrop-blur bg-white/[.4] flex">
					<div className="p-[0.5rem] flex items-center gap-2.5">
						<CurrentTimeComponent />
					</div>
					<div>
						<Separator orientation="vertical" />
					</div>
					<div className="p-[0.5rem] flex items-center gap-2.5">
						<OverallStat status_text="Cancelled" color="yellow"
						             number={rideStatistics.cancelled}
						             subtitle={`(${rideStatistics.today_cancelled} today)`} />
						<OverallStat status_text="Ongoing" color="blue"
						             number={rideStatistics.ongoing}
						             subtitle={`(${rideStatistics.today_ongoing} today)`} />
						<OverallStat status_text="Completed" color="green"
						             number={rideStatistics.completed}
						             subtitle={`(${rideStatistics.today_completed} today)`} />
						<OverallStat status_text="SOS Triggered" color="red"
						             number={rideStatistics.sos_triggered}
						             subtitle={`(${rideStatistics.today_sos_triggered} today)`} />
						<OverallStat status_text="SOS Responded" color="red"
						             number={rideStatistics.sos_responded}
						             subtitle={`(${rideStatistics.today_sos_responded} today)`} />
						<OverallStat status_text="SOS Ongoing" color="red"
						             number={rideStatistics.sos_ongoing}
						             subtitle={`(${rideStatistics.today_sos_ongoing} today)`} />
					</div>
				</div>
				<div className="flex gap-[1rem]">
					<div
						className="flex-1 border border-input rounded-3xl backdrop-blur bg-white/[.4] p-[1rem] flex-col flex gap-[1rem] h-auto">
						<div className="text-lg font-bold">Weekly Statistics</div>
						<div className="flex flex-row items-center gap-[2rem]">
							<div className="w-auto flex-row flex items-center gap-[0.5rem] text-sm">
								Filter By:
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="px-3.5 py-1">
											<div className="flex gap-1.5 items-center">
												<div
													className="text-sm">{weekChartFilter.type[0].toUpperCase() + weekChartFilter.type.slice(1)}</div>
												<ChevronDownIcon size={14} color="#303030" />
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{Object.values(WeekChartFilter).map((filter) => (
											<DropdownMenuItem
												key={filter}
												onSelect={() => setWeekChartFilter((prev) => ({
													...prev,
													type: filter,
												}))}
											>
												{filter[0].toUpperCase() + filter.slice(1)}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="w-auto flex-row flex items-center gap-[0.5rem] text-sm">
								{
									weekChartFilter.type === WeekChartFilter.YEAR || weekChartFilter.type === WeekChartFilter.MONTH ? (
										weekChartFilter.values && weekChartFilter.values.length > 0 ? (
											<>
												Year:
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="outline" className="px-3.5 py-1">
															<div className="flex gap-1.5 items-center">
																<div className="text-sm">
																	{weekChartFilter.value?.year}
																</div>
																<ChevronDownIcon size={14} color="#303030" />
															</div>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent>
														{weekChartFilter.values.map((value) => (
															<DropdownMenuItem
																key={(value as YearlyWeekChartValue).year}
																onSelect={() => setWeekChartFilter((prev) => ({
																	...prev,
																	value,
																}))}
															>
																{(value as YearlyWeekChartValue).year}
															</DropdownMenuItem>
														))}
													</DropdownMenuContent>
												</DropdownMenu>
												{
													weekChartFilter.type === WeekChartFilter.MONTH ? (
														<>
															Month:
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="outline" className="px-3.5 py-1">
																		<div className="flex gap-1.5 items-center">
																			<div className="text-sm">
																				{(weekChartFilter.value as MonthlyWeekChartValue).month + 1}
																			</div>
																			<ChevronDownIcon size={14}
																			                 color="#303030" />
																		</div>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent>
																	{weekChartFilter.values.map((value) => (
																		<DropdownMenuItem
																			key={(value as MonthlyWeekChartValue).month}
																			onSelect={() => setWeekChartFilter((prev) => ({
																				...prev,
																				value,
																			}))}
																		>
																			{(value as MonthlyWeekChartValue).month + 1}
																		</DropdownMenuItem>
																	))}
																</DropdownMenuContent>
															</DropdownMenu>
														</>
													) : null
												}
											</>
										) : null
									) : null
								}
							</div>
						</div>
						<Chart
							className="w-full h-[20rem]"
							type="line"
							data={{
								labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
								datasets: [
									{
										label: 'To Campus',
										data: weekChartData.to,
										borderColor: 'darkred',
									},
									{
										label: 'From Campus',
										data: weekChartData.from,
										borderColor: 'darkblue',
									},
								],
							}}
							options={{
								maintainAspectRatio: false,
								scales: {
									y: {
										ticks: {
											callback: function(value: unknown) {
												// @ts-expect-error value is unknown
												return Number.isInteger(value) && value >= 0 ? value : null
											},
										},
									},
								},
							}}
						/>
					</div>
					<div
						className="flex-1 border border-input rounded-3xl backdrop-blur bg-white/[.4] p-[1rem] flex-col flex gap-[1rem]">
						<div className="text-lg font-bold">Daily Time Statistics</div>
						<div className="flex flex-row items-center gap-[2rem]">
							<div className="w-auto flex-row flex items-center gap-[0.5rem] text-sm">
								Filter By:
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="px-3.5 py-1">
											<div className="flex gap-1.5 items-center">
												<div
													className="text-sm">{dayTimeChartFilter.type[0].toUpperCase() + dayTimeChartFilter.type.slice(1)}</div>
												<ChevronDownIcon size={14} color="#303030" />
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{Object.values(WeekChartFilter).map((filter) => (
											<DropdownMenuItem
												key={filter}
												onSelect={() => setDayTimeChartFilter((prev) => ({
													...prev,
													type: filter,
												}))}
											>
												{filter[0].toUpperCase() + filter.slice(1)}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="w-auto flex-row flex items-center gap-[0.5rem] text-sm">
								{
									dayTimeChartFilter.type === WeekChartFilter.YEAR || dayTimeChartFilter.type === WeekChartFilter.MONTH ? (
										dayTimeChartFilter.values && dayTimeChartFilter.values.length > 0 ? (
											<>
												Year:
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="outline" className="px-3.5 py-1">
															<div className="flex gap-1.5 items-center">
																<div className="text-sm">
																	{dayTimeChartFilter.value?.year}
																</div>
																<ChevronDownIcon size={14} color="#303030" />
															</div>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent>
														{dayTimeChartFilter.values.map((value) => (
															<DropdownMenuItem
																key={(value as YearlyWeekChartValue).year}
																onSelect={() => setDayTimeChartFilter((prev) => ({
																	...prev,
																	value,
																}))}
															>
																{(value as YearlyWeekChartValue).year}
															</DropdownMenuItem>
														))}
													</DropdownMenuContent>
												</DropdownMenu>
												{
													dayTimeChartFilter.type === WeekChartFilter.MONTH ? (
														<>
															Month:
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="outline" className="px-3.5 py-1">
																		<div className="flex gap-1.5 items-center">
																			<div className="text-sm">
																				{(dayTimeChartFilter.value as MonthlyWeekChartValue).month + 1}
																			</div>
																			<ChevronDownIcon size={14}
																			                 color="#303030" />
																		</div>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent>
																	{dayTimeChartFilter.values.map((value) => (
																		<DropdownMenuItem
																			key={(value as MonthlyWeekChartValue).month}
																			onSelect={() => setDayTimeChartFilter((prev) => ({
																				...prev,
																				value,
																			}))}
																		>
																			{(value as MonthlyWeekChartValue).month + 1}
																		</DropdownMenuItem>
																	))}
																</DropdownMenuContent>
															</DropdownMenu>
														</>
													) : null
												}
											</>
										) : null
									) : null
								}
								Day:
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="px-3.5 py-1">
											<div className="flex gap-1.5 items-center">
												<div className="text-sm">
													{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dayTimeChartFilter.weekday - 1]}
												</div>
												<ChevronDownIcon size={14} color="#303030" />
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{[1, 2, 3, 4, 5].map((weekday) => (
											<DropdownMenuItem
												key={weekday}
												onSelect={() => setDayTimeChartFilter((prev) => ({
													...prev,
													weekday,
												}))}
											>
												{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][weekday - 1]}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
						<Chart
							className="w-full h-[20rem]"
							type="line"
							data={{
								labels: ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm'],
								datasets: [
									{
										label: 'To Campus',
										data: dayTimeChartData.to[dayTimeChartFilter.weekday as 1 | 2 | 3 | 4 | 5],
										borderColor: 'darkred',
									},
									{
										label: 'From Campus',
										data: dayTimeChartData.from[dayTimeChartFilter.weekday as 1 | 2 | 3 | 4 | 5],
										borderColor: 'darkblue',
									},
								],
							}}
							options={{
								maintainAspectRatio: false,
								scales: {
									y: {
										ticks: {
											callback: function(value: unknown) {
												// @ts-expect-error value is unknown
												return Number.isInteger(value) && value >= 0 ? value : null
											},
										},
									},
								},
							}}
						/>
					</div>
				</div>
				<div
					className="border border-input rounded-3xl backdrop-blur bg-white/[.4] p-[1rem] flex-col flex gap-[1rem] max-h-[20rem] overflow-y-auto">
					<div className="text-lg font-bold">Ride Logs</div>
					<ScrollArea className="flex flex-col">
						{rideLogs.map((log) => (
							<div key={log.id} className="flex flex-row text-sm gap-[1rem]">
								<div
									className="text-black">{new Date(log.timestamp.toDate()).toLocaleString()}</div>
								{
									log.type === MessageType.RIDE_CANCELLATION ? (
										<div className="text-black">
											Ride
											<Link to={`/rides/${log.ride_id}`}>{log.ride_id}</Link>
											has been cancelled
										</div>
									) : log.type === MessageType.NEW_PASSENGER ? (
										<div className="text-black">
											{log.userData.full_name} has joined ride <Link to={`/rides/${log.ride_id}`}
											                                               className="text-blue-500 underline hover:text-blue-700">{log.ride_id}</Link>
										</div>
									) : log.type === MessageType.RIDE_COMPLETION ? (
										<div className="text-black">
											Ride <Link to={`/rides/${log.ride_id}`}
											           className="text-blue-500 underline hover:text-blue-700">{log.ride_id}</Link> has
											been
											completed in car with plate number {log.carData.plate}
										</div>
									) : log.type === MessageType.SOS ? (
										<div className="text-black">SOS triggered by {log.driverData?.full_name} in
											ride <Link to={`/rides/${log.ride_id}`}
											           className="text-blue-500 underline hover:text-blue-700">{log.ride_id}</Link>
										</div>
									) : log.type === MessageType.SOS_RESPONSE ? (
										<div className="text-black">SOS in ride <Link to={`/rides/${log.ride_id}`}
										                                              className="text-blue-500 underline hover:text-blue-700">{log.ride_id}</Link> has
											been responded to
											by {log.driverData?.full_name}</div>
									) : log.type === MessageType.PASSENGER_CANCELLATION ? (
										<div className="text-black">{log.userData.full_name} has cancelled
											their ride in ride <Link to={`/rides/${log.ride_id}`}
											                         className="text-blue-500 underline hover:text-blue-700">{log.ride_id}</Link>
										</div>
									) : null
								}
							</div>
						))}
					</ScrollArea>
				</div>
			</div>
		</section>
	)
}

export default Dashboard
