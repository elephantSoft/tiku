const app = getApp();

Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    }
  },
  data: {
    statusBarHeight: 0, // 状态栏高度
    navbarHeight: 0, // 顶部导航栏高度
    cusnavH: 0, //title高度
  },
  attached: function() {
    if (!app.globalData.systeminfo) {
      app.globalData.systeminfo = wx.getSystemInfoSync();
    }
    if (!app.globalData.headerBtnPosi) app.globalData.headerBtnPosi = wx.getMenuButtonBoundingClientRect();
    let statusBarHeight = app.globalData.systeminfo.statusBarHeight // 状态栏高度
    let headerPosi = app.globalData.headerBtnPosi // 胶囊位置信息
    let btnPosi = { // 胶囊实际位置，坐标信息不是左上角原点
      height: headerPosi.height,
      width: headerPosi.width,
      top: headerPosi.top - statusBarHeight, // 胶囊top - 状态栏高度
      bottom: headerPosi.bottom - headerPosi.height - statusBarHeight, // 胶囊bottom - 胶囊height - 状态栏height （胶囊实际bottom 为距离导航栏底部的长度）
      right: app.globalData.systeminfo.windowWidth - headerPosi.right // 这里不能获取 屏幕宽度，PC端打开小程序会有BUG，要获取窗口高度 - 胶囊right
    }
    var cusnavH = btnPosi.height + btnPosi.top + btnPosi.bottom // 导航高度
    this.setData({
      statusBarHeight: statusBarHeight,
      navbarHeight: headerPosi.bottom + btnPosi.bottom, // 胶囊bottom + 胶囊实际bottom
      cusnavH: cusnavH
    });
    //将实际nav高度传给父类页面
    this.triggerEvent('commonNavAttr', {
      height: headerPosi.bottom + btnPosi.bottom
    });
  },
  methods: {
    back: function() {
      wx.showModal({
        title: '考试提醒',
        cancelText: '取消',
        cancelColor: '#70DA96',
        confirmText: '确定离开',
        content: '考试中，确定要离开？',
        success(res) {
          if (res.confirm) {
            wx.navigateBack({
              delta: 1
            })
          } else if (res.cancel) {
            return;
          }
        }
      })
    }
  }
})