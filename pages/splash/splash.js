const config = require('../../utils/config.js')
const url = config.config.host
const Http = require('../../utils/http.js')
const app = getApp()

let rewardedVideoAd = null;

Page({
  data: {
    bAdShow: false,
    bInit: false,
  },
  onLoad: function(options) {
    let that = this;
    app.getInitLogin().then(function(res) {
      if (options.hasOwnProperty('uid') == true) {
        let token = wx.getStorageSync('mp_token');
        let openId = options.uid;

        //记录分享成功信息
        Http.post({
          url: url + 'v1/base/api/share',
          params: {
            share: openId,
            token: token
          }
        }).then((data) => {
          if (data.code == '0') {
            console.log('来自好友分享！');
          }
        }).catch((error) => {
          console.log(error);
        })
      } else if (options.hasOwnProperty('type') == true) {
        let type = options.type;
        let token = wx.getStorageSync('mp_token');
        if (type == '100024') {
          let suid = options.sid1;
          let sid = options.sid2;

          //记录分享成功信息
          Http.post({
            url: url + 'v1/base/api/transfer',
            params: {
              uid: suid,
              sid: sid,
              token: token
            }
          }).then((data) => {
            if (data.code == '0') {
              console.log('来自好友分享！');
            }
          }).catch((error) => {
            console.log(error);
          })
        }
      }
    // let showAD = wx.getStorageSync("showAD");
    // if (showAD == 0) {
    //   if (wx.createRewardedVideoAd) {
    //     rewardedVideoAd = wx.createRewardedVideoAd({
    //       adUnitId: 'adunit-36dff4e46b8f2fdd'
    //     })
    //     rewardedVideoAd.onLoad(() => {
    //       that.setData({
    //         bAdShow: true
    //       });
    //     })
    //     rewardedVideoAd.onError((err) => {
    //       if (that.data.bInit == true) {
    //         wx.reLaunch({
    //           url: '../index/index'
    //         })
    //       }
    //     })
    //     rewardedVideoAd.onClose((res) => {
    //       if (res && res.isEnded || res === undefined) {
    //         // 正常播放结束，下发奖励
    //         let show_count = wx.getStorageSync('show_count');
    //         if (isNaN(show_count) == true || show_count == '') {
    //         } else {
    //           show_count = parseInt(show_count);
    //           show_count = show_count - 1; //获得一次课程奖励
    //           wx.setStorageSync('show_count', show_count);
    //         }
    //         wx.showToast({
    //           title: '成功观看广告，获知识点课程+1',
    //           icon: 'none',
    //           duration: 2000,
    //           success: function () {
    //             setTimeout(function () {
    //               wx.reLaunch({
    //                 url: '../index/index'
    //               })
    //             }, 2000);
    //           }
    //         })
    //       } else {
    //         // 播放中途退出，进行提示
    //         wx.reLaunch({
    //           url: '../index/index'
    //         })
    //       }
    //     })
    //   }
    // }
    })
  },
  onShow: function(options) {
    let that = this;
    wx.showLoading({
      title: '数据加载中',
    })
    app.getInitSys().then(function(res) {
      if (that.data.bAdShow == false) {
        wx.reLaunch({
          url: '../index/index'
        })
      } else {
        let showMsg = wx.getStorageSync('showMsg');
        if (!showMsg || typeof(showMsg) == "undefined" || showMsg == '') {
          wx.reLaunch({
            url: '../index/index'
          })
        } else {
          // 第二次打开才会加载广告
          rewardedVideoAd.show();
        }
      }
    })
    that.setData({
      bInit: true
    });
  }
})