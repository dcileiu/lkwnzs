const api = require('../../utils/api.js')

Page({
  data: {
    eggs: [],
    selectedEgg: null,
    activeEggIndex: null
  },

  onLoad() {
    this.fetchEggs()
  },


  async fetchEggs() {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await api.getEggCollection()
      this.setData({ eggs: res || [] })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  async showEggDetail(e) {
    const { id, index } = e.currentTarget.dataset
    if (this.data.activeEggIndex === index) {
      this.setData({ selectedEgg: null, activeEggIndex: null })
      return
    }
    try {
      wx.showLoading({ title: '加载中' })
      const detail = await api.getEggDetail(id)
      this.setData({ selectedEgg: detail, activeEggIndex: index })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  goElfDetail(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
