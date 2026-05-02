const userActions = require('../../utils/user-actions.js')
const api = require('../../utils/api.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    title: '我的文章',
    articles: [],
    navTopPadding: 32,
    loading: false,
  },

  onLoad(options) {
    this.syncSafeTopPadding()
    this.type = options.type === 'favorite' ? 'favorite' : 'like'
    const title = this.type === 'favorite' ? '我收藏的文章' : '我点赞的文章'
    this.setData({ title })
    this.loadArticles()
  },

  onShow() {
    this.loadArticles()
  },

  syncSafeTopPadding() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const statusBarHeight =
        windowInfo.statusBarHeight ||
        (windowInfo.safeArea ? windowInfo.safeArea.top : 0) ||
        20
      this.setData({ navTopPadding: statusBarHeight + 10 })
    } catch (err) {
      this.setData({ navTopPadding: 32 })
    }
  },

  async loadArticles() {
    let ids = this.type === 'favorite'
      ? userActions.getFavoritedArticleIds()
      : userActions.getLikedArticleIds()

    try {
      const user = await auth.ensureLogin()
      if (user?.openId) {
        const stats = await api.getUserArticleStats({ openId: user.openId })
        ids = this.type === 'favorite'
          ? (stats.favoritedArticleIds || [])
          : (stats.likedArticleIds || [])
      }
    } catch (error) {
      console.warn('fetch interaction ids failed, fallback to local cache', error)
    }

    if (!ids.length) {
      this.setData({ articles: [], loading: false })
      return
    }

    try {
      this.setData({ loading: true })
      const visibleArticles = await api.getArticles({
        ids: ids.join(','),
        limit: ids.length
      })
      const visibleMap = new Map((visibleArticles || []).map((item) => [item.id, item]))
      const orderedVisible = ids
        .map((id) => visibleMap.get(id))
        .filter(Boolean)
        .map((item) => ({
          ...item,
          summary: item.summary || '',
          views: item.views || 0,
          likes: item.likes || 0,
          favorites: item.favorites || item.likes || 0,
          commentCount: item.commentCount || 0,
        }))
      this.setData({ articles: orderedVisible, loading: false })
    } catch (error) {
      console.error(error)
      this.setData({ articles: [], loading: false })
    }
  },

  openArticle(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/article/index?id=${id}` })
  },

  onBackTap() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/me/index' })
  }
})
