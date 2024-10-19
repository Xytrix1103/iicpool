import { useLoaderData } from 'react-router-dom'
import { useState } from 'react'

const Rides = () => {
	const initialRides = useLoaderData()
	const [rides, setRides] = useState(initialRides)
}