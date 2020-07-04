const config = require('../../utils/config.js');
const url = config.config.host;
const Http = require('../../utils/http.js');

Page({
  data: {
    bAdShow: true,
    login: false,
    type: 0,
    userInfo: null //用户信息
  },
  onLoad: function () {
    var that = this;
    var userInfo = wx.getStorageSync('userInfo');
    //调用应用实例的方法获取全局数据
    if (userInfo != null && userInfo != "") {
      //更新数据
      that.setData({
        userInfo: userInfo,
        login: true
      })
    }
  },

  onClear: function () {
    wx.clearStorageSync();
    // 跳转到首页
    wx.reLaunch({
      url: '../splash/splash'
    })
  },

  toOpenCourse: function () {
    let Url = 'https://ad.live.fhiedu.com';
    Url = encodeURIComponent(Url);
    let title = "名师公开课";

    wx.navigateTo({
      url: '../event-link/event-link?url=' + Url + '&title=' + title
    })
  },

  toTrade: function () {
    if (this.data.userInfo != null && this.data.userInfo != "") {
      wx.navigateTo({
        url: '../trade/trade'
      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '请先授权个人信息后选择！',
      })
    }
  },

  toBuylist: function () {
    if (this.data.userInfo != null && this.data.userInfo != "") {
      wx.navigateTo({
        url: '../buylist/buylist'
      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '请先授权个人信息后查询！',
      })
    }
  },

  toMyCoin: function () {
    if (this.data.userInfo != null && this.data.userInfo != "") {
      wx.navigateTo({
        url: '../mycoin/mycoin'
      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '请先授权个人信息后查询！',
      })
    }
  },

  bindGetUserInfo: function (e) {
    let token = wx.getStorageSync('mp_token')
    wx.setStorageSync('userInfo', e.detail.userInfo);
    this.setData({
      userInfo: e.detail.userInfo,
      type: 2,
      login: true
    });
    let s = JSON.stringify(e.detail.userInfo)
    Http.post({
      url: url + 'v1/base/api/userinfo',
      params: {
        userInfo: s,
        token: token
      }
    }).then((data) => {
      // 跳转到首页
      wx.reLaunch({
        url: '../splash/splash'
      })
    }).catch((error) => {
      console.log(error)
    })
  },

  bindPhoneNumber: function (e) {
    let openId = wx.getStorageSync('openid')
    if (e.detail.errMsg == "getPhoneNumber:ok") {
      Http.post({
        url: url + 'v1/wxmp/deciphering',
        params: {
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv,
          openid: openId,
        }
      }).then((data) => {
        var phone = data.data.phone;
        wx.setStorageSync('phone', phone);
        this.setData({
          type: 1,
          login: false
        })
        //加一个提示
        wx.showToast({
          title: '号码获取成功！请依据微信官方要求再次授权。（二次授权后才能登录成功）',
          icon: 'none',
          duration: 5000
        })
      }).catch((error) => {
        console.log(error)
      })
    }
  },

  adLoad() {
    this.setData({
      bAdShow: false
    });
  },
  
  adError(err) {
    this.setData({
      bAdShow: false
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