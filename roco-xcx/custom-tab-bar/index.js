const TABS = [
  { pagePath: "/pages/index/index", text: "\u9996\u9875" },
  { pagePath: "/pages/guide/index", text: "\u653b\u7565" },
  { pagePath: "/pages/hatch/index", text: "\u5b75\u86cb" },
  { pagePath: "/pages/pokedex/index", text: "\u56fe\u9274" },
  { pagePath: "/pages/collection/index", text: "\u6536\u85cf" },
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
