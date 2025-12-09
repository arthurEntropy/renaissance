import axios from 'axios'
import AuthService from '../auth/authService'
import apiCache from './cache'
import { transformError } from './errors'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Track active requests for cancellation
const activeRequests = new Map()

function getCancelToken(config) {
  // Generate request ID from method + url
  const requestId = `${config.method}:${config.url}`
  
  // Only auto-cancel if explicitly requested via config.cancelDuplicates
  if (config.cancelDuplicates && activeRequests.has(requestId)) {
    const existingController = activeRequests.get(requestId)
    existingController.abort()
  }
  
  // Create new AbortController
  const controller = new AbortController()
  activeRequests.set(requestId, controller)
  
  return controller
}

// Request interceptor: Add auth token, handle caching, request cancellation
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Add authentication token
      const token = await AuthService.getIdToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Check cache for GET requests (unless explicitly disabled)
      if (config.method === 'get' && config.cache !== false) {
        const cached = apiCache.get('get', config.url, config.params)
        if (cached) {
          // Return cached response (throw to skip actual request)
          return Promise.reject({
            __cached: true,
            data: cached,
            config
          })
        }
      }

      // Add cancellation support (unless explicitly disabled)
      if (config.cancellable !== false) {
        const controller = getCancelToken(config)
        config.signal = controller.signal
      }

      return config
    } catch (error) {
      console.error('Error in request interceptor:', error)
      return config
    }
  },
  (error) => {
    return Promise.reject(transformError(error))
  }
)

// Response interceptor: Cache responses, transform errors, cleanup
apiClient.interceptors.response.use(
  (response) => {
    const { config, data } = response

    // Cache GET responses (unless explicitly disabled)
    if (config.method === 'get' && config.cache !== false) {
      const ttl = config.cacheTTL || undefined // Use default if not specified
      apiCache.set('get', config.url, data, config.params, ttl)
    }

    // Invalidate cache for mutation operations
    if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
      // Invalidate related GET requests
      const baseUrl = config.url.split('?')[0].replace(/\/[^/]+$/, '') // Remove ID from URL
      apiCache.invalidatePattern(baseUrl)
    }

    // Remove from active requests
    const requestId = `${config.method}:${config.url}`
    activeRequests.delete(requestId)

    return response
  },
  (error) => {
    // Handle cached responses
    if (error.__cached) {
      return Promise.resolve({ data: error.data, config: error.config, fromCache: true })
    }

    // Clean up active request tracking
    if (error.config) {
      const requestId = `${error.config.method}:${error.config.url}`
      activeRequests.delete(requestId)
    }

    // Transform error into typed error class
    const transformedError = transformError(error)

    // Log errors with context (except cancellations)
    if (transformedError.type !== 'CANCELLED') {
      console.error(`API ${transformedError.type} Error:`, {
        message: transformedError.message,
        status: transformedError.statusCode,
        url: error.config?.url,
        type: transformedError.type
      })
    }

    return Promise.reject(transformedError)
  }
)

export function cancelAllRequests() {
  for (const [requestId, controller] of activeRequests.entries()) {
    controller.abort()
    activeRequests.delete(requestId)
  }
}

export function cancelRequest(method, url) {
  const requestId = `${method}:${url}`
  const controller = activeRequests.get(requestId)
  if (controller) {
    controller.abort()
    activeRequests.delete(requestId)
  }
}

export default apiClient
