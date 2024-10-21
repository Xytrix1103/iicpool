import { useLoaderData } from 'react-router-dom'
import { Car, Profile, RideLocation, Signal } from '../components/firebase/schema.ts'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { ArmchairIcon, ArrowRightCircleIcon, BanknoteIcon, CalendarIcon, ClockIcon, CopyIcon } from 'lucide-react'
import { useToast } from '../components/themed/ui-kit/use-toast.ts'
import { Timestamp } from '@firebase/firestore'
import { Card, CardContent } from '../components/themed/ui-kit/card.tsx'
import { Avatar, AvatarImage } from '../components/themed/ui-kit/avatar.tsx'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../components/firebase/FirebaseApp.tsx'
import { AdvancedMarker, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Button } from '../components/themed/ui-kit/button.tsx'
import { callToast } from '../api/toast-utils.ts'

type CustomRide = RideType & {
	passengersData: Profile[]
	driverData: Profile
	driverCarData: Car
	sosResponderData: Profile | null
	sosResponderCarData: Car | null
}

type RideType = {
	id?: string
	driver: string
	passengers: string[]
	to_campus: boolean
	car: string
	available_seats: number
	datetime: Timestamp
	created_at: Timestamp
	completed_at: Timestamp | null
	cancelled_at: Timestamp | null
	started_at: Timestamp | null
	sos: {
		triggered_at: Timestamp | null
		responded_at: Timestamp | null
		responded_by: string | null
		started_at: Timestamp | null
		car: string | null
	} | null
	fare: number
	location: {
		place_id: string
		formatted_address: string
		name: string
		geometry: {
			location: {
				lat: number
				lng: number
			},
		},
	}
	deleted_at: Timestamp | null
}

const getStatus = (ride: CustomRide) => {
	if (ride.completed_at) {
		if (ride.sos) {
			return <div className="py-1 text-primary-darkred font-semibold">SOS Completed</div>
		}
		return <div className="py-1 text-green-500 font-semibold">Completed</div>
	} else if (ride.cancelled_at) {
		return <div className="py-1 text-orange-500 font-semibold">Cancelled</div>
	} else if (ride.started_at) {
		if (ride.sos?.started_at) {
			return <div className="py-1 text-primary-darkred font-semibold">SOS Ongoing</div>
		} else {
			if (ride.sos?.responded_by) {
				return <div className="py-1 text-primary-darkred font-semibold">SOS Responded</div>
			}
			return <div className="py-1 text-yellow-500 font-semibold">Ongoing</div>
		}
	} else {
		return <div className="py-1 text-gray-500 font-semibold">Pending</div>
	}
}

