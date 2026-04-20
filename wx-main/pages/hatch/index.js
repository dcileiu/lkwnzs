const api = require('../../utils/api.js')

Page({
  data: {
    eggs: [
      { id: '1', name: '波塞冬之蛋' },
      { id: '2', name: '阿波罗之蛋' },
      { id: '3', name: '普通白蛋' }
    ], // In a real app we'd fetch this list from backend
    eggIndex: null,
    
    heights: Array.from({length: 30}, (_, i) => (i + 1) * 5), // 5, 10, ... 150
    heightIndex: null,
    
    weights: Array.from({length: 30}, (_, i) => (i + 1) * 2), // 2, 4, ... 60
    weightIndex: null,
    
    results: []
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
      wx.showToast({ title: '请填写完整条件', icon: 'none' })
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
        results: res || [
          { elfName: '测试小火球', elfRarity: '稀有', elfElement: '火', probability: 45 },
          { elfName: '测试水泡泡', elfRarity: '普通', elfElement: '水', probability: 55 }
        ] // Fallback mock data if API is empty
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  }
})
