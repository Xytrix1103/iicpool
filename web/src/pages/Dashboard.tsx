import { useEffect, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../components/firebase/FirebaseApp.tsx'
import { Ride, Role } from '../components/firebase/schema.ts'
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
	const [weekChartFilter, setWeekChartFilter] = useState<WeekChartFilterProps>({
		type: WeekChartFilter.LIFETIME,
	})
	const [weekChartData, setWeekChartData] = useState<number[]>([])
	
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
		
		unsubscribeFuncs.push(onSnapshot(query(collection(db, 'rides')), (snapshot) => {
			const todayRides = snapshot.docs as QueryDocumentSnapshot<Ride>[]
			
			const tempValues = weekChartFilter.type === WeekChartFilter.LIFETIME ? undefined : todayRides.map((doc) => {
				const datetimeDate = new Date(doc.data().datetime.toDate())
				const year = datetimeDate.getFullYear()
				const month = datetimeDate.getMonth()
				
				if (weekChartFilter.type === WeekChartFilter.YEAR) {
					return { year } as YearlyWeekChartValue
				} else if (weekChartFilter.type === WeekChartFilter.MONTH) {
					return { year, month } as MonthlyWeekChartValue
				}
			})
			
			//only get unique values
			const values = tempValues ? Array.from(new Set(tempValues.map(value => JSON.stringify(value)))).map(value => JSON.parse(value)) : undefined
			
			const value = values && values.length > 0 ? values[0] : undefined
			
			setWeekChartFilter((prev) => ({
				...prev,
				values,
				value,
			}))
			
			const dayOfWeekCount = Array(5).fill(0)
			
			if (weekChartFilter.type !== WeekChartFilter.LIFETIME && !weekChartFilter.values && !weekChartFilter.value) {
				return
			}
			
			const tempRides = todayRides.filter((doc) => {
				const datetimeDate = new Date(doc.data().datetime.toDate())
				const year = datetimeDate.getFullYear()
				const month = datetimeDate.getMonth()
				
				if (weekChartFilter.type === WeekChartFilter.LIFETIME) {
					return doc.data().cancelled_at === null
				} else if (weekChartFilter.type === WeekChartFilter.YEAR) {
					return year === (weekChartFilter.value as YearlyWeekChartValue).year && doc.data().cancelled_at === null
				} else if (weekChartFilter.type === WeekChartFilter.MONTH) {
					return year === (weekChartFilter.value as MonthlyWeekChartValue).year &&
						month === (weekChartFilter.value as MonthlyWeekChartValue).month && doc.data().cancelled_at === null
				}
			})
			
			// get the day of the week for each ride
			const dayOfWeek = tempRides.map((doc) => {
				return new Date(doc.data().datetime.toDate()).getDay()
			})
			
			// count the number of rides for each day of the week except Sunday (0) and Saturday (6)
			
			dayOfWeek.forEach((day) => {
				if (day !== 0 && day !== 6) {
					dayOfWeekCount[day - 1]++
				}
			})
			
			setWeekChartData(dayOfWeekCount)
			
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
	}, [weekChartFilter.type])
	
	return (
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<div className="flex flex-col gap-4">
				<div className="border border-input rounded-3xl backdrop-blur bg-white/[.4] flex">
					<div className="p-[0.5rem] flex items-center gap-2.5">
						<OverallStat status_text="Date" flex number={new Date().toLocaleDateString()} />
						<OverallStat status_text="Users" number={userStatistics.total_users} />
						<OverallStat status_text="Admins" number={adminStatistics.total_admins} />
					</div>
					<div>
						<Separator orientation="vertical" />
					</div>
					<div className="p-[0.5rem] flex items-center gap-2.5">
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
				<div className="grid grid-cols-5">
					<div
						className="col-span-2 border border-input rounded-3xl backdrop-blur bg-white/[.4] p-[1rem] flex-col flex gap-[1rem]">
						<div className="flex flex-row items-center gap-[2rem]">
							<div className="w-auto flex-row flex items-center gap-[1rem]">
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
							<div className="w-auto flex-row flex">
								{
									weekChartFilter.type === WeekChartFilter.YEAR || weekChartFilter.type === WeekChartFilter.MONTH ? (
										weekChartFilter.values && weekChartFilter.values.length > 0 ? (
											<>
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
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="outline" className="px-3.5 py-1">
																	<div className="flex gap-1.5 items-center">
																		<div className="text-sm">
																			{(weekChartFilter.value as MonthlyWeekChartValue).month + 1}
																		</div>
																		<ChevronDownIcon size={14} color="#303030" />
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
								labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
								datasets: [
									{
										label: 'Rides',
										data: weekChartData,
										fill: true,
										borderColor: 'darkred',
										tension: 0.2,
									},
								],
							}}
							options={{
								plugins: {
									legend: {
										display: false,
									},
								},
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
			</div>
		</section>
	)
}

export default Dashboard
