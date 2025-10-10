import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    // Backend emite cookie httpOnly de sessão. Precisamos enviar/receber cookies nas requisições.
    withCredentials: true,
});

export default api;