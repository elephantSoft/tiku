const config = require('../../utils/config.js')
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    scrollHeight: 100, // view-scroll 动态高度，这里随意赋值
    type: 0,
    goodses: []
  },
  onLoad: function () {
    var that = this;
    let token = wx.getStorageSync('mp_token');
    let openId = wx.getStorageSync('openid');
    let type = 0;
    let goodses = [];

    wx.getSystemInfo({
      success: function (res) {
        if (res.platform == "devtools") {
          type = 0
        } else if (res.platform == "ios") {
          type = 1
        } else if (res.platform == "android") {
          type = 0
        }
        // 加载商品
        Http.post({
          url: url + 'v1/base/api/goods',
          params: {
            openId: openId,
            type: type,
            token: token
          }
        }).then((data) => {
          if (data.code == '0') {
            goodses = data.data.goodsinfo;
            for (let i = 0; i < goodses.length; i++) {
              let str = goodses[i].goods;
              let item = JSON.parse(str);
              goodses[i].goods_info = item;
            }
            that.setData({
              goodses: goodses,
              type: type
            })
          }
        }).catch((error) => {
          console.log(error)
        })
      }
    })
    resetHeight(that);
  },
  onShow: function () {
    var that = this
    resetHeight(that)
  },
  goGoods: function (e) {
    let index = e.currentTarget.dataset.index;
    let gid = this.data.goodses[index].id;
    wx.navigateTo({
      url: '../goods/goods?id=' + gid
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

function resetHeight(that) {
  //调用系统信息，获取可使用屏幕高度
  wx.getSystemInfo({
    success: function (res) {
      var height = res.windowHeight;
      that.setData({
        scrollHeight: height
      });
    }
  })
}