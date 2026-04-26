const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const auth = require('../../utils/auth.js')
const { normalizeImageUrl } = require('../../utils/url.js')

Page({
  data: {
    hotArticles: [],
    hotElves: [],
    searchKeyword: '',
    guideCurrent: 0,
    quickCards: [
      { text: '孵蛋预测', subText: '预测精灵和孵化', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/zi-card.webp', url: '/pages/hatch/index' },
      { text: '精灵图鉴', subText: '查看精灵详情', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/lan-card.webp', url: '/pages/pokedex/index' },
      { text: '新手攻略', subText: '快速入门指南', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/lv-card.webp', url: '/pages/guide/index' },
      { text: '蛋组查询', subText: '查看精灵蛋组', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/zi-card.webp', status: 'coming' },
      { text: '全部道具', subText: '浏览道具图鉴', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/lan-card.webp', status: 'coming' },
      { text: '远行商人', subText: '商店物品查询', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/lv-card.webp', status: 'coming' }
    ]
  },

  onLoad() {
    this.fetchData()
  },

  async onShow() {
    setTabBarSelected(this, 0)
    const user = await auth.ensureLogin()
    getApp().globalData.userInfo = user
  },

  async fetchData() {
    try {
      wx.showLoading({ title: '加载中' })
      const [articles, elvesData] = await Promise.all([
        api.getArticles({ isHot: 'true', limit: 3 }),
        api.getElves({ isHot: 'true', limit: 4 })
      ])

      this.setData({
        hotArticles: (articles || []).slice(0, 3),
        hotElves: (elvesData?.items || []).map((item) => ({
          ...item,
          coverImage: normalizeImageUrl(item.coverImage),
          avatar: normalizeImageUrl(item.avatar)
        }))
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  navTo(e) {
    const { url, status } = e.currentTarget.dataset
    if (status === 'coming' || !url) {
      wx.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    // Basic navigation routing 
    if (url.includes('guide') || url.includes('hatch') || url.includes('pokedex') || url.includes('/pages/me/index')) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  goToSearch() {
    const keyword = (this.data.searchKeyword || '').trim()
    const suffix = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    wx.navigateTo({ url: `/pages/search/index${suffix}` })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || '' })
  },

  onSearchConfirm() {
    this.goToSearch()
  },

  onGuideChange(e) {
    this.setData({ guideCurrent: e.detail.current || 0 })
  },

  goElfDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})

