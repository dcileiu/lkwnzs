const userActions = require('../../utils/user-actions.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const auth = require('../../utils/auth.js')

const DEFAULT_PROFILE = {
  nickname: '洛克训练师',
  avatar: 'https://roco.cdn.itianci.cn/imgs/avatar/default-avatar.jpg'
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

  async loadData() {
    const user = await auth.ensureLogin()
    const stats = userActions.getStats()
    this.setData({
      profile: {
        nickname: user?.nickname || DEFAULT_PROFILE.nickname,
        avatar: user?.avatar || DEFAULT_PROFILE.avatar
      },
      likeCount: stats.likes,
      favoriteCount: stats.favorites,
    })
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail?.avatarUrl
    if (!avatarUrl) return
    const next = auth.updateCurrentUser({ avatar: avatarUrl })
    this.setData({
      profile: {
        ...this.data.profile,
        avatar: next?.avatar || avatarUrl
      }
    })
  },

  editNickname() {
    wx.showModal({
      title: '修改名称',
      editable: true,
      placeholderText: '请输入新的用户名',
      content: this.data.profile.nickname,
      success: (res) => {
        if (!res.confirm) return
        const nickname = (res.content || '').trim()
        if (!nickname) {
          wx.showToast({ title: '用户名不能为空', icon: 'none' })
          return
        }
        const next = auth.updateCurrentUser({ nickname })
        this.setData({
          profile: {
            ...this.data.profile,
            nickname: next?.nickname || nickname
          }
        })
        wx.showToast({ title: '已更新', icon: 'success' })
      }
    })
  },

  useWechatNickname() {
    wx.getUserProfile({
      desc: '用于同步微信昵称',
      success: ({ userInfo }) => {
        const nickname = userInfo?.nickName
        if (!nickname) return
        const next = auth.updateCurrentUser({ nickname })
        this.setData({
          profile: {
            ...this.data.profile,
            nickname: next?.nickname || nickname
          }
        })
        wx.showToast({ title: '微信昵称已同步', icon: 'none' })
      }
    })
  },

  openLikedArticles() {
    wx.navigateTo({ url: '/pages/me-articles/index?type=like' })
  },

  openFavoriteArticles() {
    wx.navigateTo({ url: '/pages/me-articles/index?type=favorite' })
  },
})
