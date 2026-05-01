const api = require('../../utils/api.js')
const auth = require('../../utils/auth.js')
const { normalizeImageUrl } = require('../../utils/url.js')

function formatViewedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

Page({
  data: {
    navTopPadding: 32,
    activeTab: 'article',
    articleItems: [],
    elfItems: [],
    loading: false
  },

  onLoad() {
    this.syncSafeTopPadding()
  },

  onShow() {
    this.loadHistory()
  },

  onPullDownRefresh() {
    this.loadHistory().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  syncSafeTopPadding() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const statusBarHeight =
        windowInfo.statusBarHeight ||
        (windowInfo.safeArea ? windowInfo.safeArea.top : 0) ||
        20
      this.setData({
        navTopPadding: statusBarHeight + 10
      })
    } catch (err) {
      this.setData({ navTopPadding: 32 })
    }
  },

  async loadHistory() {
    const user = await auth.ensureLogin()
    if (!user?.openId) return
    this.setData({ loading: true })
    try {
      const [articleRes, elfRes] = await Promise.all([
        api.getHistory({
          openId: user.openId,
          targetType: 'article',
          limit: 50
        }),
        api.getHistory({
          openId: user.openId,
          targetType: 'elf',
          limit: 50
        })
      ])

      const articleItems = (articleRes.items || [])
        .filter((item) => item.target)
        .map((item) => ({
          id: item.id,
          targetId: item.targetId,
          title: item.target.title || '未命名文章',
          thumbnail: normalizeImageUrl(item.target.thumbnail),
          summary: item.target.summary || '',
          views: item.target.views || 0,
          likes: item.target.likes || 0,
          favorites: item.target.favorites || item.target.likes || 0,
          commentCount: item.target.commentCount || 0,
          viewedAt: formatViewedAt(item.viewedAt),
          viewCount: item.viewCount || 1
        }))

      const elfItems = (elfRes.items || [])
        .filter((item) => item.target)
        .map((item) => ({
          id: item.id,
          targetId: item.targetId,
          name: item.target.name || '未命名精灵',
          avatar: normalizeImageUrl(item.target.avatar),
          rarity: item.target.rarity || '',
          element: item.target.element || '',
          group: item.target.group || '',
          viewedAt: formatViewedAt(item.viewedAt),
          viewCount: item.viewCount || 1
        }))

      const latestArticleTime = articleRes.items?.[0]?.viewedAt
        ? new Date(articleRes.items[0].viewedAt).getTime()
        : 0
      const latestElfTime = elfRes.items?.[0]?.viewedAt
        ? new Date(elfRes.items[0].viewedAt).getTime()
        : 0
      const nextTab =
        latestArticleTime === 0 && latestElfTime === 0
          ? this.data.activeTab
          : latestElfTime > latestArticleTime
            ? 'elf'
            : 'article'

      this.setData({ articleItems, elfItems, activeTab: nextTab })
    } catch (err) {
      wx.showToast({ title: '历史加载失败', icon: 'none' })
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onBackTap() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/me/index' })
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    if (!tab || tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
  },

  openArticle(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/article/index?id=${id}` })
  },

  openElf(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  },

  async clearCurrentTab() {
    const user = await auth.ensureLogin()
    if (!user?.openId) return
    const activeTab = this.data.activeTab
    const targetType = activeTab === 'elf' ? 'elf' : 'article'
    wx.showModal({
      title: '确认清空',
      content: `确定清空${activeTab === 'elf' ? '精灵' : '文章'}浏览历史吗？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await api.clearHistory({
            openId: user.openId,
            targetType
          })
          if (targetType === 'article') {
            this.setData({ articleItems: [] })
          } else {
            this.setData({ elfItems: [] })
          }
          wx.showToast({ title: '已清空', icon: 'success' })
        } catch (err) {
          wx.showToast({ title: '清空失败', icon: 'none' })
        }
      }
    })
  }
})
