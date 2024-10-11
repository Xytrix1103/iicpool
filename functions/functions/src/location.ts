import axios from 'axios'

const GMAPS_API_KEY = 'AIzaSyAZJLOFhRAzXUdviZBokuuKv4pfqyEpyxs'

const fetchLocationByCoordinates = async ({ latitude, longitude }: { latitude: number, longitude: number }) => {
	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GMAPS_API_KEY}`
	
	try {
		const response = await axios.get(url, {
			headers: {
				'Content-Type': 'application/json',
			},
		})
		
		if (response) {
			console.log('Location:', response.data.results[0])
			return response.data.results[0]
		}
	} catch (error) {
		console.error('Error fetching address:', error)
	}
}

export { fetchLocationByCoordinates }
