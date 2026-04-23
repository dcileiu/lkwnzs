const api = require('../../utils/api.js')
const { normalizeImageUrl } = require('../../utils/url.js')

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
      const galleryImages = (elf?.images || []).map((img) => ({ ...img, url: normalizeImageUrl(img.url) }))

      this.setData({
        elf: {
          ...elf,
          coverImage: normalizeImageUrl(elf?.coverImage),
          avatar: normalizeImageUrl(elf?.avatar),
          eggImageUrl: normalizeImageUrl(elf?.eggImageUrl)
        },
        galleryImages,
        activeImage: normalizeImageUrl(elf?.coverImage) || galleryImages[0]?.url || '',
        relatedElves: (elf?.relatedElves || []).map((item) => ({
          ...item,
          coverImage: normalizeImageUrl(item.coverImage),
          avatar: normalizeImageUrl(item.avatar)
        }))
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
    this.setData({ activeImage: normalizeImageUrl(url) })
  },

  openElf(e) {
    const { id } = e.currentTarget.dataset
    if (!id || !this.data.elf || id === this.data.elf.id) return
    wx.redirectTo({ url: `/pages/elf-detail/index?id=${id}` })
  }
})
