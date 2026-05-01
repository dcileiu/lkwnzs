const userActions = require('../../utils/user-actions.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const auth = require('../../utils/auth.js')
const { getArticleFeatureVisible } = require('../../utils/system-config.js')

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
    menus: [],
  },

  onLoad() {
    this.loadData()
  },

  onShareAppMessage() {
    return {
      title: '洛克万能助手，训练师必备！',
      path: '/pages/index/index',
    }
  },

  onShow() {
    setTabBarSelected(this, 4)
    this.loadData()
  },

  async loadData() {
    const user = await auth.ensureLogin()
    const stats = userActions.getStats()
    const articleFeatureVisible = getArticleFeatureVisible()

    const menus = []
    if (articleFeatureVisible) {
      menus.push({ key: 'like', title: '文章点赞', desc: '查看我点赞的文章' })
      menus.push({ key: 'favorite', title: '文章收藏', desc: '查看我收藏的文章' })
      menus.push({ key: 'history', title: '浏览历史', desc: '查看浏览记录' })
    }
    menus.push(
      { key: 'share', title: '分享小程序', desc: '推荐给好友' },
      { key: 'feedback', title: '意见反馈与搭子交流', desc: '搭子企鹅交流群:1098894412' },
      { key: 'settings', title: '设置中心', desc: '账号与偏好' },
      { key: 'privacy', title: '免责声明', desc: '' }
    )

    this.setData({
      profile: {
        nickname: user?.nickname || DEFAULT_PROFILE.nickname,
        avatar: user?.avatar || DEFAULT_PROFILE.avatar
      },
      uid: user?.id || user?.uid || '',
      likeCount: stats.likes,
      favoriteCount: stats.favorites,
      menus,
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
      wx.showToast({ title: '意见反馈即将上线，可加交流群反馈哦', icon: 'none' })
      return
    }
    if (key === 'settings') {
      wx.showToast({ title: '设置中心即将上线', icon: 'none' })
      return
    }
    if (key === 'privacy') {
      wx.showModal({
        title: '免责声明',
        content: '内容均来源于网络和小洛克们的投稿。',
        showCancel: false,
      })
    }
  },
})

