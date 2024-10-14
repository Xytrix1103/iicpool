import AxiosInstance from 'axios'

const axios_component = AxiosInstance.create({
	baseURL: 'http://localhost:3000',
})

axios_component.interceptors.response.use(
	(response) => {
		return response
	},
	(error) => {
		if (error.response) {
			console.log('Error response', error.response.data)
		} else if (error.request) {
			console.log('Error request', error.request)
		} else {
			console.log('Error', error.message)
		}
		return Promise.reject(error)
	},
)

const get = async <T>(url: string) => {
	const response = await axios_component.get(url)
	return response.data as T
}

const post = async (url: string, data: any) => {
	const response = await axios_component.post(url, data)
	return response.data
}

export { get, post }
