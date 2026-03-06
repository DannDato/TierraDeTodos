import axios from 'axios';

// Armamos la ruta desde el .env
const API_URL = `${import.meta.env.VITE_API_BASE}:${import.meta.env.VITE_API_PORT}`;

// Creamos una instancia de axios con la ruta base y el timeout global
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Si el servidor no responde en este tiempo la petición se cancela.
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar el JWT a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejar errores globales (como el Timeout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      error.message = "El servidor está tardando demasiado en responder. Revisa tu conexión.";
    }
    // Si el error es 401 (Token expirado o inválido) podrías limpiar el localStorage aquí
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;