function normalizeImageUrl(url = '') {
  if (!url || typeof url !== 'string') return url
  const fixedExt = url.replace(/\.wepb(\?|#|$)/i, '.webp$1')

  if (!/^https?:\/\//i.test(fixedExt)) {
    return fixedExt
  }

  const parts = fixedExt.split('://')
  if (parts.length < 2) return fixedExt

  const protocol = parts[0]
  const rest = parts.slice(1).join('://')
  const slashIndex = rest.indexOf('/')
  if (slashIndex === -1) return fixedExt

  const host = rest.slice(0, slashIndex)
  const pathWithQuery = rest.slice(slashIndex)
  const queryIndex = pathWithQuery.search(/[?#]/)
  const purePath = queryIndex === -1 ? pathWithQuery : pathWithQuery.slice(0, queryIndex)
  const suffix = queryIndex === -1 ? '' : pathWithQuery.slice(queryIndex)

  const encodedPath = purePath
    .split('/')
    .map((segment) => {
      if (!segment) return segment
      try {
        return encodeURIComponent(decodeURIComponent(segment))
      } catch (e) {
        return encodeURIComponent(segment)
      }
    })
    .join('/')

  return `${protocol}://${host}${encodedPath}${suffix}`
}

module.exports = {
  normalizeImageUrl
}
