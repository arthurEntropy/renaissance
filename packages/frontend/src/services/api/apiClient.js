import axios from 'axios'
import AuthService from '../auth/authService'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Add authentication token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AuthService.getIdToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    } catch (error) {
      console.error('Error getting auth token for request:', error)
      return config
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Handle common error cases
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors with context
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      })
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', {
        message: error.message,
        url: error.config?.url
      })
    } else {
      // Error in request setup
      console.error('Request Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
