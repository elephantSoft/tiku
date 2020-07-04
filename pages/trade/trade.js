const app = getApp()

Page({

  data: {
  },
  onLoad: function () {
  },
  goIndex: function () {
    wx.reLaunch({
      url: '../index/index'
    })
  },
  //转发
  onShareAppMessage: function () {
    let openId = wx.getStorageSync('openid')
    return {
      title: '【惊爆】史上最高通过率的会计职称考试辅导来了！',
      path: 'pages/splash/splash?uid=' + openId,
      imageUrl: 'http://image.maixuexi.cn/image/share.png',
      success: function (res) { }
    }
  }
})
