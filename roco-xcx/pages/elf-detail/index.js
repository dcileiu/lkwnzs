const api = require('../../utils/api.js')

Page({
  data: {
    elf: null,
    galleryImages: [],
    activeImage: '',
    relatedElves: []
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '缺少精灵 ID', icon: 'none' })
      return
    }
    this.fetchDetail(options.id)
  },

  async fetchDetail(id) {
    try {
      wx.showLoading({ title: '加载中' })
      const elf = await api.getElfDetail(id)
      const galleryImages = elf?.images || []

      this.setData({
        elf,
        galleryImages,
        activeImage: elf?.coverImage || galleryImages[0]?.url || '',
        relatedElves: elf?.relatedElves || []
      })
    } catch (err) {
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  selectImage(e) {
    const { url } = e.currentTarget.dataset
    if (!url) return
    this.setData({ activeImage: url })
  },

  openElf(e) {
    const { id } = e.currentTarget.dataset
    if (!id || !this.data.elf || id === this.data.elf.id) return
    wx.redirectTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
