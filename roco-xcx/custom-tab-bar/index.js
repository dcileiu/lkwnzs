const TABS = [
  { pagePath: "/pages/index/index", text: "首页" },
  { pagePath: "/pages/guide/index", text: "攻略" },
  { pagePath: "/pages/hatch/index", text: "孵蛋" },
  { pagePath: "/pages/pokedex/index", text: "图鉴" },
  { pagePath: "/pages/me/index", text: "我的" },
]
const { ARTICLE_FLAG_CACHE_KEY } = require("../utils/system-config.js")

Component({
  data: {
    selectedPath: "/pages/index/index",
    list: [],
    guideTabVisible: false,
  },

  lifetimes: {
    attached() {
      this.refreshGuideTabVisibility()
      this.syncSelected()
    },
  },

  pageLifetimes: {
    show() {
      this.refreshGuideTabVisibility()
      this.syncSelected()
    },
  },

  methods: {
    refreshGuideTabVisibility() {
      const visible = Boolean(wx.getStorageSync(ARTICLE_FLAG_CACHE_KEY))
      const list = TABS.filter(
        (item) => item.pagePath !== "/pages/guide/index" || visible
      )
      this.setData({
        guideTabVisible: visible,
        list,
      })
    },

    setGuideTabVisible(visible) {
      wx.setStorageSync(ARTICLE_FLAG_CACHE_KEY, Boolean(visible))
      this.refreshGuideTabVisibility()
      this.syncSelected()
    },

    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      const targetTab = this.data.list[index]

      if (!targetTab || targetTab.pagePath === this.data.selectedPath) {
        return
      }

      this.isSwitchingTab = true
      this.pendingPath = targetTab.pagePath
      this.setData({ selectedPath: targetTab.pagePath })

      wx.switchTab({
        url: targetTab.pagePath,
        fail: () => {
          this.isSwitchingTab = false
          this.pendingPath = ""
          this.syncSelected()
        },
      })
    },

    syncSelected() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]

      if (!currentPage) {
        return
      }

      const currentPath = `/${currentPage.route}`
      if (this.isSwitchingTab) {
        if (this.pendingPath && currentPath !== this.pendingPath) {
          return
        }
        this.isSwitchingTab = false
        this.pendingPath = ""
      }

      if (currentPath !== this.data.selectedPath) {
        this.setData({ selectedPath: currentPath })
      }
    },
  },
})
