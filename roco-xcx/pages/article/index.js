const api = require('../../utils/api.js')
const userActions = require('../../utils/user-actions.js')
const { normalizeImageUrl } = require('../../utils/url.js')

function normalizeArticleHtml(contentHtml) {
  if (!contentHtml || typeof contentHtml !== 'string') {
    return ''
  }

  return contentHtml.replace(/<img\b([^>]*)>/gi, (match, attrs = '') => {
    if (/style\s*=/i.test(attrs)) {
      return `<img${attrs}>`
    }
    return `<img${attrs} style="max-width:100%;height:auto;display:block;margin:16px auto;">`
  })
}

function resolveSourceAuthor(article = {}) {
  return (
    article.sourceName ||
    article.source ||
    article.authorName ||
    (article.author && article.author.name) ||
    '洛克攻略组'
  )
}

Page({
  data: {
    article: null,
    isLiked: false,
    isFavorited: false,
    commentInput: '',
    articleContentHtml: '',
    navTopPadding: 32,
    actionBarStickyTop: 64
  },

  onLoad(options) {
    this.syncSafeTopPadding()
    const { id } = options
    if (id) {
      this.fetchArticle(id)
      this.articleId = id
    }
  },

  syncSafeTopPadding() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const statusBarHeight =
        windowInfo.statusBarHeight ||
        (windowInfo.safeArea ? windowInfo.safeArea.top : 0) ||
        20
      this.setData({
        navTopPadding: statusBarHeight + 10,
        actionBarStickyTop: statusBarHeight + 44
      })
    } catch (err) {
      this.setData({
        navTopPadding: 32,
        actionBarStickyTop: 64
      })
    }
  },

  async fetchArticle(id) {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await api.getArticleDetail(id)
      const article = {
        ...res,
        cover: normalizeImageUrl(res.cover),
        image: normalizeImageUrl(res.image),
        thumbnail: normalizeImageUrl(res.thumbnail),
        sourceAuthor: resolveSourceAuthor(res)
      }
      userActions.saveArticleSnapshot(article)
      this.setData({
        article,
        articleContentHtml: normalizeArticleHtml(res.contentHtml || res.content),
        isLiked: userActions.isLiked(id),
        isFavorited: userActions.isFavorited(id)
      })
      wx.setNavigationBarTitle({ title: res.title || '攻略详情' })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'error' })
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  toggleLike() {
    const { article } = this.data
    if (!article) return
    const nextState = userActions.toggleLike(article)
    this.setData({ isLiked: nextState })
    wx.showToast({
      title: nextState ? '已点赞！' : '取消点赞',
      icon: 'none',
      duration: 800
    })
  },

  toggleFavorite() {
    const { article } = this.data
    if (!article) return
    const nextState = userActions.toggleFavorite(article)
    this.setData({ isFavorited: nextState })
    wx.showToast({
      title: nextState ? '收藏成功！' : '取消收藏',
      icon: 'none',
      duration: 800
    })
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value })
  },

  submitComment() {
    const { commentInput, article } = this.data
    if (!commentInput.trim()) {
      wx.showToast({ title: '评论不能为空', icon: 'none' })
      return
    }

    const newComment = {
      id: Date.now(),
      content: commentInput,
      user: { nickname: '我', avatar: '' },
      createdAt: '刚刚'
    }

    const updatedArticle = {
      ...article,
      comments: [newComment, ...(article.comments || [])]
    }

    this.setData({
      article: updatedArticle,
      commentInput: ''
    })

    wx.showToast({ title: '评论成功', icon: 'success' })
  },

  onBackTap() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },

  copySourceLink() {
    const article = this.data.article || {}
    const url = article.sourceUrl || article.url
    if (!url) {
      wx.showToast({ title: '暂无链接', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'none' })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.article?.title || '来自洛克王国助手的攻略分享',
      path: `/pages/article/index?id=${this.articleId}`
    }
  }
})
