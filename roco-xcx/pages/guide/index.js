const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')

Page({
  data: {
    tabs: ['全部', '新手入门', '精灵攻略', '战斗技巧', '活动攻略'],
    currentTab: '全部',
    articles: [],
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
      const res = await api.getArticles({
        category: this.data.currentTab,
        // keyword: this.data.keyword // Optional future implementation
      })
      this.setData({ articles: res || [] })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (this.data.currentTab === tab) return
    this.setData({ currentTab: tab, articles: [] })
    this.fetchArticles()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    // Re-fetch with search param if API supported keyword
    this.fetchArticles()
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/article/index?id=${id}`
    })
  },

  loadMore() {
    // Pagination logic (Optional)
    console.log('Load more guides...')
  }
})
