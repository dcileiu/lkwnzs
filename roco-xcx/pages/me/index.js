const userActions = require('../../utils/user-actions.js')
const { setTabBarSelected } = require('../../utils/tabbar.js')
const auth = require('../../utils/auth.js')
const api = require('../../utils/api.js')

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
    showNicknameDialog: false,
    nicknameDraft: '',
    wechatNickname: '',
    showWechatSuggestion: false,
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
    const likedIds = userActions.getLikedArticleIds()
    const favoritedIds = userActions.getFavoritedArticleIds()
    let articleHistoryCount = 0
    let likeCount = 0
    let favoriteCount = 0
    try {
      const [history, likedVisible, favoritedVisible] = await Promise.all([
        api.getHistory({
          openId: user?.openId || '',
          targetType: 'article',
          limit: 1
        }),
        likedIds.length > 0
          ? api.getArticles({ ids: likedIds.join(','), limit: likedIds.length })
          : Promise.resolve([]),
        favoritedIds.length > 0
          ? api.getArticles({ ids: favoritedIds.join(','), limit: favoritedIds.length })
          : Promise.resolve([])
      ])
      articleHistoryCount = (history.items || []).length
      likeCount = Array.isArray(likedVisible) ? likedVisible.length : 0
      favoriteCount = Array.isArray(favoritedVisible) ? favoritedVisible.length : 0
    } catch (err) {
      articleHistoryCount = 0
      likeCount = 0
      favoriteCount = 0
    }

    const menus = []
    if (likeCount > 0) {
      menus.push({ key: 'like', title: '文章点赞', desc: '查看我点赞的文章' })
    }
    if (favoriteCount > 0) {
      menus.push({ key: 'favorite', title: '文章收藏', desc: '查看我收藏的文章' })
    }
    if (articleHistoryCount > 0) {
      menus.push({ key: 'history', title: '浏览历史', desc: '查看浏览记录' })
    }
    menus.push(
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
      likeCount,
      favoriteCount,
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
    this.setData({
      showNicknameDialog: true,
      nicknameDraft: this.data.profile.nickname || '',
      showWechatSuggestion: false,
    })
  },

  closeNicknameDialog() {
    this.setData({
      showNicknameDialog: false,
      showWechatSuggestion: false,
    })
  },

  onNicknameInput(e) {
    this.setData({
      nicknameDraft: (e.detail.value || '').trimStart()
    })
  },

  onNicknameFocus() {
    const wechatNickname = (this.data.wechatNickname || '').trim()
    if (wechatNickname) {
      this.setData({ showWechatSuggestion: true })
      return
    }

    wx.getUserProfile({
      desc: '用于获取微信昵称候选',
      success: ({ userInfo }) => {
        const nickname = (userInfo && userInfo.nickName) ? String(userInfo.nickName).trim() : ''
        if (!nickname) return
        this.setData({
          wechatNickname: nickname,
          showWechatSuggestion: true,
        })
      },
      fail: () => {
        this.setData({ showWechatSuggestion: false })
      }
    })
  },

  fillWechatNickname() {
    const nickname = (this.data.wechatNickname || '').trim()
    if (!nickname) return
    this.setData({
      nicknameDraft: nickname,
      showWechatSuggestion: true,
    })
  },

  submitNickname() {
    const nickname = (this.data.nicknameDraft || '').trim()
    if (!nickname) {
      wx.showToast({ title: '用户名不能为空', icon: 'none' })
      return
    }
    const next = auth.updateCurrentUser({ nickname })
    this.setData({
      showNicknameDialog: false,
      showWechatSuggestion: false,
      profile: {
        ...this.data.profile,
        nickname: next?.nickname || nickname
      }
    })
    wx.showToast({ title: '已更新', icon: 'success' })
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

  noop() {}
})

