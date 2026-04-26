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
  const backendRound = Number(shop.round) || 0
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
    periodLabel: buildPeriodLabel(shop.startAt, shop.endAt),
    round: backendRound,
    isToday: Boolean(shop.isToday),
    roundLabel: backendRound > 0 ? `第${backendRound}轮` : ''
  }
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function getRoundByHour(hour) {
  if (hour >= 8 && hour < 12) return 1
  if (hour >= 12 && hour < 16) return 2
  if (hour >= 16 && hour < 20) return 3
  if (hour >= 20 && hour < 24) return 4
  return 0
}

function getRoundRangeText(round) {
  if (round === 1) return '08:00-12:00'
  if (round === 2) return '12:00-16:00'
  if (round === 3) return '16:00-20:00'
  return '20:00-24:00'
}

function buildTodayRoundGroups(items = [], baseDate = new Date()) {
  const groups = [4, 3, 2, 1].map((round) => ({
    round,
    roundLabel: `第${round}轮`,
    timeRange: getRoundRangeText(round),
    items: []
  }))

  const groupMap = groups.reduce((acc, group) => {
    acc[group.round] = group
    return acc
  }, {})

  items.forEach((item) => {
    const startDate = item.startAt ? new Date(item.startAt) : null
    const fallbackIsToday =
      startDate && isValidDate(startDate) ? isSameDay(startDate, baseDate) : false
    const isToday = item.isToday || fallbackIsToday
    if (!isToday) return

    const round = item.round || (startDate && isValidDate(startDate) ? getRoundByHour(startDate.getHours()) : 0)
    if (!round) return
    item.roundLabel = `第${round}轮`
    item.roundOrder = round
    item.startTimestamp = startDate && isValidDate(startDate) ? startDate.getTime() : 0
    groupMap[round].items.push(item)
  })

  groups.forEach((group) => {
    group.items.sort((a, b) => (b.startTimestamp || 0) - (a.startTimestamp || 0))
  })

  return groups
}

function getTodayRoundText(date = new Date()) {
  const hour = date.getHours()
  if (hour < 8) return '未开售'
  if (hour < 12) return '第1轮'
  if (hour < 16) return '第2轮'
  if (hour < 20) return '第3轮'
  return '第4轮'
}

function getCurrentRound(date = new Date()) {
  const hour = date.getHours()
  if (hour < 8) return 0
  if (hour < 12) return 1
  if (hour < 16) return 2
  if (hour < 20) return 3
  return 4
}

function getCurrentRoundCount(roundGroups = [], date = new Date()) {
  const currentRound = getCurrentRound(date)
  if (!currentRound) return 0
  const currentGroup = roundGroups.find((group) => group.round === currentRound)
  return currentGroup?.items?.length || 0
}

Page({
  data: {
    items: [],
    roundGroups: [],
    totalCount: 0,
    todayRoundText: getTodayRoundText(),
    serverTime: '',
    navTopPadding: 32,
    isLoading: true
  },

  onLoad() {
    this.syncSafeTopPadding()
    this.refreshTodayRound()
    this.fetchShop()
  },

  onUnload() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
      this.roundTimer = null
    }
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
      const res = await api.getShopItems({ includeUpcoming: true })
      const items = (res?.items || []).map((shop) => buildShopCard(shop))
      const baseDate = res?.serverTime ? new Date(res.serverTime) : new Date()
      const roundGroups = buildTodayRoundGroups(items, baseDate)
      const todayItems = roundGroups.flatMap((group) => group.items)
      const currentRoundCount = getCurrentRoundCount(roundGroups, baseDate)
      this.setData({
        items: todayItems,
        roundGroups,
        totalCount: currentRoundCount,
        serverTime: res?.serverTime || ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
      this.setData({ isLoading: false })
    }
  },

  refreshTodayRound() {
    const updateRound = () => {
      const now = new Date()
      const todayRoundText = getTodayRoundText(now)
      const totalCount = getCurrentRoundCount(this.data.roundGroups, now)
      this.setData({ todayRoundText, totalCount })
    }
    updateRound()
    this.roundTimer = setInterval(updateRound, 60 * 1000)
  },

  onItemImageError(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    const targetId = String(id)
    const items = this.data.items.map((item) =>
      String(item.id) === targetId ? { ...item, imageUrl: '' } : item
    )
    const roundGroups = this.data.roundGroups.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        String(item.id) === targetId ? { ...item, imageUrl: '' } : item
      )
    }))
    this.setData({ items, roundGroups })
  },

  showItemDetail(e) {
    const { id } = e.currentTarget.dataset
    const targetId = String(id)
    const shop = this.data.items.find((item) => String(item.id) === targetId)
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
