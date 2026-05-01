const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const auth = require('../../utils/auth.js')
const { normalizeImageUrl } = require('../../utils/url.js')
const {
  getArticleFeatureVisible,
  refreshSystemConfigs
} = require('../../utils/system-config.js')

const NOTICE_ACK_TIME_CACHE_KEY = 'home_notice_ack_updated_at'

Page({
  data: {
    hotArticles: [],
    hotElves: [],
    articleFeatureVisible: false,
    searchKeyword: '',
    guideCurrent: 0,
    quickCards: [
      { text: '精灵图鉴', subText: '查看精灵详情', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/jinglingtuji.webp', url: '/pages/pokedex/index' },
      { text: '蛋组配对', subText: '查看精灵蛋组', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/danzupeidui.webp', url: '/pages/egg-groups/index' },
      { text: '全部道具', subText: '浏览道具图鉴', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/quanbudaoju.webp', url: '/pages/items/index' },
      { text: '远行商人', subText: '商店物品查询', bg: 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/yuanxingshangren.webp', url: '/pages/shop/index' }
    ]
  },

  async onLoad() {
    await this.syncSystemConfigs()
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
      const articleFeatureVisible = getArticleFeatureVisible()
      const [articles, elvesData] = await Promise.all([
        articleFeatureVisible ? api.getArticles({ isHot: 'true', limit: 3 }) : Promise.resolve([]),
        api.getElves({ isHot: 'true', limit: 4 })
      ])

      this.setData({
        articleFeatureVisible,
        hotArticles: (articles || []).slice(0, 3),
        hotElves: (elvesData?.items || []).map((item) => ({
          ...item,
          coverImage: normalizeImageUrl(item.coverImage),
          avatar: normalizeImageUrl(item.avatar)
        }))
      })
      const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
      if (tabBar && typeof tabBar.setGuideTabVisible === 'function') {
        tabBar.setGuideTabVisible(articleFeatureVisible)
      }
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  async syncSystemConfigs() {
    try {
      const { configs, articleFlagVisible } = await refreshSystemConfigs()
      this.setData({ articleFeatureVisible: articleFlagVisible })
      const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
      if (tabBar && typeof tabBar.setGuideTabVisible === 'function') {
        tabBar.setGuideTabVisible(articleFlagVisible)
      }
      this.tryShowAnnouncement(configs)
    } catch (err) {
      this.setData({ articleFeatureVisible: false })
      wx.setStorageSync('article_feature_visible', false)
    }
  },

  tryShowAnnouncement(configs = []) {
    if (!Array.isArray(configs) || configs.length === 0) return

    const notice = configs[0] || {}
    const noticeContent = String(notice.content || '').trim()
    const noticeUpdatedAt = String(notice.updatedAt || '').trim()
    const cachedUpdatedAt = String(wx.getStorageSync(NOTICE_ACK_TIME_CACHE_KEY) || '').trim()

    if (!noticeContent || !noticeUpdatedAt) return
    if (noticeUpdatedAt === cachedUpdatedAt) return

    wx.showModal({
      title: '公告',
      content: noticeContent,
      showCancel: false,
      confirmText: '我知道了',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync(NOTICE_ACK_TIME_CACHE_KEY, noticeUpdatedAt)
        }
      }
    })
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

