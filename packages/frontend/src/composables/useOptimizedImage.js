import { computed, onUnmounted, ref, toValue, watch } from 'vue'
import { getOptimizedImageUrl, getOptimizedImageUrlWithResolution } from '@/utils/imageOptimization'
import {
  MIDJOURNEY_IMAGE_CONTEXTS,
  MIDJOURNEY_IMAGE_FORMATS
} from '@shared/constants/artConstants.js'

export function useOptimizedImage(urlRef, context = MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM) {
  return computed(() => {
    const url = toValue(urlRef)
    return getOptimizedImageUrl(url, context)
  })
}

export function useOptimizedImageWithResolution(
  urlRef,
  resolution,
  format = MIDJOURNEY_IMAGE_FORMATS.WEBP
) {
  return computed(() => {
    const url = toValue(urlRef)
    return getOptimizedImageUrlWithResolution(url, resolution, format)
  })
}

export function useOptimizedImages(urlsRef, context = MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM) {
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
    const context = contextMap[size] || size || MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM
    return getOptimizedImageUrl(url, context)
  })
}

export function useProgressiveOptimizedImage(
  urlRef,
  {
    previewContext = MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM,
    finalContext = MIDJOURNEY_IMAGE_CONTEXTS.XLARGE
  } = {}
) {
  const previewUrl = computed(() => {
    const url = toValue(urlRef)
    return getOptimizedImageUrl(url, previewContext)
  })

  const finalUrl = computed(() => {
    const url = toValue(urlRef)
    return getOptimizedImageUrl(url, finalContext)
  })

  const isProgressive = computed(() => previewUrl.value !== finalUrl.value)
  const isFinalLoaded = ref(false)

  let activeLoader = null
  let requestId = 0

  const cleanupLoader = () => {
    if (!activeLoader) return
    activeLoader.onload = null
    activeLoader.onerror = null
    activeLoader = null
  }

  const preloadFinalImage = () => {
    const targetFinalUrl = finalUrl.value

    if (!targetFinalUrl) {
      isFinalLoaded.value = false
      cleanupLoader()
      return
    }

    if (!isProgressive.value) {
      isFinalLoaded.value = true
      cleanupLoader()
      return
    }

    isFinalLoaded.value = false
    const currentRequestId = ++requestId
    cleanupLoader()

    const img = new Image()
    img.decoding = 'async'
    activeLoader = img

    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode()
        }
      } catch {
        // Ignore decode failures and still upgrade to the loaded full image.
      }

      if (currentRequestId !== requestId) return
      isFinalLoaded.value = true
    }

    img.onerror = () => {
      if (currentRequestId !== requestId) return
      isFinalLoaded.value = false
    }

    img.src = targetFinalUrl
  }

  watch([previewUrl, finalUrl], preloadFinalImage, { immediate: true })

  onUnmounted(() => {
    requestId += 1
    cleanupLoader()
  })

  const activeUrl = computed(() => (isFinalLoaded.value ? finalUrl.value : previewUrl.value))

  return {
    previewUrl,
    finalUrl,
    activeUrl,
    isProgressive,
    isFinalLoaded
  }
}
