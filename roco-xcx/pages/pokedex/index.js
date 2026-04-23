const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const { normalizeImageUrl } = require('../../utils/url.js')

Page({
  data: {
    elements: ['全部', '火', '水', '草', '光', '暗', '电', '冰', '普通'],
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
    this.fetchPokedex()
  },

  onShow() {
    setTabBarSelected(this, 3)
  },

  async fetchPokedex() {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await api.getElves({
        element: this.data.currentElement,
        keyword: this.data.keyword
      })

      const allElves = (res?.items || []).map((item) => ({
        ...item,
        coverImage: normalizeImageUrl(item.coverImage),
        avatar: normalizeImageUrl(item.avatar)
      }))

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

  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
