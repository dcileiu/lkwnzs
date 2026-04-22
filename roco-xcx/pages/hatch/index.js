const api = require('../../utils/api.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')

Page({
  data: {
    heightValue: '',
    weightValue: '',
    searched: false,
    selectedResultIndex: -1,
    selectedResult: null,
    results: []
  },

  onShow() {
    setTabBarSelected(this, 2)
  },

  onHeightInput(e) {
    this.setData({
      heightValue: (e.detail.value || '').trim(),
      results: [],
      searched: false,
      selectedResultIndex: -1,
      selectedResult: null
    })
  },

  onWeightInput(e) {
    this.setData({
      weightValue: (e.detail.value || '').trim(),
      results: [],
      searched: false,
      selectedResultIndex: -1,
      selectedResult: null
    })
  },

  onSelectResult(e) {
    const index = Number(e.currentTarget.dataset.index)
    const { results } = this.data

    if (!Number.isInteger(index) || index < 0 || index >= results.length) return

    this.setData({
      selectedResultIndex: index,
      selectedResult: results[index]
    })
  },

  async predict() {
    const { heightValue, weightValue } = this.data
    const numericHeight = parseFloat(heightValue)
    const numericWeight = parseFloat(weightValue)

    if (!heightValue || !weightValue) {
      wx.showToast({ title: '请先输入身高和体重', icon: 'none' })
      return
    }

    if (!Number.isFinite(numericHeight) || !Number.isFinite(numericWeight)) {
      wx.showToast({ title: '请输入有效数字', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '预测中...' })
      const res = await api.predictHatch({
        height: numericHeight,
        weight: numericWeight
      })

      const results = Array.isArray(res) ? res : []

      this.setData({
        results,
        searched: true,
        selectedResultIndex: results.length ? 0 : -1,
        selectedResult: results.length ? results[0] : null
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
