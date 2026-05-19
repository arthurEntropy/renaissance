import { watch, onUnmounted } from 'vue'

export function useImagePreloader(imagesRef, currentIndexRef, context, optimizeFn) {
  const preloadCache = new Map()

  const preloadImage = (url) => {
    if (!url || preloadCache.has(url)) return

    const img = new Image()
    img.src = url
    preloadCache.set(url, img)
  }

  const preloadAdjacentImages = () => {
    const images = imagesRef.value
    const currentIndex = currentIndexRef.value

    if (!images || images.length === 0) return

    // Get previous and next indices (wrapping around)
    const prevIndex = (currentIndex - 1 + images.length) % images.length
    const nextIndex = (currentIndex + 1) % images.length

    // Preload previous and next images
    if (images.length > 1) {
      const prevUrl = optimizeFn(images[prevIndex], context)
      const nextUrl = optimizeFn(images[nextIndex], context)
      
      preloadImage(prevUrl)
      preloadImage(nextUrl)
    }
  }

  // Watch for changes to current index or images array
  watch([currentIndexRef, imagesRef], () => {
    preloadAdjacentImages()
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(() => {
    preloadCache.clear()
  })

  return {
    preloadAdjacentImages
  }
}

export function useImageListPreloader(imagesRef) {
  const preloadCache = new Map()

  const preloadImage = (url) => {
    if (!url || preloadCache.has(url)) return

    const img = new Image()
    img.src = url
    preloadCache.set(url, img)
  }

  const preloadImages = (images) => {
    if (!Array.isArray(images) || images.length === 0) return

    images.forEach(preloadImage)
  }

  watch(imagesRef, (images) => {
    preloadImages(images)
  }, { immediate: true })

  onUnmounted(() => {
    preloadCache.clear()
  })

  return {
    preloadImages
  }
}