const Ride = () => {
	const { ride, campusLocation } = useLoaderData() as { ride: CustomRide, campusLocation: RideLocation }
	const [lastDriverSignal, setLastDriverSignal] = useState<Signal | null>(null)
	const [lastSOSResponderSignal, setLastSOSResponderSignal] = useState<Signal | null>(null)
	const { toast } = useToast()
	const map = useMap()
	const routesLibrary = useMapsLibrary('routes')
	const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>()
	const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>()
	const [route, setRoute] = useState<google.maps.DirectionsRoute | null>(null)
	const leg = route?.legs[0]
	
	const [directionsProps, setDirectionsProps] = useState<{
		origin: google.maps.LatLng,
		destination: google.maps.LatLng,
		waypoints: google.maps.DirectionsWaypoint[] | null,
	} | null>({
		origin: new google.maps.LatLng(0, 0),
		destination: new google.maps.LatLng(0, 0),
		waypoints: null,
	})
	
	useEffect(() => {
		if (!routesLibrary || !map) return
		setDirectionsService(new routesLibrary.DirectionsService())
		setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }))
	}, [routesLibrary, map])
	
	useEffect(() => {
		if (!directionsService || !directionsRenderer) return
		
		const payload = {
			origin: directionsProps?.origin,
			destination: directionsProps?.destination,
			travelMode: google.maps.TravelMode.DRIVING,
		} as google.maps.DirectionsRequest
		
		if (directionsProps?.waypoints) {
			payload.waypoints = directionsProps.waypoints
		}
		
		directionsService.route(payload, (response, status) => {
			if (status === 'OK') {
				setRoute(response?.routes[0] || null)
				directionsRenderer.setDirections(response)
			} else {
				console.error('Directions request failed due to ' + status)
			}
		}).then(r => {
			console.log('Directions:', r)
		}).catch(e => {
			console.error('Error fetching directions:', e)
		})
	}, [directionsService, directionsRenderer, directionsProps])
	
	useEffect(() => {
		let unsubscribeDriver: (() => void) | null = null
		let unsubscribeSOSResponder: (() => void) | null = null
		
		if (ride.completed_at || ride.cancelled_at || !ride.started_at) {
			return
		}
		
		if (ride.driver && (ride.sos ? (ride.sos?.responded_by ? ride.sos?.started_at : true) : true)) {
			unsubscribeDriver = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), where('user', '==', ride.driver), orderBy('timestamp', 'desc')), (snapshot) => {
				const signals = snapshot.docs.map((doc) => doc.data() as Signal)
				const lastSignal = signals[0]
				setLastDriverSignal(lastSignal)
			})
		}
		
		if (ride.sos?.responded_by) {
			unsubscribeSOSResponder = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), where('user', '==', ride.sos.responded_by), orderBy('timestamp', 'desc')), (snapshot) => {
				const signals = snapshot.docs.map((doc) => doc.data() as Signal)
				const lastSignal = signals[0]
				setLastSOSResponderSignal(lastSignal)
			})
		}
		
		return () => {
			unsubscribeDriver?.()
			unsubscribeSOSResponder?.()
		}
	}, [ride])
	
	useEffect(() => {
		(async () => {
			if (!ride || !campusLocation) return
			
			if (ride.completed_at || ride.cancelled_at || !ride.started_at) {
				console.log('ride completed or cancelled')
				const origin = ride.to_campus ? ride.location.geometry.location : ride.location.geometry.location
				const destination = ride.to_campus ? campusLocation.geometry.location : ride.location.geometry.location
				
				setDirectionsProps({
					origin: new google.maps.LatLng({ lat: origin.lat, lng: origin.lng }),
					destination: new google.maps.LatLng({ lat: destination.lat, lng: destination.lng }),
					waypoints: null,
				})
			} else {
				console.log('ride started')
				const origin = ride.to_campus ? ride.location.geometry.location : ride.location.geometry.location
				const destination = ride.to_campus ? campusLocation.geometry.location : ride.location.geometry.location
				const waypoints = []
				
				if (lastSOSResponderSignal) {
					console.log('lastSOSResponderSignal', lastSOSResponderSignal)
					if (ride.sos?.started_at) {
						waypoints.push({
							location: new google.maps.LatLng({
								lat: lastSOSResponderSignal.latitude,
								lng: lastSOSResponderSignal.longitude,
							}),
						} as google.maps.DirectionsWaypoint)
					}
				} else {
					if (lastDriverSignal) {
						console.log('lastDriverSignal', lastDriverSignal)
						waypoints.push({
							location: new google.maps.LatLng({
								lat: lastDriverSignal.latitude,
								lng: lastDriverSignal.longitude,
							}),
						} as google.maps.DirectionsWaypoint)
					}
				}
				
				setDirectionsProps({
					origin: new google.maps.LatLng({ lat: origin.lat, lng: origin.lng }),
					destination: new google.maps.LatLng({ lat: destination.lat, lng: destination.lng }),
					waypoints: waypoints.length > 0 ? waypoints : null,
				})
			}
		})()
	}, [ride, campusLocation, lastDriverSignal, lastSOSResponderSignal])
	
	return (
		<section className="w-full h-full flex flex-col gap-[2rem]">
			<SectionHeader
				text="Ride Details"
				extra={getStatus(ride)}
			/>
			<div className="w-full h-full flex flex-col gap-[2rem]">
				<div className="w-full h-full grid grid-cols-5 gap-[1rem]">
					<div className="col-span-2 flex flex-col h-full w-full gap-[1rem]">
						{directionsProps && (
							<Card
								className="h-full w-full overflow-hidden bg-white border-black/50 border-2"
							>
								<CardContent className="flex flex-col p-[2rem] gap-[1rem] h-full">
									<Map
										mapId={'8116172d4fa3e050'}
										gestureHandling={'greedy'}
										fullscreenControl={false}
										disableDefaultUI={true}
										className="h-full w-full"
									>
										{
											lastDriverSignal && (
												<AdvancedMarker
													position={{
														lat: lastDriverSignal.latitude,
														lng: lastDriverSignal.longitude,
													}}
												>
													<Avatar>
														<AvatarImage
															src={ride.driverData.photo_url}
															alt="Driver"
															className="h-10 w-10 rounded-full"
														/>
													</Avatar>
												</AdvancedMarker>
											)
										}
										{
											lastSOSResponderSignal && (
												<AdvancedMarker
													position={{
														lat: lastSOSResponderSignal.latitude,
														lng: lastSOSResponderSignal.longitude,
													}}
												>
													<Avatar>
														<AvatarImage
															src={ride.sosResponderData?.photo_url}
															alt="SOS Responder"
															className="h-10 w-10 rounded-full"
														/>
													</Avatar>
												</AdvancedMarker>
											)
										}
									</Map>
									<div className="flex flex-row h-auto px-1 gap-[1rem]">
										<div className="text-sm">Duration: <span
											className="font-semibold">{leg?.duration?.text}</span></div>
										<div className="text-sm">Distance: <span
											className="font-semibold">{leg?.distance?.text}</span></div>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
					<div className="col-span-2">
						<Card
							className="h-full w-full overflow-hidden bg-white border-black/50 border-2"
						>
							<CardContent className="flex flex-col p-[2rem] gap-[2.5rem] h-full">
								<div className="w-full flex flex-row gap-[1rem] justify-items-center">
									<div className="w-auto text-xs h-auto">Ride ID: <span
										className="font-semibold">{ride.id}</span>
									</div>
									<Button variant="outline" className="h-full" onClick={() => {
										navigator.clipboard.writeText(ride.id as string).then(() => {
											console.log('Copied to clipboard')
											callToast(toast, 'Success', 'Copied to clipboard')
										})
									}}>
										<CopyIcon size={16} />
									</Button>
								</div>
								<div className="flex flex-col justify-between h-auto px-1 gap-[1rem]">
									<div className="flex gap-[1.5rem] h-auto w-full justify-items-center align-middle">
										<div className="flex flex-row w-auto justify-items-center h-auto gap-[0.5rem]">
											<CalendarIcon size={24} />
											<div
												className="font-semibold">{new Date(ride.datetime as unknown as string).toLocaleDateString()}</div>
										</div>
										<div className="flex flex-row w-auto justify-items-center h-auto gap-[0.5rem]">
											<ClockIcon size={24} />
											<div
												className="font-semibold">{new Date(ride.datetime as unknown as string).toLocaleTimeString()}</div>
										</div>
										<div className="flex flex-row w-auto justify-items-center h-auto gap-[0.5rem]">
											<ArmchairIcon size={24} />
											<div className="font-semibold">{ride.available_seats}</div>
										</div>
										<div className="flex flex-row w-auto justify-items-center h-auto gap-[0.5rem]">
											<BanknoteIcon size={24} />
											<div className="font-semibold">RM {ride.fare}</div>
										</div>
									</div>
								</div>
								<div
									className={`flex h-auto px-1 gap-[2rem] align-middle justify-items-center justify-center ${ride.to_campus ? 'flex-row' : 'flex-row-reverse'}`}>
									<div className="flex flex-col flex-1 h-full gap-[0.5rem]">
										<div
											className="text-md font-semibold">{ride.to_campus ? 'Pick-Up Location' : 'Drop-Off Location'}</div>
										<div className="text-sm">{ride.location.formatted_address}</div>
									</div>
									<div
										className="flex flex-col h-full gap-[0.5rem] justify-items-center justify-center">
										<ArrowRightCircleIcon size={24} />
									</div>
									<div className="flex flex-col flex-1 h-full gap-[0.5rem]">
										<div className="text-md font-semibold">Campus</div>
										<div className="text-sm">INTI International College Penang</div>
									</div>
								</div>
								<div className="flex flex-row h-auto px-1 gap-[2rem] align-middle justify-items-center">
									<div className="flex flex-col flex-1 justify-between h-auto px-1 gap-[0.5rem]">
										<div className="text-md font-semibold">Driver's Car</div>
										<div
											className="flex gap-[1rem] items-center h-auto justify-items-center align-middle">
											<div
												className={`h-16 w-16 bg-center bg-clip-content bg-cover`}
												style={{ backgroundImage: `url(${ride.driverCarData.photo_url})` }} />
											<div className="flex flex-col gap-[0.5rem]">
												<div className="text-sm font-semibold">{ride.driverCarData.plate}</div>
												<div
													className="text-sm">{ride.driverCarData.brand} {ride.driverCarData.model} ({ride.driverCarData.color})
												</div>
											</div>
										</div>
									</div>
									{
										(ride.sosResponderData && ride.sosResponderCarData) && (
											<div className="flex flex-col flex-1 justify-between h-auto px-1 gap-[0.5rem]">
												<div className="text-md font-semibold">SOS Responder's Car</div>
												<div
													className="flex gap-[1rem] items-center h-auto justify-items-center align-middle">
													<div
														className={`h-16 w-16 bg-center bg-clip-content bg-cover`}
														style={{ backgroundImage: `url(${ride.sosResponderCarData.photo_url})` }} />
													<div className="flex flex-col gap-[0.5rem]">
														<div
															className="text-sm font-semibold">{ride.sosResponderCarData.plate}</div>
														<div
															className="text-sm">{ride.sosResponderCarData.brand} {ride.sosResponderCarData.model} ({ride.sosResponderCarData.color})
														</div>
													</div>
												</div>
											</div>
										)
									}
								</div>
								<div className="flex flex-col h-auto px-1 gap-[1rem]">
									<div className="text-md font-semibold">Ride Logs</div>
									<div className="flex flex-col gap-[1rem]">
										<div
											className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
											<div className="text-sm">Created At:</div>
											<div
												className="text-sm">{new Date(ride.created_at as unknown as string).toLocaleString()}</div>
										</div>
										{
											ride.started_at && (
												<div
													className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
													<div className="text-sm">Started At:</div>
													<div
														className="text-sm">{new Date(ride.started_at as unknown as string).toLocaleString()}</div>
												</div>
											)
										}
										{
											ride.cancelled_at && (
												<div
													className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
													<div className="text-sm">Cancelled At:</div>
													<div
														className="text-sm">{new Date(ride.cancelled_at as unknown as string).toLocaleString()}</div>
												</div>
											)
										}
										{
											ride.sos && (
												<>
													{
														ride.sos.triggered_at && (
															<div
																className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
																<div className="text-sm">SOS Triggered At:</div>
																<div
																	className="text-sm">{new Date(ride.sos.triggered_at as unknown as string).toLocaleString()}</div>
															</div>
														)
													}
													{
														ride.sos.responded_at && (
															<div
																className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
																<div className="text-sm">SOS Responded At:</div>
																<div
																	className="text-sm">{new Date(ride.sos.responded_at as unknown as string).toLocaleString()}</div>
															</div>
														)
													}
													{
														ride.sos.started_at && (
															<div
																className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
																<div className="text-sm">SOS Started At:</div>
																<div
																	className="text-sm">{new Date(ride.sos.started_at as unknown as string).toLocaleString()}</div>
															</div>
														)
													}
												</>
											)
										}
										{
											ride.completed_at && (
												<div
													className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">
													<div className="text-sm">Completed At:</div>
													<div
														className="text-sm">{new Date(ride.completed_at as unknown as string).toLocaleString()}</div>
												</div>
											)
										}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
					<div className="col-span-1 max-h-full">
						<Card className="h-full w-full max-h-full overflow-hidden bg-white border-black/50 border-2">
							<CardContent
								className="flex flex-col p-[2rem] gap-[1rem] h-full max-h-full overflow-y-auto">
								<div className="flex flex-col justify-between h-auto px-1 gap-[0.5rem]">
									<div className="text-md font-semibold">Driver</div>
									<div
										className="flex gap-[1rem] items-center h-auto justify-items-center align-middle">
										<Avatar className="h-full w-auto">
											<AvatarImage
												src={ride.driverData.photo_url}
												alt="Driver"
												className="h-14 w-14 rounded-full"
											/>
										</Avatar>
										<div className="flex flex-col gap-[0.5rem]">
											<div className="text-sm font-semibold">{ride.driverData.full_name}</div>
											<div className="text-sm">{ride.driverData.mobile_number}</div>
										</div>
									</div>
								</div>
								{ride.sosResponderData && (
									<div className="flex flex-col justify-between h-auto px-1 gap-[0.5rem]">
										<div className="text-md font-semibold">SOS Responder</div>
										<div
											className="flex gap-[1rem] items-center h-auto justify-items-center align-middle">
											<Avatar className="h-full w-auto">
												<AvatarImage
													src={ride.sosResponderData.photo_url}
													alt="SOS Responder"
													className="h-14 w-14 rounded-full"
												/>
											</Avatar>
											<div className="flex flex-col gap-[0.5rem]">
												<div
													className="text-sm font-semibold">{ride.sosResponderData.full_name}</div>
												<div className="text-sm">{ride.sosResponderData.mobile_number}</div>
											</div>
										</div>
									</div>
								)}
								<div className="flex flex-col justify-between h-auto px-1 gap-[0.5rem] overflow-y-auto">
									<div className="text-md font-semibold">
										Passengers ({ride.passengersData.length}/{ride.available_seats})
									</div>
									{ride.passengersData.map((passenger) => (
										<div
											className="flex gap-[1rem] items-center h-auto justify-items-center align-middle"
											key={passenger.id}
										>
											<Avatar className="h-full w-auto">
												<AvatarImage
													src={passenger.photo_url}
													alt="Passenger"
													className="h-14 w-14 rounded-full"
												/>
											</Avatar>
											<div className="flex flex-col gap-[0.5rem]">
												<div className="text-sm font-semibold">{passenger.full_name}</div>
												<div className="text-sm">{passenger.mobile_number}</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</section>
	)
}

export default Ride
