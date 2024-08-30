import AxiosInstance from './AxiosInstance'

const GMAPS_API_KEY = 'AIzaSyAZJLOFhRAzXUdviZBokuuKv4pfqyEpyxs'
const CAMPUS_ADDRESS = '1-Z, Lebuh Bukit Jambul, Bukit Jambul, 11900 Bayan Lepas, Pulau Pinang'
const CAMPUS_NAME = 'INTI International College Penang'

const getDirections = async ({ origin, destination }: { origin: string, destination: string }) => {
	const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json'
	const params = `origin=place_id:${origin}&place_id:destination=${destination}&units=metric&mode=driving`
	
	try {
		const response = await AxiosInstance.get(`${baseUrl}?${params}&key=${GMAPS_API_KEY}`)
		console.log(response)
		return response as unknown as google.maps.DirectionsResult
	} catch (error) {
		console.error(error)
		return null
	}
}

export {
	GMAPS_API_KEY,
	CAMPUS_ADDRESS,
	CAMPUS_NAME,
	getDirections,
}
