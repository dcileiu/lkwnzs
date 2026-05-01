const LIKE_IDS_KEY = 'liked_article_ids'
const FAVORITE_IDS_KEY = 'favorited_article_ids'
const ARTICLE_CACHE_KEY = 'user_article_cache'

function getArray(key) {
  const value = wx.getStorageSync(key)
  return Array.isArray(value) ? value : []
}

function setArray(key, arr) {
  wx.setStorageSync(key, arr)
}

function getArticleCache() {
  const cache = wx.getStorageSync(ARTICLE_CACHE_KEY)
  return cache && typeof cache === 'object' ? cache : {}
}

function setArticleCache(cache) {
  wx.setStorageSync(ARTICLE_CACHE_KEY, cache)
}

function saveArticleSnapshot(article) {
  if (!article || !article.id) return
  const cache = getArticleCache()
  cache[article.id] = {
    id: article.id,
    title: article.title,
    category: article.category,
    thumbnail: article.thumbnail,
    views: article.views,
    likes: article.likes,
    readingTime: article.readingTime,
    createdAt: article.createdAt,
  }
  setArticleCache(cache)
}

function toggle(type, article) {
  if (!article || !article.id) return false

  saveArticleSnapshot(article)

  const key = type === 'like' ? LIKE_IDS_KEY : FAVORITE_IDS_KEY
  const ids = getArray(key)
  const index = ids.indexOf(article.id)

  if (index >= 0) {
    ids.splice(index, 1)
    setArray(key, ids)
    return false
  }

  ids.unshift(article.id)
  setArray(key, ids)
  return true
}

function getArticlesByType(type) {
  const ids = getArray(type === 'like' ? LIKE_IDS_KEY : FAVORITE_IDS_KEY)
  const cache = getArticleCache()
  return ids.map((id) => cache[id]).filter(Boolean)
}

function getIdsByType(type) {
  return getArray(type === 'like' ? LIKE_IDS_KEY : FAVORITE_IDS_KEY)
}

function setInteractionState(type, articleId, active) {
  if (!articleId) return
  const key = type === 'like' ? LIKE_IDS_KEY : FAVORITE_IDS_KEY
  const ids = getArray(key)
  const index = ids.indexOf(articleId)
  if (active) {
    if (index < 0) {
      ids.unshift(articleId)
    }
  } else if (index >= 0) {
    ids.splice(index, 1)
  }
  setArray(key, ids)
}

function getStats() {
  return {
    likes: getArray(LIKE_IDS_KEY).length,
    favorites: getArray(FAVORITE_IDS_KEY).length,
  }
}

function isLiked(articleId) {
  return getArray(LIKE_IDS_KEY).includes(articleId)
}

function isFavorited(articleId) {
  return getArray(FAVORITE_IDS_KEY).includes(articleId)
}

module.exports = {
  toggleLike(article) {
    return toggle('like', article)
  },
  toggleFavorite(article) {
    return toggle('favorite', article)
  },
  getStats,
  getLikedArticles() {
    return getArticlesByType('like')
  },
  getLikedArticleIds() {
    return getIdsByType('like')
  },
  getFavoritedArticles() {
    return getArticlesByType('favorite')
  },
  getFavoritedArticleIds() {
    return getIdsByType('favorite')
  },
  setLikeState(articleId, active) {
    setInteractionState('like', articleId, active)
  },
  setFavoriteState(articleId, active) {
    setInteractionState('favorite', articleId, active)
  },
  isLiked,
  isFavorited,
  saveArticleSnapshot,
}
