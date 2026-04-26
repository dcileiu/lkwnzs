const api = require('../../utils/api.js')
const { normalizeImageUrl } = require('../../utils/url.js')

const DEFAULT_ELF_IMAGE = 'https://wallpaper.cdn.itianci.cn/imgs/miniapp/default-elf.png'

function normalizeGalleryImages(images = []) {
  return images
    .map((img) => ({
      ...img,
      url: normalizeImageUrl(img?.url)
    }))
    .filter((img) => img.url)
}

function normalizeRelatedElf(item = {}) {
  return {
    ...item,
    coverImage: normalizeImageUrl(item.coverImage),
    avatar: normalizeImageUrl(item.avatar),
    eggImageUrl: normalizeImageUrl(item.eggImageUrl)
  }
}

function uniqueImageUrls(urls = []) {
  return Array.from(
    new Set(
      urls
        .map((url) => normalizeImageUrl(url))
        .filter(Boolean)
    )
  )
}

Page({
  data: {
    elf: null,
    galleryImages: [],
    activeImage: DEFAULT_ELF_IMAGE,
    heroImageCandidates: [],
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
      wx.showLoading({ title: '加载中...' })

      const elf = await api.getElfDetail(id)
      const galleryImages = normalizeGalleryImages(elf?.images || [])
      const normalizedElf = {
        ...elf,
        coverImage: normalizeImageUrl(elf?.coverImage),
        avatar: normalizeImageUrl(elf?.avatar),
        eggImageUrl: normalizeImageUrl(elf?.eggImageUrl),
        fruitImageUrl: normalizeImageUrl(elf?.fruitImageUrl)
      }

      const heroImageCandidates = uniqueImageUrls([
        normalizedElf.coverImage,
        normalizedElf.avatar,
        ...galleryImages.map((item) => item.url)
      ])

      this.setData({
        elf: normalizedElf,
        galleryImages,
        activeImage: heroImageCandidates[0] || DEFAULT_ELF_IMAGE,
        heroImageCandidates,
        relatedElves: (elf?.relatedElves || []).map(normalizeRelatedElf)
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

    this.setData({
      activeImage: normalizeImageUrl(url)
    })
  },

  onHeroImageError() {
    const { activeImage, heroImageCandidates } = this.data
    const currentIndex = heroImageCandidates.indexOf(activeImage)
    const nextImage = currentIndex >= 0 ? heroImageCandidates[currentIndex + 1] : heroImageCandidates[0]

    if (nextImage && nextImage !== activeImage) {
      this.setData({ activeImage: nextImage })
      return
    }

    if (activeImage !== DEFAULT_ELF_IMAGE) {
      this.setData({ activeImage: DEFAULT_ELF_IMAGE })
    }
  },

  openElf(e) {
    const { id } = e.currentTarget.dataset
    if (!id || !this.data.elf || id === this.data.elf.id) return

    wx.redirectTo({ url: `/pages/elf-detail/index?id=${id}` })
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }

    wx.switchTab({ url: '/pages/pokedex/index' })
  }
})

