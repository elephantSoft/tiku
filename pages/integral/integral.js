const config = require('../../utils/config.js')
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    dialogShow: false,
    buttons: [{
      text: '我已了解'
    }],
    classList: [],
    choiceIndex: 0
  },
  onLoad: function() {
    let that = this;
    let token = wx.getStorageSync('mp_token')
    let openId = wx.getStorageSync('openid');
    let classList = [];

    // 加载商品
    Http.post({
      url: url + 'v1/base/api/goods',
      params: {
        openId: openId,
        type: 99, //积分课程
        token: token
      }
    }).then((data) => {
      if (data.code == 0) {
        let goodses = data.data.goodsinfo;
        for (let i = 0; i < goodses.length; i++) {
          let str = goodses[i].goods_info;
          let item = JSON.parse(str);
          goodses[i].goods_info = item;
        }
        that.setData({
          classList: goodses
        })
      }
    }).catch((error) => {
      console.log(error)
    })
  },
  tapDialogButton: function(e) {
    this.setData({
      dialogShow: false
    })
  },
  toGoods: function(e) {
    let index = e.currentTarget.dataset.index;
    let id = this.data.classList[index].id;
    let price = parseFloat(this.data.classList[index].brand);
    let jifen = parseInt(this.data.classList[index].price);
    let title = this.data.classList[index].title;

    if (price == 0.0) {
      // 换购价格为0
      wx.showModal({
        content: '您将花费' + jifen + '积分换购\"' + title + '\"课程？',
        showCancel: true,
        confirmText: '好的',
        confirmColor: '#70DA96',
        success: function(res) {
          if (res.confirm) {
            let token = wx.getStorageSync('mp_token')
            let openId = wx.getStorageSync('openid');
            Http.post({
              url: url + 'v1/base/api/goods/change',
              params: {
                openId: openId,
                id: id, //积分课程
                token: token
              }
            }).then((data) => {
              if (data.code == 0) {
                wx.showToast({
                  icon: 'success',
                  title: '换购成功！',
                  duration: 2000,
                  success: function() {
                    setTimeout(function() {
                      //要延时执行的代码
                      wx.reLaunch({
                        url: '../splash/splash'
                      });
                    }, 2000) //延迟时间
                  }
                });
              } else {
                wx.showToast({
                  icon: 'none',
                  title: '积分换购失败！请联系客服',
                  duration: 2000
                });
              }
            }).catch((error) => {
              console.log(error)
            })
          }
        }
      });
    } else {
      wx.showModal({
        content: '您将花费' + jifen + '积分并支付' + price + '元换购\"' + title + '\"课程？',
        showCancel: true,
        confirmText: '好的',
        confirmColor: '#70DA96',
        success: function(res) {
          if (res.confirm) {

          }
        }
      });
    }
  },
  toInfo: function(e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      dialogShow: true,
      choiceIndex: index
    });
  },
  //转发
  onShareAppMessage: function() {
    let openId = wx.getStorageSync('openid')
    return {
      title: '【惊爆】史上最高通过率的会计职称考试辅导来了！',
      path: 'pages/splash/splash?uid=' + openId,
      imageUrl: 'http://image.maixuexi.cn/image/share.png',
      success: function(res) {}
    }
  }
})