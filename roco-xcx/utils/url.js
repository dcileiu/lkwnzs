const CDN_BASE_URL = 'https://wallpaper.cdn.itianci.cn'
const CDN_HOSTS = ['wallpaper.cdn.itianci.cn']

function safeDecode(value = '') {
  try {
    return decodeURIComponent(value)
  } catch (e) {
    return value
  }
}

function normalizeJinglingFilename(segment = '', rawSegments = [], index = -1) {
  const parent = safeDecode(rawSegments[index - 1] || '')
  const grandParent = safeDecode(rawSegments[index - 2] || '')

  if (grandParent !== 'imgs' || parent !== 'jingling') {
    return segment
  }

  return segment.replace(/[（）()]/g, '')
}

function normalizePath(pathname = '') {
  return pathname
    .split('/')
    .map((segment, index, segments) => {
      if (!segment) return segment

      const decodedSegment = safeDecode(segment)
      const normalizedSegment = normalizeJinglingFilename(decodedSegment, segments, index)
      return encodeURIComponent(normalizedSegment)
    })
    .join('/')
}

function normalizeImageUrl(url = '') {
  if (!url || typeof url !== 'string') return url

  const fixedExt = url.replace(/\.wepb(\?|#|$)/i, '.webp$1')
  const queryIndex = fixedExt.search(/[?#]/)
  const pathWithoutQuery = queryIndex === -1 ? fixedExt : fixedExt.slice(0, queryIndex)
  const suffix = queryIndex === -1 ? '' : fixedExt.slice(queryIndex)

  if (!/^https?:\/\//i.test(pathWithoutQuery)) {
    const pathname = normalizePath(pathWithoutQuery)
    return `${CDN_BASE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}${suffix}`
  }

  const matched = pathWithoutQuery.match(/^(https?:\/\/[^/]+)(\/.*)?$/i)
  if (!matched) return fixedExt

  const host = matched[1]
  const pathname = matched[2] || ''
  const hostname = host.replace(/^https?:\/\//i, '').toLowerCase()

  if (CDN_HOSTS.includes(hostname)) {
    return `${CDN_BASE_URL}${normalizePath(pathname)}${suffix}`
  }

  return `${host}${normalizePath(pathname)}${suffix}`
}

module.exports = {
  CDN_BASE_URL,
  normalizeImageUrl
}
