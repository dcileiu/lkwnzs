const userActions = require('../../utils/user-actions.js')

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

  loadArticles() {
    const articles = this.type === 'favorite'
      ? userActions.getFavoritedArticles()
      : userActions.getLikedArticles()

    this.setData({ articles })
  },

  openArticle(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/article/index?id=${id}` })
  }
})
