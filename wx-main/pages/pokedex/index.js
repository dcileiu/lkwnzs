const api = require('../../utils/api.js')

Page({
  data: {
    elements: ['全部', '火', '水', '草', '光', '暗', '电', '冰', '普通'],
    currentElement: '全部',
    elves: [],
    totalCount: 0,
    collectedCount: 0,
    keyword: ''
  },

  onLoad() {
    this.fetchPokedex()
  },

  async fetchPokedex() {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await api.getElves({
        element: this.data.currentElement,
        keyword: this.data.keyword
      })
      
      this.setData({ 
        elves: res?.items || [],
        totalCount: res?.total || 0,
        collectedCount: res?.collectedCount || 0
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
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
  }
})
