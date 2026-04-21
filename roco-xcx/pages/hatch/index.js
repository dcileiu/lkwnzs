const api = require('../../utils/api.js')

Page({
  data: {
    eggs: [],
    eggIndex: null,

    heights: Array.from({ length: 30 }, (_, i) => (i + 1) * 5),
    heightIndex: null,

    weights: Array.from({ length: 30 }, (_, i) => (i + 1) * 2),
    weightIndex: null,

    results: []
  },

  onLoad() {
    this.fetchEggs()
  },

  async fetchEggs() {
    try {
      wx.showLoading({ title: '加载中' })
      const eggs = await api.getEggCollection()
      this.setData({ eggs: eggs || [] })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  onEggChange(e) {
    this.setData({ eggIndex: e.detail.value, results: [] })
  },

  onHeightChange(e) {
    this.setData({ heightIndex: e.detail.value, results: [] })
  },

  onWeightChange(e) {
    this.setData({ weightIndex: e.detail.value, results: [] })
  },

  async predict() {
    const { eggIndex, heightIndex, weightIndex, eggs, heights, weights } = this.data

    if (eggIndex === null || heightIndex === null || weightIndex === null) {
      wx.showToast({ title: '请先补全预测条件', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '预测中...' })
      const res = await api.predictHatch({
        eggId: eggs[eggIndex].id,
        height: heights[heightIndex],
        weight: weights[weightIndex]
      })

      this.setData({
        results: res || []
      })
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
