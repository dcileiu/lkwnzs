const api = require('./api.js')

const SYSTEM_CONFIGS_CACHE_KEY = 'system_configs_cache'
const ARTICLE_FLAG_CACHE_KEY = 'article_feature_visible'

function getSystemConfigsCache() {
  const configs = wx.getStorageSync(SYSTEM_CONFIGS_CACHE_KEY)
  return Array.isArray(configs) ? configs : []
}

function getArticleFeatureVisible() {
  return Boolean(wx.getStorageSync(ARTICLE_FLAG_CACHE_KEY))
}

function syncArticleFlagFromConfigs(configs = []) {
  const articleFlagVisible = Boolean(configs[1] && configs[1].isVisible)
  wx.setStorageSync(ARTICLE_FLAG_CACHE_KEY, articleFlagVisible)
  return articleFlagVisible
}

function setSystemConfigsCache(configs = []) {
  wx.setStorageSync(SYSTEM_CONFIGS_CACHE_KEY, configs)
  return syncArticleFlagFromConfigs(configs)
}

async function refreshSystemConfigs() {
  const configs = await api.getSystemConfigs({ includeHidden: 'true' })
  const list = Array.isArray(configs) ? configs : []
  const articleFlagVisible = setSystemConfigsCache(list)
  return { configs: list, articleFlagVisible }
}

module.exports = {
  SYSTEM_CONFIGS_CACHE_KEY,
  ARTICLE_FLAG_CACHE_KEY,
  getSystemConfigsCache,
  getArticleFeatureVisible,
  setSystemConfigsCache,
  refreshSystemConfigs,
}
