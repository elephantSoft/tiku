const config = require('../../utils/config.js')
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    dialogShow: false,
    buttons: [{
      text: '我已了解'
    }],
    
    all_count: 0,
    use_count: 0,
    mycoinList: [],
    hidden: true,
    prurl: ''
  },

  onLoad: function () {
    let token = wx.getStorageSync('mp_token');

    Http.get({
      url: url + 'v1/base/api/user/coin/info',
      params: {
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let mycoinList = data.data.coinList;
        let all_count = data.data.all_count;
        let use_count = data.data.use_count;

        this.setData({
          mycoinList: mycoinList,
          all_count: all_count,
          use_count: use_count
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  onShow: function () {
    let openId = wx.getStorageSync('openid');
    var that = this;
    if (openId) {
      var qrcode = wx.getStorageSync('qrcode');
      // 要判断文件是否被清除
      if (!qrcode) {
        that.getQuear(openId);
      } else {
        let file = url + 'v1/wxmp/user/qr?file=' + qrcode
        wx.getImageInfo({
          src: file, //服务器返回的图片地址
          success: function (res) {
            wx.setStorageSync('my_qrcode', res.path);
          },
        });
      }
    }
  },

  toInfo: function () {
    this.setData({
      dialogShow: true
    });
  },

  tapDialogButton: function (e) {
    this.setData({
      dialogShow: false
    })
  },

  getQuear: function (openid) {
    var token = wx.getStorageSync('tokon');
    Http.post({
      url: url + 'v1/wxmp/user/qr?token=' + token,
      params: {
        openid: openid,
        token: token
      }
    }).then((data) => {
      if (data.status == '0') {
        var imgSrc = data.data.filename; //base64编码
        wx.setStorageSync('qrcode', imgSrc)
        let file = url + 'v1/wxmp/user/qr?file=' + imgSrc
        wx.getImageInfo({
          src: file, //服务器返回的图片地址
          success: function (res) {
            wx.setStorageSync('my_qrcode', res.path);
          },
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  // 积分换购课程
  handleCourse: function () {
    // 跳转到换购页面
    wx.navigateTo({
      url: '../integral/integral'
    })
  },

  // 生成朋友圈图片
  handleShare: function () {
    var that = this;

    var canvas = "../../vi/hb1.png";
    var qrcode = wx.getStorageSync('my_qrcode');

    var ctx = wx.createCanvasContext('myCanvas')
    // 设置矩形边框
    ctx.drawImage(canvas, 0, 0, 600, 800);
    ctx.drawImage(qrcode, 430, 600, 140, 140);
    ctx.draw();

    wx.showToast({
      title: '分享图片生成中...',
      icon: 'loading',
      duration: 1000
    });

    setTimeout(function () {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: 600,
        height: 800,
        destWidth: 600,
        destHeight: 800,
        canvasId: 'myCanvas',
        fileType: 'jpg',
        success: function (res) {
          that.setData({
            prurl: res.tempFilePath,
            hidden: false
          })
          wx.hideToast();
        },
        fail: function (res) {
          console.log(res);
        },
      })
    }, 200);
  },

  // 保存图片到本地
  save: function () {
    var that = this
    wx.saveImageToPhotosAlbum({
      filePath: that.data.prurl,
      success(res) {
        wx.showModal({
          content: '图片已保存到相册，赶紧晒一下吧~',
          showCancel: false,
          confirmText: '好的',
          confirmColor: '#70DA96',
          success: function (res) {
            if (res.confirm) {
              /* 该隐藏的隐藏 */
              that.setData({
                hidden: true
              })
            }
          }
        });
      },
      fail(res) {
        console.log(res);
      }
    })
  },

  canvasIdErrorCallback: function (e) {
    console.error(e.detail.errMsg)
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