import { MIDJOURNEY_RESOLUTIONS } from '@shared/constants/artConstants.js'

export function isMidjourneyUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }
  return url.includes('cdn.midjourney.com/')
}

export function optimizeMidjourneyUrl(url, resolution = MIDJOURNEY_RESOLUTIONS.MEDIUM, format = 'webp') {
  if (!url || !isMidjourneyUrl(url)) {
    return url
  }

  if (!Object.values(MIDJOURNEY_RESOLUTIONS).includes(resolution)) {
    console.warn(`[imageOptimization] Invalid resolution ${resolution}, defaulting to ${MIDJOURNEY_RESOLUTIONS.MEDIUM}`)
    resolution = MIDJOURNEY_RESOLUTIONS.MEDIUM
  }

  const pattern = /^https:\/\/cdn\.midjourney\.com\/([\w-]+)\/([^/?#]+)\.(png|jpeg|jpg)(?:[?#].*)?$/i
  const match = url.match(pattern)

  if (!match) {
    console.warn('[imageOptimization] Could not parse Midjourney URL:', url)
    return url
  }

  const [, uuid, imageId] = match
  const gridIndex = imageId.replace(/_\d+_[A-Za-z]$/, '')

  return `https://cdn.midjourney.com/${uuid}/${gridIndex}_${resolution}_N.${format}`
}

export function getOptimizedImageUrl(url, context = 'medium') {
  if (!isMidjourneyUrl(url)) {
    return url
  }

  const contextMap = {
    'thumbnail': { resolution: MIDJOURNEY_RESOLUTIONS.THUMBNAIL, format: 'webp' },
    'small': { resolution: MIDJOURNEY_RESOLUTIONS.SMALL, format: 'webp' },
    'medium': { resolution: MIDJOURNEY_RESOLUTIONS.MEDIUM, format: 'webp' },
    'large': { resolution: MIDJOURNEY_RESOLUTIONS.LARGE, format: 'webp' },
    'xlarge': { resolution: MIDJOURNEY_RESOLUTIONS.XLARGE, format: 'webp' }
  }

  const config = contextMap[context] || contextMap.medium
  return optimizeMidjourneyUrl(url, config.resolution, config.format)
}

export function getOptimizedImageUrlWithResolution(url, resolution, format = 'webp') {
  if (!isMidjourneyUrl(url)) {
    return url
  }
  return optimizeMidjourneyUrl(url, resolution, format)
}
