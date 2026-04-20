const api = require('../../utils/api.js')

function buildEvolutionTree(nodes) {
  const byParent = {}

  ;(nodes || []).forEach((node) => {
    const key = node.parentElfId || 'ROOT'
    if (!byParent[key]) byParent[key] = []
    byParent[key].push(node)
  })

  Object.keys(byParent).forEach((key) => {
    byParent[key].sort((left, right) => {
      if (left.stage !== right.stage) return left.stage - right.stage
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
      return left.elf.name.localeCompare(right.elf.name, 'zh-CN')
    })
  })

  function walk(parentId) {
    const key = parentId || 'ROOT'
    return (byParent[key] || []).map((node) => ({
      ...node,
      children: walk(node.childElfId)
    }))
  }

  return walk(null)
}

Page({
  data: {
    elf: null,
    galleryImages: [],
    activeImage: '',
    evolutionRoots: []
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
        evolutionRoots: buildEvolutionTree(elf?.evolution?.nodes || [])
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
