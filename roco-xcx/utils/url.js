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
    return `${normalizePath(pathWithoutQuery)}${suffix}`
  }

  const matched = pathWithoutQuery.match(/^(https?:\/\/[^/]+)(\/.*)?$/i)
  if (!matched) return fixedExt

  const host = matched[1]
  const pathname = matched[2] || ''

  return `${host}${normalizePath(pathname)}${suffix}`
}

module.exports = {
  normalizeImageUrl
}
