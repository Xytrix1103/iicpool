import { useLoaderData } from 'react-router-dom'
import { Car, Profile, RideLocation, Signal } from '../components/firebase/schema.ts'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import {
	ArmchairIcon,
	ArrowRightCircleIcon,
	BanknoteIcon,
	CalendarIcon,
	ClockIcon,
	CopyIcon,
	HomeIcon,
	SchoolIcon,
} from 'lucide-react'
import { useToast } from '../components/themed/ui-kit/use-toast.ts'
import { Timestamp } from '@firebase/firestore'
import { Card, CardContent } from '../components/themed/ui-kit/card.tsx'
import { Avatar, AvatarImage } from '../components/themed/ui-kit/avatar.tsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore'
import { db } from '../components/firebase/FirebaseApp.tsx'
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Button } from '../components/themed/ui-kit/button.tsx'
import { callToast } from '../api/toast-utils.ts'
import ReactDOMServer from 'react-dom/server'
import { getStatus } from '../api/rides.tsx'

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

const Ride = () => {
	const { ride, campusLocation } = useLoaderData() as { ride: CustomRide, campusLocation: RideLocation }
	const [latestSignals, setLatestSignals] = useState<{ driver?: Signal, sosResponder?: Signal }>()
	const { toast } = useToast()
	const [, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([])
	const map = useMap()
	const markerLibrary = useMapsLibrary('marker')
	const directionsService = useRef(new google.maps.DirectionsService()).current
	const directionsRenderer = useRef(new google.maps.DirectionsRenderer({ map, suppressMarkers: true })).current
	const infoWindow = useRef(new google.maps.InfoWindow({
		headerDisabled: true,
	})).current

	const createMarker = useCallback((signal: Signal, photoUrl: string, markerLibrary: google.maps.MarkerLibrary, driver: boolean) => {
		return new Promise<google.maps.marker.AdvancedMarkerElement>((resolve) => {
			const isAwaitingSOSResponse = driver && ride?.sos?.triggered_at && !ride.sos?.responded_by

			const pinHTMLElement = () => {
				const content = document.createElement('div')
				content.innerHTML = `
        			<div class="flex flex-row gap-1 ${isAwaitingSOSResponse ? 'animate-pulseRed' : ''}">
						<img src="${photoUrl}" class="w-8 h-8 rounded-full" alt="Profile Picture" />
					</div>
				`
				return content
			}

			const pinElement = new markerLibrary.PinElement({
				glyph: pinHTMLElement(),
			})

			const name = ride?.[driver ? 'driverData' : 'sosResponderData']?.full_name
			const marker = new markerLibrary.AdvancedMarkerElement({
				position: {
					lat: signal.latitude,
					lng: signal.longitude,
				},
				map,
				content: pinElement.element,
				title: `${name} (${driver ? 'Driver' : 'SOS Responder'})`,
				zIndex: 999,
				gmpClickable: true,
			})

			marker.addListener('click', () => {
				const content = document.createElement('div')
				content.innerHTML = `
					<div class="flex flex-row gap-1">
						<img src="${photoUrl}" class="w-8 h-8 rounded-full" alt="Profile Picture" />
						<div class="flex flex-col gap-1">
							<div class="font-semibold text-sm">${name}</div>
							<div class="font-normal text-xs">${driver ? 'Driver' : 'SOS Responder'}</div>
						</div>
					</div>
				`
				infoWindow.close()
				infoWindow.setContent(content)
				infoWindow.open(map, marker)
			})

			console.log('Adding marker:', marker)
			resolve(marker)
		})
	}, [infoWindow, map, ride])

	const createPinMarker = useCallback((location: {
		lat: number,
		lng: number
	}, campus: boolean, markerLibrary: google.maps.MarkerLibrary) => {
		return new Promise<google.maps.marker.AdvancedMarkerElement>((resolve) => {
			const pinHTMLElement = () => {
				const content = document.createElement('div')
				content.innerHTML = campus ? `
					<div class="flex flex-row gap-1">
						${ReactDOMServer.renderToString(<SchoolIcon size={16} className="text-primary-darkred" />)}
					</div>
				` : `
					<div class="flex flex-row gap-1">
					  	${ReactDOMServer.renderToString(<HomeIcon size={16} className="text-primary-darkred" />)}
					</div>
				`
				return content
			}

			const pinElement = new markerLibrary.PinElement({
				glyph: pinHTMLElement(),
				background: 'white',
				borderColor: 'darkred',
			})

			const marker = new markerLibrary.AdvancedMarkerElement({
				position: {
					lat: location.lat,
					lng: location.lng,
				},
				map,
				content: pinElement.element,
			})

			console.log('Adding marker:', marker)
			resolve(marker)
		})
	}, [map])

	useEffect(() => {
		let unsubscribe: Unsubscribe

		if (ride.completed_at || ride.cancelled_at || !ride.started_at) {
			return
		} else {
			unsubscribe = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), orderBy('timestamp', 'desc')), (snapshot) => {
				const latestSignals = snapshot.docs.map((doc) => doc.data() as Signal)

				//get latest signal for driver and sosResponder, if any
				const driver = latestSignals.find((signal) => signal.user === ride.driver)
				const sosResponder = latestSignals.find((signal) => signal.user === ride.sos?.responded_by)

				console.log('Latest signals:', driver, sosResponder)
				setLatestSignals({
					driver,
					sosResponder,
				})
			})
		}

		return () => {
			unsubscribe?.()
		}
	}, [ride])

	useEffect(() => {
		if (!directionsService || !directionsRenderer || !ride || !campusLocation) return

		let waypoints: google.maps.DirectionsWaypoint[] | undefined = []

		const payload = {
			origin: ride.to_campus ? ride.location.geometry.location : campusLocation.geometry.location,
			destination: ride.to_campus ? campusLocation.geometry.location : ride.location.geometry.location,
			travelMode: google.maps.TravelMode.DRIVING,
		} as google.maps.DirectionsRequest

		if (ride.completed_at || ride.cancelled_at || !ride.started_at) {
			payload.waypoints = undefined
		} else {
			if (latestSignals?.sosResponder) {
				if (ride.sos?.started_at) {
					waypoints.push({
						location: new google.maps.LatLng({
							lat: latestSignals.sosResponder?.latitude || 0,
							lng: latestSignals.sosResponder?.longitude || 0,
						}),
					} as google.maps.DirectionsWaypoint)
				}
			} else {
				if (latestSignals?.driver) {
					waypoints.push({
						location: new google.maps.LatLng({
							lat: latestSignals.driver?.latitude || 0,
							lng: latestSignals.driver?.longitude || 0,
						}),
					} as google.maps.DirectionsWaypoint)
				}
			}

			waypoints = waypoints.length > 0 ? waypoints : undefined
		}

		if (waypoints) {
			payload.waypoints = waypoints
		}

		directionsService.route(payload, (response, status) => {
			if (status === 'OK') {
				directionsRenderer.setDirections(response)
			} else {
				console.error('Directions request failed due to ' + status)
			}
		}).then(r => {
			console.log('Directions:', r)
		}).catch(e => {
			console.error('Error fetching directions:', e)
		}).finally(() => {
			console.log('Directions request completed')

			directionsRenderer.setMap(map)
		})
	}, [directionsService, directionsRenderer, ride, campusLocation, latestSignals, map])

	useEffect(() => {
		if (!ride || !map || !markerLibrary) return

		// Remove all markers
		setMarkers((markers) => {
			markers.forEach((marker) => (marker.map = null))
			return []
		})

		console.log('Removing all markers')

		const driverSignal = latestSignals?.driver
		const sosResponderSignal = latestSignals?.sosResponder

		console.log('Signals:', driverSignal, sosResponderSignal)

		const markerPromises = []

		if (driverSignal) {
			console.log('Adding driver marker:', driverSignal)
			markerPromises.push(createMarker(driverSignal, ride.driverData.photo_url, markerLibrary, true))
		}

		if (sosResponderSignal) {
			console.log('Adding sosResponder marker:', sosResponderSignal)
			markerPromises.push(createMarker(sosResponderSignal, ride.sosResponderData?.photo_url as string, markerLibrary, false))
		}

		markerPromises.push(Promise.resolve(createPinMarker({
			lat: ride.to_campus ? ride.location.geometry.location.lat : campusLocation.geometry.location.lat,
			lng: ride.to_campus ? ride.location.geometry.location.lng : campusLocation.geometry.location.lng,
		} as { lat: number, lng: number }, false, markerLibrary)))
		markerPromises.push(Promise.resolve(createPinMarker({
			lat: ride.to_campus ? campusLocation.geometry.location.lat : ride.location.geometry.location.lat,
			lng: ride.to_campus ? campusLocation.geometry.location.lng : ride.location.geometry.location.lng,
		} as { lat: number, lng: number }, true, markerLibrary)))

		Promise.all(markerPromises).then((tempMarkers) => {
			console.log('Markers:', tempMarkers)
			setMarkers(tempMarkers)
		}).catch((error) => {
			console.error('Error adding markers:', error)
		})
	}, [ride, latestSignals, map, markerLibrary, createMarker, createPinMarker, campusLocation])

	return (
		<section className="w-full h-full flex flex-col gap-[2rem]">
			<SectionHeader
				text="Ride Details"
				extra={getStatus(ride)}
			/>
			<div className="w-full h-full flex flex-col gap-[2rem]">
				<div className="w-full h-full grid grid-cols-5 gap-[1rem]">
					<div className="col-span-2 flex flex-col h-full w-full gap-[1rem]">
						<Card
							className="h-full w-full overflow-hidden bg-white border-black/50 border-2"
						>
							<CardContent className="flex flex-col p-[2rem] gap-[1rem] h-full">
								<Map
									mapId="8116172d4fa3e050"
									gestureHandling="greedy"
									fullscreenControl={false}
									disableDefaultUI={true}
									className="h-full w-full"
									defaultCenter={{
										lat: 5.374591,
										lng: 100.253313,
									}}
									defaultZoom={12}
								/>
							</CardContent>
						</Card>
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
										<div className="text-sm">{ride.location.name}</div>
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
								{/*<div className="flex flex-col h-auto px-1 gap-[1rem]">*/}
								{/*	<div className="text-md font-semibold">Ride Logs</div>*/}
								{/*	<div className="flex flex-col gap-[1rem]">*/}
								{/*		<div*/}
								{/*			className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*			<div className="text-sm">Created At:</div>*/}
								{/*			<div*/}
								{/*				className="text-sm">{new Date(ride.created_at as unknown as string).toLocaleString()}</div>*/}
								{/*		</div>*/}
								{/*		{*/}
								{/*			ride.started_at && (*/}
								{/*				<div*/}
								{/*					className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*					<div className="text-sm">Started At:</div>*/}
								{/*					<div*/}
								{/*						className="text-sm">{new Date(ride.started_at as unknown as string).toLocaleString()}</div>*/}
								{/*				</div>*/}
								{/*			)*/}
								{/*		}*/}
								{/*		{*/}
								{/*			ride.cancelled_at && (*/}
								{/*				<div*/}
								{/*					className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*					<div className="text-sm">Cancelled At:</div>*/}
								{/*					<div*/}
								{/*						className="text-sm">{new Date(ride.cancelled_at as unknown as string).toLocaleString()}</div>*/}
								{/*				</div>*/}
								{/*			)*/}
								{/*		}*/}
								{/*		{*/}
								{/*			ride.sos && (*/}
								{/*				<>*/}
								{/*					{*/}
								{/*						ride.sos.triggered_at && (*/}
								{/*							<div*/}
								{/*								className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*								<div className="text-sm">SOS Triggered At:</div>*/}
								{/*								<div*/}
								{/*									className="text-sm">{new Date(ride.sos.triggered_at as unknown as string).toLocaleString()}</div>*/}
								{/*							</div>*/}
								{/*						)*/}
								{/*					}*/}
								{/*					{*/}
								{/*						ride.sos.responded_at && (*/}
								{/*							<div*/}
								{/*								className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*								<div className="text-sm">SOS Responded At:</div>*/}
								{/*								<div*/}
								{/*									className="text-sm">{new Date(ride.sos.responded_at as unknown as string).toLocaleString()}</div>*/}
								{/*							</div>*/}
								{/*						)*/}
								{/*					}*/}
								{/*					{*/}
								{/*						ride.sos.started_at && (*/}
								{/*							<div*/}
								{/*								className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*								<div className="text-sm">SOS Started At:</div>*/}
								{/*								<div*/}
								{/*									className="text-sm">{new Date(ride.sos.started_at as unknown as string).toLocaleString()}</div>*/}
								{/*							</div>*/}
								{/*						)*/}
								{/*					}*/}
								{/*				</>*/}
								{/*			)*/}
								{/*		}*/}
								{/*		{*/}
								{/*			ride.completed_at && (*/}
								{/*				<div*/}
								{/*					className="flex flex-row gap-[1rem] items-center h-auto justify-items-center">*/}
								{/*					<div className="text-sm">Completed At:</div>*/}
								{/*					<div*/}
								{/*						className="text-sm">{new Date(ride.completed_at as unknown as string).toLocaleString()}</div>*/}
								{/*				</div>*/}
								{/*			)*/}
								{/*		}*/}
								{/*	</div>*/}
								{/*</div>*/}
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
