const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const { normalizeImageUrl } = require('../../utils/url.js')

function buildElfCard(item = {}) {
  const coverImage = normalizeImageUrl(item.coverImage)
  const avatar = normalizeImageUrl(item.avatar)
  const eggImageUrl = normalizeImageUrl(item.eggImageUrl)

  return {
    ...item,
    coverImage,
    avatar,
    eggImageUrl,
    displayImage: coverImage || avatar || '',
    avatarText: item.name ? String(item.name).charAt(0) : '灵'
  }
}

Page({
  data: {
    elements: [],
    currentElement: '全部',
    elves: [],
    allElves: [],
    totalCount: 0,
    collectedCount: 0,
    keyword: '',
    pageSize: 12,
    currentPage: 1,
    hasMore: false,
    isLoadingMore: false
  },

  onLoad() {
    this.fetchElements()
    this.fetchPokedex()
  },

  onShow() {
    setTabBarSelected(this, 3)
  },

  onReachBottom() {
    this.loadMoreElves()
  },

  async fetchElements() {
    const defaultElements = ['全部', '火', '水', '草', '光', '暗', '电', '冰', '普通'].map((name) => ({
      name,
      iconUrl: ''
    }))

    try {
      const res = await api.getElements()
      const elementList = Array.isArray(res) ? res : []
      const remoteElements = elementList
        .map((item) => ({
          name: item?.name || '',
          iconUrl: normalizeImageUrl(item?.iconUrl)
        }))
        .filter((item) => item.name)

      const allElements = [{ name: '全部', iconUrl: '' }, ...remoteElements]

      this.setData({
        elements: allElements.length ? allElements : defaultElements
      })
    } catch (err) {
      console.error(err)
      this.setData({ elements: defaultElements })
    }
  },

  async fetchPokedex() {
    try {
      wx.showLoading({ title: '加载中...' })
      const res = await api.getElves({
        element: this.data.currentElement,
        keyword: this.data.keyword
      })

      const allElves = (res?.items || []).map((item) => buildElfCard(item))

      this.setData(
        {
          allElves,
          totalCount: res?.total || allElves.length,
          collectedCount: res?.collectedCount || 0,
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
    const { allElves, pageSize, currentPage } = this.data
    const end = currentPage * pageSize
    const nextElves = allElves.slice(0, end)

    this.setData({
      elves: nextElves,
      hasMore: end < allElves.length,
      isLoadingMore: false
    })
  },

  loadMoreElves() {
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

  switchElement(e) {
    const element = e.currentTarget.dataset.element
    if (this.data.currentElement === element) return
    this.setData({ currentElement: element })
    this.fetchPokedex()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.fetchPokedex()
  },

  onElfImageError(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const patchElfList = (list = []) =>
      list.map((item) => {
        if (item.id !== id) return item

        if (item.displayImage && item.displayImage !== item.eggImageUrl && item.eggImageUrl) {
          return {
            ...item,
            displayImage: item.eggImageUrl
          }
        }

        return {
          ...item,
          displayImage: ''
        }
      })

    this.setData({
      elves: patchElfList(this.data.elves),
      allElves: patchElfList(this.data.allElves)
    })
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
