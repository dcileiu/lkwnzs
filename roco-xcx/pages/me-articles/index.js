const userActions = require('../../utils/user-actions.js')
const api = require('../../utils/api.js')

Page({
  data: {
    title: '我的文章',
    articles: [],
  },

  onLoad(options) {
    this.type = options.type === 'favorite' ? 'favorite' : 'like'
    const title = this.type === 'favorite' ? '我收藏的文章' : '我点赞的文章'
    this.setData({ title })
    wx.setNavigationBarTitle({ title })
    this.loadArticles()
  },

  onShow() {
    this.loadArticles()
  },

  async loadArticles() {
    const ids = this.type === 'favorite'
      ? userActions.getFavoritedArticleIds()
      : userActions.getLikedArticleIds()

    if (!ids.length) {
      this.setData({ articles: [] })
      return
    }

    try {
      const visibleArticles = await api.getArticles({
        ids: ids.join(','),
        limit: ids.length
      })
      const visibleMap = new Map((visibleArticles || []).map((item) => [item.id, item]))
      const orderedVisible = ids.map((id) => visibleMap.get(id)).filter(Boolean)
      this.setData({ articles: orderedVisible })
    } catch (error) {
      console.error(error)
      this.setData({ articles: [] })
    }
  },

  openArticle(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/article/index?id=${id}` })
  }
})
