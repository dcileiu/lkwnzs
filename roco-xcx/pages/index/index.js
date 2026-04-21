const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')

Page({
  data: {
    hotArticles: [],
    hotElves: []
  },

  onLoad() {
    this.fetchData()
  },

  onShow() {
    setTabBarSelected(this, 0)
  },

  async fetchData() {
    try {
      wx.showLoading({ title: '加载中' })
      const [articles, elvesData] = await Promise.all([
        api.getArticles({ isHot: 'true', limit: 3 }),
        api.getElves({ isHot: 'true', limit: 4 })
      ])
      
      this.setData({
        hotArticles: articles || [],
        hotElves: elvesData?.items || []
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  navTo(e) {
    const url = e.currentTarget.dataset.url
    // Basic navigation routing 
    if (url.includes('guide') || url.includes('hatch') || url.includes('pokedex') || url.includes('collection')) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  goToSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },

  goElfDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
