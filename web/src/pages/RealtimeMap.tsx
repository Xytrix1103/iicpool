import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Car, Profile, Ride, RideLocation, Signal } from '../components/firebase/schema.ts'
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../components/firebase/FirebaseApp.tsx'
import { ScrollArea } from '../components/themed/ui-kit/scroll-area.tsx'
import { ArmchairIcon, BanknoteIcon, CalendarIcon, ClockIcon, HomeIcon, SchoolIcon } from 'lucide-react'
import { Button } from '../components/themed/ui-kit/button.tsx'
import { useLoaderData } from 'react-router-dom'
import ReactDOMServer from 'react-dom/server'
import { getStatus } from '../api/rides.tsx'

type CustomRide = Ride & {
	passengersData: Profile[]
	driverData: Profile
	driverCarData: Car
	sosResponderData: Profile | null
	sosResponderCarData: Car | null
}

const RealtimeMap = () => {
	const { campusLocation } = useLoaderData() as { campusLocation: RideLocation }
	const [rides, setRides] = useState<CustomRide[] | null>(null)
	const [latestSignals, setLatestSignals] = useState<{
		[key: string]: { driver?: Signal, sosResponder?: Signal }
	} | null>(null)
	const [selectedRide, setSelectedRide] = useState<string | null>(null)
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
			const ride = rides?.find((ride) => driver ? ride.driver === signal.user : ride.sos?.responded_by === signal.user)
			const isAwaitingSOSResponse = driver && ride?.sos?.triggered_at && !ride.sos?.responded_by

			const pinHTMLElement = () => {
				const content = document.createElement('div')
				content.innerHTML = `
        			<div class="flex flex-row gap-1">
						<img src="${photoUrl}" class="w-8 h-8 rounded-full ${isAwaitingSOSResponse ? 'animate-pulseRed' : ''}" alt="Profile Picture" />
					</div>
				`
				return content
			}

			const pinElement = new markerLibrary.PinElement({
				glyph: pinHTMLElement(),
			})

			const name = rides?.find((ride) => driver ? ride.driver === signal.user : ride.sos?.responded_by === signal.user)?.[driver ? 'driverData' : 'sosResponderData']?.full_name
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
	}, [infoWindow, map, rides])

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
		const unsubscribe = onSnapshot(query(collection(db, 'rides'), where('completed_at', '==', null), where('started_at', '!=', null)), async (snapshot) => {
			const rides = snapshot.docs.map((doc) => {
				return {
					...doc.data(),
					id: doc.id,
				} as CustomRide
			})

			const finalRides = await Promise.all(rides.map(async (ride) => {
				const passengersData = await Promise.all(ride.passengers.map(async (passenger) => {
					const passengerDoc = await getDoc(doc(db, 'users', passenger))
					return { ...passengerDoc.data(), id: passenger } as Profile
				}))

				const driverDoc = await getDoc(doc(db, 'users', ride.driver))
				const driverData = { ...driverDoc.data(), id: ride.driver } as Profile

				const driverCarDoc = await getDoc(doc(db, 'cars', ride.car))
				const driverCarData = { ...driverCarDoc.data(), id: ride.car } as Car

				const sosResponderData = ride.sos?.responded_by ?
					await getDoc(doc(db, 'users', ride.sos?.responded_by)).then((doc) => ({
						...doc.data(),
						id: ride.sos?.responded_by,
					} as Profile)) : null
				const sosResponderCarData = ride.sos?.car ?
					await getDoc(doc(db, 'cars', ride.sos?.car)).then((doc) => ({
						...doc.data(),
						id: ride.sos?.car,
					} as Car)) : null

				return {
					...ride,
					passengersData,
					driverData,
					driverCarData,
					sosResponderData,
					sosResponderCarData,
				} as CustomRide
			}))

			setMarkers((markers) => {
				markers.forEach((marker) => (marker.map = null))
				return []
			})
			setRides(finalRides)
		})

		return () => unsubscribe()
	}, [])

	useEffect(() => {
		if (!rides) return
		const unsubscribes: (() => void)[] = []

		rides.forEach((ride) => {
			console.log('Subscribing to ride:', ride.id)
			const unsubscribe = onSnapshot(query(collection(db, 'rides', ride.id || '', 'signals'), orderBy('timestamp', 'desc')), (snapshot) => {
				const latestSignals = snapshot.docs.map((doc) => doc.data() as Signal)

				//get latest signal for driver and sosResponder, if any
				const driver = latestSignals.find((signal) => signal.user === ride.driver)
				const sosResponder = latestSignals.find((signal) => signal.user === ride.sos?.responded_by)

				console.log('Latest signals:', driver, sosResponder)

				// Remove all markers
				setMarkers((markers) => {
					markers.forEach((marker) => (marker.map = null))
					return []
				})

				console.log('Removing all markers')
				
				setLatestSignals((prevSignals) => ({
					...prevSignals,
					[ride.id || '']: {
						driver,
						sosResponder,
					},
				}))
			})

			unsubscribes.push(unsubscribe)
		})

		return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
	}, [rides])

	//show route on map if selectedRide is changed
	useEffect(() => {
		if (!directionsService || !directionsRenderer || !rides || !campusLocation || !latestSignals) return

		if (!selectedRide) {
			directionsRenderer?.setMap(null)
			map?.setCenter({
				lat: 5.374591,
				lng: 100.253313,
			})
			map?.setZoom(12)
			return
		} else {
			const ride = rides.find((ride) => ride.id === selectedRide)

			if (!ride) {
				return
			}

			let waypoints: google.maps.DirectionsWaypoint[] | undefined = []

			const payload = {
				origin: ride.to_campus ? ride.location.geometry.location : campusLocation.geometry.location,
				destination: ride.to_campus ? campusLocation.geometry.location : ride.location.geometry.location,
				travelMode: google.maps.TravelMode.DRIVING,
			} as google.maps.DirectionsRequest

			if (ride.completed_at || ride.cancelled_at || !ride.started_at) {
				payload.waypoints = undefined
			} else {
				if (latestSignals?.[ride.id || '']?.sosResponder) {
					if (ride.sos?.started_at) {
						waypoints.push({
							location: new google.maps.LatLng({
								lat: latestSignals[ride.id || ''].sosResponder?.latitude || 0,
								lng: latestSignals[ride.id || ''].sosResponder?.longitude || 0,
							}),
						} as google.maps.DirectionsWaypoint)
					}
				} else {
					if (latestSignals?.[ride.id || '']?.driver) {
						waypoints.push({
							location: new google.maps.LatLng({
								lat: latestSignals[ride.id || ''].driver?.latitude || 0,
								lng: latestSignals[ride.id || ''].driver?.longitude || 0,
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

				//add changes to map
				directionsRenderer.setMap(map)
			})
		}
	}, [campusLocation, directionsRenderer, directionsService, latestSignals, map, rides, selectedRide])

	useEffect(() => {
		if (!rides || !latestSignals || !map || !markerLibrary) return

		if (selectedRide) {
			// Add markers for selectedRide
			const ride = rides.find((ride) => ride.id === selectedRide)
			if (!ride) return

			const driverSignal = latestSignals?.[selectedRide]?.driver
			const sosResponderSignal = latestSignals?.[selectedRide]?.sosResponder

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
		} else {
			//add markers for all drivers and sosResponders in latestSignals
			const markerPromises: Promise<google.maps.marker.AdvancedMarkerElement>[] = []

			Object.keys(latestSignals).forEach((rideId) => {
				const ride = rides.find((ride) => ride.id === rideId)
				if (!ride) return

				const driverSignal = latestSignals?.[rideId]?.driver
				const sosResponderSignal = latestSignals?.[rideId]?.sosResponder

				if (driverSignal) {
					markerPromises.push(createMarker(driverSignal, ride.driverData.photo_url, markerLibrary, true))
				}

				if (sosResponderSignal) {
					markerPromises.push(createMarker(sosResponderSignal, ride.sosResponderData?.photo_url as string, markerLibrary, false))
				}
			})

			Promise.all(markerPromises).then((tempMarkers) => {
				console.log('Markers:', tempMarkers)
				setMarkers(tempMarkers)
			}).catch((error) => {
				console.error('Error adding markers:', error)
			})
		}
	}, [campusLocation, createMarker, createPinMarker, latestSignals, map, markerLibrary, rides, selectedRide])

	useEffect(() => {
		console.log(latestSignals)
	}, [latestSignals])

	return (
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<SectionHeader
				text="Real-Time Map (Ongoing Rides)"
			/>
			<div className="w-full h-full flex flex-col gap-[2rem]">
				<div className="w-full h-full grid grid-cols-3 gap-[2rem]">
					<div className="col-span-2 h-full w-full bg-white rounded-2xl border border-input">
						<Map
							mapId="2d8fcae105bf764e"
							gestureHandling={'greedy'}
							fullscreenControl={false}
							disableDefaultUI={true}
							className="h-full w-full"
							defaultCenter={{
								lat: 5.374591,
								lng: 100.253313,
							}}
							defaultZoom={12}
							onClick={() => infoWindow.close()}
						/>
					</div>
					<div className="col-span-1 h-full w-full">
						<ScrollArea className="flex-1">
							<div className="flex flex-col w-full gap-2">
								{
									rides?.map((ride) => (
										<Button
											key={ride.id}
											variant={selectedRide === ride.id ? 'selected' : 'outline'}
											className={`gap-1 py-[0.5rem] px-[1.5rem] ${selectedRide === ride.id ? 'text-white' : 'text-black'}`}
											onClick={() => selectedRide === ride.id ? setSelectedRide(null) : setSelectedRide(ride.id as string)}
										>
											<div
												className="flex gap-[1rem] h-auto w-full justify-items-center justify-between">
												<div
													className="flex flex-row flex-wrap w-full justify-items-center h-auto align-middle gap-[0.5rem]">
													<div
														className="flex flex-row w-auto justify-items-center items-center h-auto gap-[0.5rem]">
														<CalendarIcon size={16} className="self-center" />
														<div
															className="font-semibold text-xs center">{ride.datetime.toDate().toLocaleDateString()}</div>
													</div>
													<div
														className="flex flex-row w-auto justify-items-center items-center h-auto gap-[0.5rem]">
														<ClockIcon size={16} className="self-center" />
														<div
															className="font-semibold text-xs">{ride.datetime.toDate().toLocaleTimeString()}</div>
													</div>
													<div
														className="flex flex-row w-auto justify-items-center items-center h-auto gap-[0.5rem]">
														<ArmchairIcon size={16} className="self-center" />
														<div
															className="font-semibold text-xs">{ride.available_seats}</div>
													</div>
													<div
														className="flex flex-row w-auto justify-items-center items-center h-auto gap-[0.5rem]">
														<BanknoteIcon size={16} className="self-center" />
														<div className="font-semibold text-xs">RM {ride.fare}</div>
													</div>
												</div>
												<div
													className="w-auto justify-items-center h-auto">
													{getStatus(ride)}
												</div>
											</div>
										</Button>
									))
								}
								{
									rides?.length === 0 && (
										<div
											className="flex flex-1 justify-center items-center text-gray-500 font-semibold text-sm">
											No ongoing rides
										</div>
									)
								}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</section>
	)
}

export default RealtimeMap
