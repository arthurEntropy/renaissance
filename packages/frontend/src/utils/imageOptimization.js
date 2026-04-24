import {
  MIDJOURNEY_IMAGE_CONTEXTS,
  MIDJOURNEY_IMAGE_FORMATS,
  MIDJOURNEY_RESOLUTIONS
} from '@shared/constants/artConstants.js'

export function isMidjourneyUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }
  return url.includes('cdn.midjourney.com/')
}

export function optimizeMidjourneyUrl(
  url,
  resolution = MIDJOURNEY_RESOLUTIONS.MEDIUM,
  format = MIDJOURNEY_IMAGE_FORMATS.WEBP
) {
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

const IMAGE_CONTEXT_MAP = {
  [MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL]: {
    resolution: MIDJOURNEY_RESOLUTIONS.THUMBNAIL,
    format: MIDJOURNEY_IMAGE_FORMATS.WEBP
  },
  [MIDJOURNEY_IMAGE_CONTEXTS.SMALL]: {
    resolution: MIDJOURNEY_RESOLUTIONS.SMALL,
    format: MIDJOURNEY_IMAGE_FORMATS.WEBP
  },
  [MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM]: {
    resolution: MIDJOURNEY_RESOLUTIONS.MEDIUM,
    format: MIDJOURNEY_IMAGE_FORMATS.WEBP
  },
  [MIDJOURNEY_IMAGE_CONTEXTS.LARGE]: {
    resolution: MIDJOURNEY_RESOLUTIONS.LARGE,
    format: MIDJOURNEY_IMAGE_FORMATS.WEBP
  },
  [MIDJOURNEY_IMAGE_CONTEXTS.XLARGE]: {
    resolution: MIDJOURNEY_RESOLUTIONS.XLARGE,
    format: MIDJOURNEY_IMAGE_FORMATS.WEBP
  }
}

export function getOptimizedImageUrl(url, context = MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM) {
  if (!isMidjourneyUrl(url)) {
    return url
  }

  const config = IMAGE_CONTEXT_MAP[context] || IMAGE_CONTEXT_MAP[MIDJOURNEY_IMAGE_CONTEXTS.MEDIUM]
  return optimizeMidjourneyUrl(url, config.resolution, config.format)
}

export function getOptimizedImageUrlWithResolution(
  url,
  resolution,
  format = MIDJOURNEY_IMAGE_FORMATS.WEBP
) {
  if (!isMidjourneyUrl(url)) {
    return url
  }
  return optimizeMidjourneyUrl(url, resolution, format)
}
