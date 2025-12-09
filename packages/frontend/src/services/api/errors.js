export class ApiError extends Error {
  constructor(message, type, statusCode = null, originalError = null) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = statusCode
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    }
  }
}

export class NetworkError extends ApiError {
  constructor(message, originalError = null) {
    super(message, 'NETWORK', null, originalError)
    this.name = 'NetworkError'
  }
}

export class AuthError extends ApiError {
  constructor(message, statusCode = 401, originalError = null) {
    super(message, 'AUTH', statusCode, originalError)
    this.name = 'AuthError'
  }
}

export class ValidationError extends ApiError {
  constructor(message, errors = [], originalError = null) {
    super(message, 'VALIDATION', 400, originalError)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class NotFoundError extends ApiError {
  constructor(resource, id = null, originalError = null) {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404, originalError)
    this.name = 'NotFoundError'
    this.resource = resource
    this.id = id
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'Request timed out', originalError = null) {
    super(message, 'TIMEOUT', 408, originalError)
    this.name = 'TimeoutError'
  }
}

export class ServerError extends ApiError {
  constructor(message, statusCode = 500, originalError = null) {
    super(message, 'SERVER', statusCode, originalError)
    this.name = 'ServerError'
  }
}

export class CancelledError extends ApiError {
  constructor(message = 'Request was cancelled', originalError = null) {
    super(message, 'CANCELLED', null, originalError)
    this.name = 'CancelledError'
  }
}

export function transformError(error) {
  // Request was cancelled
  if (error.code === 'ERR_CANCELED' || error.message?.includes('cancel')) {
    return new CancelledError('Request was cancelled', error)
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new TimeoutError('Request timed out', error)
  }

  // Response errors
  if (error.response) {
    const { status, data } = error.response
    const message = data?.error || data?.message || error.message

    // Auth errors
    if (status === 401 || status === 403) {
      return new AuthError(message, status, error)
    }

    // Not found
    if (status === 404) {
      return new NotFoundError(message, null, error)
    }

    // Validation errors
    if (status === 400 || status === 422) {
      return new ValidationError(message, data?.errors || [], error)
    }

    // Server errors
    if (status >= 500) {
      return new ServerError(message, status, error)
    }

    // Other response errors
    return new ApiError(message, 'RESPONSE', status, error)
  }

  // Network errors (no response)
  if (error.request) {
    return new NetworkError('Network error - no response from server', error)
  }

  // Request setup errors
  return new ApiError(error.message, 'REQUEST', null, error)
}
