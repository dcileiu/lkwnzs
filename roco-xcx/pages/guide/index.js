const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const { normalizeImageUrl } = require('../../utils/url.js')

function formatArticle(item = {}) {
  const authorName =
    item.sourceName ||
    item.source ||
    (item.author && item.author.name) ||
    '洛克攻略组'

  return {
    ...item,
    thumbnail: normalizeImageUrl(item.thumbnail) || '/assets/articles.webp',
    summary: item.summary || item.description || '零氪玩家也能快速上手，核心思路与阵容推荐一篇看懂。',
    authorName,
    views: item.views || 0,
    likes: item.likes || item.favorites || 0,
    commentCount: Array.isArray(item.comments) ? item.comments.length : (item.commentCount || 0)
  }
}

Page({
  data: {
    tabs: ['全部', '新手入门', '精灵攻略', '战斗技巧', '活动攻略'],
    currentTab: '全部',
    guideCurrent: 0,
    featuredArticles: [],
    hotArticles: [],
    keyword: ''
  },

  onLoad() {
    this.fetchArticles()
  },

  onShow() {
    setTabBarSelected(this, 1)
  },

  async fetchArticles() {
    try {
      wx.showLoading({ title: '加载中' })

      const params = {
        limit: 10
      }

      if (this.data.currentTab !== '全部') {
        params.category = this.data.currentTab
      }

      const keyword = (this.data.keyword || '').trim()
      if (keyword) {
        params.keyword = keyword
      }

      const res = await api.getArticles(params)
      const items = (res || []).map(formatArticle)
      const featuredArticles = items.slice(0, 3)
      const hotArticles = items.length > 3 ? items.slice(3, 8) : items.slice(0, 5)

      this.setData({
        guideCurrent: 0,
        featuredArticles,
        hotArticles
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (this.data.currentTab === tab) return

    this.setData({
      currentTab: tab,
      guideCurrent: 0,
      featuredArticles: [],
      hotArticles: []
    })

    this.fetchArticles()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' })
  },

  onSearch() {
    this.fetchArticles()
  },

  onGuideChange(e) {
    this.setData({ guideCurrent: e.detail.current || 0 })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/article/index?id=${id}`
    })
  }
})
