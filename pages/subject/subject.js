const app = getApp()

Page({
  data: {
  },
  onLoad: function () {
  },
  goIndexOne: function () {
    wx.setStorageSync('subject', 0)
    wx.reLaunch({
      url: '../index/index'
    })
  },
  goIndexTwo: function () {
    wx.setStorageSync('subject', 1)
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
