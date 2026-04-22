const TABS = [
  { pagePath: "/pages/index/index", text: "首页" },
  { pagePath: "/pages/guide/index", text: "攻略" },
  { pagePath: "/pages/hatch/index", text: "孵蛋" },
  { pagePath: "/pages/pokedex/index", text: "图鉴" },
  { pagePath: "/pages/me/index", text: "我的" },
]

Component({
  data: {
    selected: 0,
    list: TABS,
  },

  lifetimes: {
    attached() {
      this.syncSelected()
    },
  },

  pageLifetimes: {
    show() {
      this.syncSelected()
    },
  },

  methods: {
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      const targetTab = this.data.list[index]

      if (!targetTab || index === this.data.selected) {
        return
      }

      this.setData({ selected: index })

      wx.switchTab({
        url: targetTab.pagePath,
        fail: () => {
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
      const selected = this.data.list.findIndex((item) => item.pagePath === currentPath)

      if (selected !== -1 && selected !== this.data.selected) {
        this.setData({ selected })
      }
    },
  },
})
