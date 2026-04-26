const api = require('../../utils/api.js')
const { normalizeImageUrl } = require('../../utils/url.js')

function firstChar(value, fallback = '货') {
  const text = String(value || '').trim()
  return text ? text.charAt(0) : fallback
}

function formatDateTime(value) {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  } catch (err) {
    return ''
  }
}

function buildPeriodLabel(startAt, endAt) {
  const startText = formatDateTime(startAt)
  const endText = formatDateTime(endAt)
  if (!startText && !endText) return ''
  if (startText && endText) return `${startText} ~ ${endText}`
  if (startText) return `${startText} 起`
  return `截止 ${endText}`
}

function buildShopCard(shop = {}) {
  const summary = shop.note || shop.effect || shop.desc || ''
  return {
    ...shop,
    imageUrl: normalizeImageUrl(shop.image),
    summary: summary || '暂无说明',
    rarityLabel: shop.rarity || '',
    fallbackText: firstChar(shop.name),
    priceLabel: shop.price > 0 ? String(shop.price) : '免费',
    currencyLabel: shop.currencyLabel || '金币',
    stockLabel: shop.stock === null || shop.stock === undefined ? '不限' : String(shop.stock),
    periodLabel: buildPeriodLabel(shop.startAt, shop.endAt)
  }
}

Page({
  data: {
    items: [],
    totalCount: 0,
    serverTime: '',
    navTopPadding: 32,
    isLoading: true
  },

  onLoad() {
    this.syncSafeTopPadding()
    this.fetchShop()
  },

  onPullDownRefresh() {
    this.fetchShop().finally(() => wx.stopPullDownRefresh())
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

  async fetchShop() {
    try {
      this.setData({ isLoading: true })
      wx.showLoading({ title: '加载中...' })
      const res = await api.getShopItems()
      const items = (res?.items || []).map((shop) => buildShopCard(shop))
      this.setData({
        items,
        totalCount: res?.total || items.length,
        serverTime: res?.serverTime || ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
      this.setData({ isLoading: false })
    }
  },

  onItemImageError(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    const items = this.data.items.map((item) => (item.id === id ? { ...item, imageUrl: '' } : item))
    this.setData({ items })
  },

  showItemDetail(e) {
    const { index } = e.currentTarget.dataset
    const shop = this.data.items[index]
    if (!shop) return

    const lines = [
      shop.categoryName ? `分类：${shop.categoryName}` : '',
      shop.rarity ? `品质：${shop.rarity}` : '',
      `价格：${shop.priceLabel} ${shop.currencyLabel}`,
      `库存：${shop.stockLabel}`,
      shop.periodLabel ? `售卖时段：${shop.periodLabel}` : '',
      shop.effect ? `效果：${shop.effect}` : '',
      shop.obtain ? `获取：${shop.obtain}` : '',
      shop.note ? `备注：${shop.note}` : ''
    ].filter(Boolean)

    wx.showModal({
      title: shop.name || '商品详情',
      content: lines.length ? lines.join('\n') : '暂无详情',
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
