const userActions = require('../../utils/user-actions.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')

const DEFAULT_PROFILE = {
  nickname: '洛克训练师',
  avatar: '/assets/default-avatar.png'
}

Page({
  data: {
    profile: DEFAULT_PROFILE,
    likeCount: 0,
    favoriteCount: 0,
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    setTabBarSelected(this, 4)
    this.loadData()
  },

  loadData() {
    const profile = wx.getStorageSync('me_profile') || DEFAULT_PROFILE
    const stats = userActions.getStats()
    this.setData({
      profile,
      likeCount: stats.likes,
      favoriteCount: stats.favorites,
    })
  },

  openLikedArticles() {
    wx.navigateTo({ url: '/pages/me-articles/index?type=like' })
  },

  openFavoriteArticles() {
    wx.navigateTo({ url: '/pages/me-articles/index?type=favorite' })
  },
})
