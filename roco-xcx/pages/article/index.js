const api = require('../../utils/api.js')

Page({
  data: {
    article: null,
    isLiked: false,
    isFavorited: false,
    commentInput: ''
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.fetchArticle(id)
      this.articleId = id
    }
  },

  async fetchArticle(id) {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await api.getArticleDetail(id)
      this.setData({ article: res })
      wx.setNavigationBarTitle({ title: res.title || '攻略详情' })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'error' })
      console.error(err)
    } finally {
      wx.hideLoading()
    }
  },

  toggleLike() {
    const { isLiked } = this.data
    this.setData({ isLiked: !isLiked })
    wx.showToast({
      title: !isLiked ? '已点赞！' : '取消点赞',
      icon: 'none',
      duration: 800
    })
  },

  toggleFavorite() {
    const { isFavorited } = this.data
    this.setData({ isFavorited: !isFavorited })
    wx.showToast({
      title: !isFavorited ? '收藏成功！' : '取消收藏',
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

    // Optimistic UI update - add comment locally
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

  onShareAppMessage() {
    return {
      title: this.data.article?.title || '来自洛克王国助手的攻略分享',
      path: `/pages/article/index?id=${this.articleId}`
    }
  }
})
