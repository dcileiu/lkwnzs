const api = require('../../utils/api.js')
const { normalizeImageUrl } = require('../../utils/url.js')

const ALL_CATEGORY = {
  id: 'all',
  name: '全部',
  icon: '✨',
  count: 0
}

function firstChar(value, fallback = '道') {
  const text = String(value || '').trim()
  return text ? text.charAt(0) : fallback
}

function buildItemCard(item = {}) {
  const effect = item.effect || item.desc || item.obtain || ''

  return {
    ...item,
    imageUrl: normalizeImageUrl(item.image),
    summary: effect || '暂无道具说明',
    rarityLabel: item.rarity || '普通',
    fallbackText: firstChar(item.name)
  }
}

Page({
  data: {
    categories: [ALL_CATEGORY],
    currentCategory: 'all',
    items: [],
    allItems: [],
    keyword: '',
    totalCount: 0,
    filteredTotal: 0,
    pageSize: 24,
    currentPage: 1,
    hasMore: false,
    isLoadingMore: false,
    navTopPadding: 32
  },

  onLoad() {
    this.syncSafeTopPadding()
    this.fetchItems()
  },

  onReachBottom() {
    this.loadMoreItems()
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

  async fetchItems() {
    try {
      wx.showLoading({ title: '加载中...' })
      const res = await api.getItems({
        category: this.data.currentCategory,
        keyword: this.data.keyword
      })
      const remoteCategories = Array.isArray(res?.categories) ? res.categories : []
      const allItems = (res?.items || []).map((item) => buildItemCard(item))
      const totalCount = res?.total || allItems.length
      const categories = [
        {
          ...ALL_CATEGORY,
          count: totalCount
        },
        ...remoteCategories
      ]

      this.setData(
        {
          categories,
          allItems,
          totalCount,
          filteredTotal: res?.filteredTotal || allItems.length,
          currentPage: 1
        },
        () => this.appendPage()
      )
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  appendPage() {
    const { allItems, pageSize, currentPage } = this.data
    const end = currentPage * pageSize

    this.setData({
      items: allItems.slice(0, end),
      hasMore: end < allItems.length,
      isLoadingMore: false
    })
  },

  loadMoreItems() {
    const { hasMore, isLoadingMore } = this.data
    if (!hasMore || isLoadingMore) return

    this.setData({ isLoadingMore: true })
    setTimeout(() => {
      this.setData(
        { currentPage: this.data.currentPage + 1 },
        () => this.appendPage()
      )
    }, 120)
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    if (!category || this.data.currentCategory === category) return

    this.setData({ currentCategory: category })
    this.fetchItems()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' })
  },

  onSearch() {
    this.fetchItems()
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.fetchItems()
  },

  onItemImageError(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const patchItemList = (list = []) =>
      list.map((item) => (item.id === id ? { ...item, imageUrl: '' } : item))

    this.setData({
      items: patchItemList(this.data.items),
      allItems: patchItemList(this.data.allItems)
    })
  },

  showItemDetail(e) {
    const { index } = e.currentTarget.dataset
    const item = this.data.items[index]
    if (!item) return

    const lines = [
      item.categoryName ? `分类：${item.categoryName}` : '',
      item.rarity ? `品质：${item.rarity}` : '',
      item.effect ? `效果：${item.effect}` : '',
      item.obtain ? `获取：${item.obtain}` : '',
      item.attr ? `属性：${item.attr}` : '',
      item.learnableElfCount ? `可学精灵：${item.learnableElfCount} 个` : ''
    ].filter(Boolean)

    wx.showModal({
      title: item.name || '道具详情',
      content: lines.length ? lines.join('\n') : '暂无详细说明',
      showCancel: false,
      confirmText: '知道了'
    })
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
