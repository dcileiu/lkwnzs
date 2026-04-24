const api = require('../../utils/api.js')
const { normalizeImageUrl } = require('../../utils/url.js')

Page({
  data: {
    keyword: '',
    activeTab: 'all',
    loading: false,
    articles: [],
    elves: []
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options?.keyword || '')
    this.setData({ keyword }, () => {
      if (keyword) {
        this.searchAll()
      }
    })
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value || '' })
  },

  onConfirmSearch() {
    this.searchAll()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab || tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
  },

  async searchAll() {
    const keyword = (this.data.keyword || '').trim()
    if (!keyword) {
      wx.showToast({ title: '请输入关键词', icon: 'none' })
      this.setData({ articles: [], elves: [] })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '搜索中...' })

    try {
      const [articles, elvesData] = await Promise.all([
        api.getArticles({ keyword }),
        api.getElves({ keyword })
      ])

      this.setData({
        articles: Array.isArray(articles) ? articles : [],
        elves: (elvesData?.items || []).map((item) => ({
          ...item,
          coverImage: normalizeImageUrl(item.coverImage),
          avatar: normalizeImageUrl(item.avatar)
        }))
      })
    } catch (error) {
      console.error(error)
    } finally {
      this.setData({ loading: false })
      wx.hideLoading()
    }
  },

  goArticleDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/article/index?id=${id}` })
  },

  goElfDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
