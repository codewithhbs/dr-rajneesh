
import { API_URL } from '@/constant/Urls';
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});





export default axiosInstance;
