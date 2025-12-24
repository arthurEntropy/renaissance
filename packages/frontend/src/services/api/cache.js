class ApiCache {
  constructor(options = {}) {
    this.cache = new Map()
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000
  }

  _generateKey(method, url, params = null) {
    const paramsString = params ? JSON.stringify(params) : ''
    return `${method.toUpperCase()}:${url}${paramsString}`
  }

  get(method, url, params = null) {
    const key = this._generateKey(method, url, params)
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, cached)

    return cached.data
  }

  set(method, url, data, params = null, ttl = null) {
    const key = this._generateKey(method, url, params)
    const expiresAt = Date.now() + (ttl || this.defaultTTL)

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expiresAt,
      cachedAt: Date.now()
    })
  }

  invalidate(method, url, params = null) {
    const key = this._generateKey(method, url, params)
    this.cache.delete(key)
  }

  invalidatePattern(urlPattern) {
    const regex = new RegExp(urlPattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        cachedAt: new Date(value.cachedAt).toISOString(),
        expiresAt: new Date(value.expiresAt).toISOString(),
        isExpired: Date.now() > value.expiresAt
      }))
    }
  }
}

// Singleton instance
const apiCache = new ApiCache({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000 // 5 minutes
})

export default apiCache
