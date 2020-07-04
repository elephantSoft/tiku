Page({
  data: {
    Url: ''
  },

  onLoad: function (options) {
    let url = decodeURIComponent(options.url);
    let title = '职称通关 - ' + decodeURIComponent(options.title)
    this.setData({
      Url: url
    });
    wx.setNavigationBarTitle({
      title: title
    });
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