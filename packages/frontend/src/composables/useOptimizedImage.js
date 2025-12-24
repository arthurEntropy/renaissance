import { computed, toValue } from 'vue'
import { getOptimizedImageUrl, getOptimizedImageUrlWithResolution } from '@/utils/imageOptimization'

export function useOptimizedImage(urlRef, context = 'medium') {
  return computed(() => {
    const url = toValue(urlRef)
    return getOptimizedImageUrl(url, context)
  })
}

export function useOptimizedImageWithResolution(urlRef, resolution, format = 'webp') {
  return computed(() => {
    const url = toValue(urlRef)
    return getOptimizedImageUrlWithResolution(url, resolution, format)
  })
}

export function useOptimizedImages(urlsRef, context = 'medium') {
  return computed(() => {
    const urls = toValue(urlsRef)
    if (!Array.isArray(urls)) {
      return []
    }
    return urls.map(url => getOptimizedImageUrl(url, context))
  })
}

export function useResponsiveOptimizedImage(urlRef, sizeRef, contextMap = {}) {
  return computed(() => {
    const url = toValue(urlRef)
    const size = toValue(sizeRef)
    const context = contextMap[size] || size || 'medium'
    return getOptimizedImageUrl(url, context)
  })
}
