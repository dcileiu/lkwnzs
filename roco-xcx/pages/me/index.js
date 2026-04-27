const userActions = require('../../utils/user-actions.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const auth = require('../../utils/auth.js')

const DEFAULT_PROFILE = {
  nickname: '洛克训练师',
  avatar: 'https://wallpaper.cdn.itianci.cn/imgs/avatar/default-avatar.webp'
}

Page({
  data: {
    profile: DEFAULT_PROFILE,
    uid: '',
    likeCount: 0,
    favoriteCount: 0,
    menus: [
      { key: 'like', title: '文章点赞', desc: '查看我点赞的文章' },
      { key: 'favorite', title: '文章收藏', desc: '查看我收藏的文章' },
      { key: 'history', title: '浏览历史', desc: '查看记录' },
      { key: 'feedback', title: '意见反馈', desc: '企鹅交流群:1098894412' },
      { key: 'settings', title: '设置中心', desc: '账号与偏好' },
      { key: 'privacy', title: '隐私政策', desc: '保护你的隐私' },
    ],
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
      uid: user?.id || user?.uid || '',
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

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'like') {
      this.openLikedArticles()
      return
    }
    if (key === 'favorite') {
      this.openFavoriteArticles()
      return
    }
    if (key === 'history') {
      wx.navigateTo({ url: '/pages/history/index' })
      return
    }
    if (key === 'feedback') {
      wx.showToast({ title: '意见反馈即将上线', icon: 'none' })
      return
    }
    if (key === 'settings') {
      wx.showToast({ title: '设置中心即将上线', icon: 'none' })
      return
    }
    if (key === 'privacy') {
      wx.showModal({
        title: '隐私政策',
        content: '我们重视并保护你的个人信息安全，详细条款将在后续版本开放。',
        showCancel: false,
      })
    }
  },

  onAboutTap() {
    wx.showToast({ title: '更多内容即将上线', icon: 'none' })
  },
})

