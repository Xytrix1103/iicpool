import axios, { AxiosError, AxiosResponse } from 'axios'

interface ApiResponse<T> {
	data: T;
}

interface ApiCallerConfig {
	baseURL: string;
	headers?: Record<string, string>; // Optional headers
}

const apiCaller = (config: ApiCallerConfig) => {
	const defaultHeaders = {
		'Content-Type': 'application/json',
		...(config.headers || {}), // Merge custom headers if provided in the config
	}

	return axios.create({
		baseURL: config.baseURL,
		headers: defaultHeaders,
	})
}

const setApiCallerConfig = (config: ApiCallerConfig) => {
	apiCallerInstance.defaults.baseURL = config.baseURL
}

const apiCallerInstance = apiCaller({ baseURL: import.meta.env.VITE_SERVER_URL }) // Initial instance with default base URL

const get = async <T>(
	url: string,
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	params: Record<string, any> = {},
	headers?: Record<string, string>,
): Promise<T> => {
	try {
		const response: AxiosResponse<ApiResponse<T>> = await apiCallerInstance.get(
			url,
			{
				params,
				headers: headers || {},
			},
		)
		// @ts-expect-error - data is not defined in AxiosResponse
		return response.data
		//eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		handleApiError(error)
		throw error
	}
}

const post = async <T>(
	url: string,
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Record<string, any> = {},
	headers?: Record<string, string>,
): Promise<T> => {
	try {
		const response: AxiosResponse<ApiResponse<T>> =
			await apiCallerInstance.post(url, data, { headers: headers || {} })
		// @ts-expect-error - data is not defined in AxiosResponse
		return response.data
		//eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		handleApiError(error)
		throw error
	}
}

const handleApiError = (error: AxiosError) => {
	console.error('API Error:', error)
}

export {
	setApiCallerConfig,
	get,
	post,
}
