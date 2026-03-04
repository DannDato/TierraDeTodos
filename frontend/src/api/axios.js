import axios from 'axios';

// armamos la ruta desde el .env
const API_URL = `${import.meta.env.VITE_API_BASE}:${import.meta.env.VITE_API_PORT}`;

// creamos una instancia de axios con la ruta base
const api = axios.create({baseURL: API_URL,});

// Interceptor para agregar el JWT a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {config.headers.Authorization = `Bearer ${token}`;}
    return config;
  },
  (error) => Promise.reject(error)
);


export default api;