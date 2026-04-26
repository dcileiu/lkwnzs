const USERS_KEY = 'wx_users'
const CURRENT_USER_KEY = 'wx_current_user'
const OPEN_ID_KEY = 'wx_local_openid'
const AUTO_ID_KEY = 'wx_user_auto_id'

function wxLogin() {
  return new Promise((resolve) => {
    wx.login({
      success: (res) => resolve(res.code || ''),
      fail: () => resolve('')
    })
  })
}

function generateFallbackOpenId(code) {
  return `local_openid_${code || Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function ensureOpenId(code) {
  const cached = wx.getStorageSync(OPEN_ID_KEY)
  if (cached) return cached
  const openId = generateFallbackOpenId(code)
  wx.setStorageSync(OPEN_ID_KEY, openId)
  return openId
}

async function ensureLogin() {
  const code = await wxLogin()
  const openId = ensureOpenId(code)

  const users = wx.getStorageSync(USERS_KEY) || []
  let autoId = wx.getStorageSync(AUTO_ID_KEY) || 1
  let user = users.find((item) => item.openId === openId)

  if (!user) {
    user = {
      id: autoId,
      openId,
      nickname: `小洛克${autoId}`,
      avatar: 'https://wallpaper.cdn.itianci.cn/imgs/avatar/default-avatar.webp',
      createdAt: Date.now()
    }
    users.push(user)
    autoId += 1
    wx.setStorageSync(AUTO_ID_KEY, autoId)
    wx.setStorageSync(USERS_KEY, users)
  }

  wx.setStorageSync(CURRENT_USER_KEY, user)
  return user
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

  const users = wx.getStorageSync(USERS_KEY) || []
  const updatedUsers = users.map((item) => (item.openId === nextUser.openId ? nextUser : item))

  wx.setStorageSync(USERS_KEY, updatedUsers)
  wx.setStorageSync(CURRENT_USER_KEY, nextUser)
  return nextUser
}

module.exports = {
  ensureLogin,
  getCurrentUser,
  updateCurrentUser
}

