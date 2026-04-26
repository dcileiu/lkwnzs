const api = require('../../utils/api.js')
const { normalizeImageUrl } = require('../../utils/url.js')

function buildElfCard(item = {}) {
  return {
    ...item,
    imageUrl: normalizeImageUrl(item.image),
    attrNames: Array.isArray(item.attrNames) ? item.attrNames : [],
    attributes: Array.isArray(item.attributes) ? item.attributes : [],
    fallbackText: item.name ? String(item.name).charAt(0) : '灵'
  }
}

function buildGroup(item = {}) {
  const elves = Array.isArray(item.elves) ? item.elves.map((elf) => buildElfCard(elf)) : []
  return {
    ...item,
    elves,
    count: item.count || elves.length
  }
}

Page({
  data: {
    groups: [],
    currentGroupId: '',
    currentGroup: null,
    totalGroups: 0,
    totalElves: 0,
    navTopPadding: 32
  },

  onLoad() {
    this.syncSafeTopPadding()
    this.fetchEggGroups()
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

  async fetchEggGroups() {
    try {
      wx.showLoading({ title: '加载中...' })
      const groups = (await api.getEggGroups()).map((group) => buildGroup(group))
      const currentGroup = groups[0] || null

      this.setData({
        groups,
        currentGroup,
        currentGroupId: currentGroup ? currentGroup.id : '',
        totalGroups: groups.length,
        totalElves: groups.reduce((total, group) => total + group.count, 0)
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  switchGroup(e) {
    const id = e.currentTarget.dataset.id
    if (!id || id === this.data.currentGroupId) return

    const currentGroup = this.data.groups.find((group) => group.id === id) || null
    this.setData({
      currentGroupId: id,
      currentGroup
    })
  },

  onElfImageError(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const groups = this.data.groups.map((group) => ({
      ...group,
      elves: group.elves.map((elf) => (elf.id === id ? { ...elf, imageUrl: '' } : elf))
    }))
    const currentGroup = groups.find((group) => group.id === this.data.currentGroupId) || null

    this.setData({ groups, currentGroup })
  },

  onBackTap() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  }
})
