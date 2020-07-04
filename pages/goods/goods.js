const config = require('../../utils/config.js')
const util = require('../../utils/util.js')
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    swiperHeight: 500, // swiper高度，这里随意赋值
    currentTab: 0,
    tabs: [{
        "id": 1,
        "name": "介绍",
        "active": true
      },
      {
        "id": 2,
        "name": "大纲",
        "active": false
      },
      {
        "id": 3,
        "name": "老师",
        "active": false
      }
    ],
    gid: 0,
    isBuy: false,
    goods: {}
  },
  onLoad: function (options) {
    var that = this;
    let id = parseInt(options.id);
    let goods = {};

    this.setData({
      gid: id
    })

    //调用应用实例的方法获取全局数据
    Http.post({
      url: url + 'v1/base/api/goodsinfo',
      params: {
        gid: id
      }
    }).then((data) => {
      if (data.code == '0') {
        goods = data.data;
        let info1 = JSON.parse(goods.info1);
        goods.info1_info = info1;
        let info2 = JSON.parse(goods.info2);
        goods.info2_info = info2;
        let info3 = JSON.parse(goods.info3);
        goods.info3_info = info3;
        goods.diff = util.dateDiff(goods.end_time);

        that.setData({
          goods: goods
        })
      }
    }).catch((error) => {
      console.log(error)
    })
    resetHeight(that);
  },
  onShow: function () {
    var that = this;
    resetHeight(that)
  },
  onTabs: function (e) {
    var that = this;
    var tabs = that.data.tabs;
    var activeNode = e.currentTarget;
    var currentTab = that.data.currentTab;
    console.log(tabs);
    for (var i = 0; i < tabs.length; i++) {
      if (activeNode.dataset.index == i) {
        tabs[i].active = true;
        currentTab = i;
      } else {
        tabs[i].active = false;
      }
    }
    that.setData({
      tabs: tabs,
      currentTab: currentTab
    })
  },
  swiperchange: function (e) {
    var that = this;
    var tabs = that.data.tabs;
    for (var i = 0; i < tabs.length; i++) {
      if (e.detail.current == i) {
        tabs[i].active = true;
      } else {
        tabs[i].active = false;
      }
    }
    that.setData({
      tabs: tabs
    })
  },
  onBuyOrder: function () {
    //调用应用实例的方法获取全局数据
    if (this.data.isBuy == true) {
      wx.showToast({
        icon: "none",
        title: '请至"我的课程"下学习！'
      })
    } else {
      if (parseInt(this.data.goods.reward_stock) > 0) {
        // 开始购买
        this.onPay()
      } else {
        wx.showToast({
          title: '课已售罄，如需插班请联系课程老师！',
          icon: "none",
          duration: 2000
        })
      }
    }
  },
  onPay: function (options) {
    // 支付票款
    let that = this;
    let openid = wx.getStorageSync('openid');
    Http.post({
      url: url + 'v1/base/api/order',
      params: {
        openid: openid,
        goodsid: that.data.goods.id,
        price: that.data.goods.price, // 单价
        count: 1 //购买1份
      }
    }).then((data) => {
      if (data.status == 0) {
        var code = data.code;
        var price = data.price; //总价
        // 开始支付
        Http.post({
          url: url + 'v1/wxmp/pay/create',
          params: {
            openid: openid,
            out_trade_no: code,
            total_fee: price,
            body: that.data.goods.title
          }
        }).then((data) => {
          // 开始支付
          if (data.status == 0) {
            wx.requestPayment({
              'timeStamp': data.data.timeStamp,
              'nonceStr': data.data.nonceStr,
              'package': data.data.package,
              'signType': data.data.signType,
              'paySign': data.data.sign,
              'success': function (res) {
                var userInfo = wx.getStorageSync('userInfo');
                if (userInfo != null && userInfo != "") {
                  wx.showToast({
                    title: '购买成功！请到"我的课程"板块内学习！',
                    icon: 'none',
                    duration: 1500
                  })
                } else {
                  wx.showToast({
                    title: '购买成功！请先到"我的"页面下登录系统，然后重启软件后到"我的课程"板块内学习！',
                    icon: "none",
                    duration: 2000
                  })
                };
                that.setData({
                  isBuy: true
                });
                wx.switchTab({
                  url: '../my/my'
                });
              },
              'fail': function (res) {
                wx.showToast({
                  title: '请稍后再试。。。',
                  icon: 'none',
                  duration: 1500
                })
              },
              'complete': function (res) {}
            })
          } else {
            wx.showToast({
              title: '订单取消，请稍后重试。',
              icon: 'none',
              duration: 1500
            })
          }
        }).catch((error) => {
          console.log(error)
          wx.showToast({
            title: '支付取消，请稍后重试。',
            icon: 'none',
            duration: 1500
          })
        })
      } else {
        wx.showToast({
          title: '订单生成失败！请稍后再试',
          icon: 'none',
          duration: 1500
        })
      }
    }).catch((error) => {
      console.log(error)
    })
  },
  //转发
  onShareAppMessage: function () {
    let openId = wx.getStorageSync('openid')
    return {
      title: '【惊爆】史上最高通过率的会计职称考试辅导来了！',
      path: 'pages/splash/splash?uid=' + openId,
      imageUrl: 'http://image.maixuexi.cn/image/share.png',
      success: function (res) {}
    }
  }
})

function resetHeight(that) {
  //调用系统信息，获取可使用屏幕高度
  wx.getSystemInfo({
    success: function (res) {
      var height = res.windowHeight;
      console.log("可使用屏幕高度" + res.windowHeight)
      that.setData({
        swiperHeight: height
      });
    }
  })
}