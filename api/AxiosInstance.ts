import axios from 'axios';

const AxiosInstance = axios.create({
	baseURL: "http://192.168.100.64:3000"
});

export default AxiosInstance;