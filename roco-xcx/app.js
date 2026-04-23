const auth = require('./utils/auth.js')

App({
  async onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    try {
      const user = await auth.ensureLogin()
      this.globalData.userInfo = user
    } catch (error) {
      console.error('auto login failed', error)
    }
  },
  globalData: {
    userInfo: null
  }
})
