const CURRENT_USER_KEY = 'wx_current_user'
const OPEN_ID_KEY = 'wx_openid'
const LEGACY_OPEN_ID_KEY = 'wx_local_openid'
const WX_API_BASE = 'https://roco.itianci.cn/api/wx'

function isLegacyFakeOpenId(openId) {
  return typeof openId === 'string' && openId.indexOf('local_openid_') === 0
}

function wxLogin() {
  return new Promise((resolve) => {
    wx.login({
      success: (res) => resolve(res.code || ''),
      fail: () => resolve('')
    })
  })
}

function requestLogin(code) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${WX_API_BASE}/auth/login`,
      method: 'POST',
      data: { code },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          resolve(res.data.data || null)
          return
        }
        reject(res.data || new Error('微信登录失败'))
      },
      fail: (err) => reject(err)
    })
  })
}

function requestUserByOpenId(openId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${WX_API_BASE}/auth/user`,
      method: 'GET',
      data: { openId },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          resolve(res.data.data || null)
          return
        }
        reject(res.data || new Error('获取用户信息失败'))
      },
      fail: (err) => reject(err)
    })
  })
}

async function ensureLogin() {
  const cachedUser = getCurrentUser()
  const cachedOpenId =
    wx.getStorageSync(OPEN_ID_KEY) ||
    wx.getStorageSync(LEGACY_OPEN_ID_KEY) ||
    cachedUser?.openId ||
    ''

  if (cachedOpenId && !isLegacyFakeOpenId(cachedOpenId)) {
    try {
      const user = await requestUserByOpenId(cachedOpenId)
      if (user?.openId) {
        wx.setStorageSync(OPEN_ID_KEY, user.openId)
        wx.setStorageSync(CURRENT_USER_KEY, user)
        return user
      }
    } catch (error) {
      // Ignore and fallback to wx.login flow.
    }
  }

  if (isLegacyFakeOpenId(cachedOpenId)) {
    wx.removeStorageSync(LEGACY_OPEN_ID_KEY)
    wx.removeStorageSync(OPEN_ID_KEY)
    wx.removeStorageSync(CURRENT_USER_KEY)
  }

  try {
    const code = await wxLogin()
    if (!code) {
      throw new Error('wx.login failed')
    }

    const user = await requestLogin(code)
    if (!user || !user.openId) {
      throw new Error('invalid login response')
    }

    wx.setStorageSync(OPEN_ID_KEY, user.openId)
    wx.setStorageSync(CURRENT_USER_KEY, user)
    return user
  } catch (error) {
    if (cachedUser?.openId && !isLegacyFakeOpenId(cachedUser.openId)) {
      return cachedUser
    }
    throw error
  }
}

function getCurrentUser() {
  return wx.getStorageSync(CURRENT_USER_KEY) || null
}

function updateCurrentUser(patch = {}) {
  const current = getCurrentUser()
  if (!current) return null

  const nextUser = {
    ...current,
    ...patch
  }

  wx.setStorageSync(CURRENT_USER_KEY, nextUser)
  return nextUser
}

module.exports = {
  ensureLogin,
  getCurrentUser,
  updateCurrentUser
}

