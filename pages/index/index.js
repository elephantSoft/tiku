const config = require('../../utils/config.js')
const util = require('../../utils/util.js')
const api_url = config.config.apihost
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    test_info: "",
    test_info_index: 0,
    fraction: 0, //分数
    count: 0,
    rate: 0,
    mine: 0,
    show: 0,
    test_choice: [{
        info: "初级会计实务",
        index: 0,
        cid: 101414,
        tid: 201001,
        qid: 202001
      },
      {
        info: "初级经济法基础",
        index: 1,
        cid: 101415,
        tid: 200001,
        qid: 203001
      }
    ],
    knowList: [],
    scdList: [],
    thrList: []
  },
  onLoad: function() {
    var that = this;
    var index = 0;
    var show = 0;

    try {
      index = wx.getStorageSync('subject');
      show = wx.getStorageSync('show');
    } catch (e) {
      index = 0;
    } finally {
      if (index == "") {
        index = 0;
      }
    }
    let info = that.data.test_choice[index].info
    that.setData({
      test_info_index: index,
      test_info: info,
      show: show
    });

    let token = wx.getStorageSync('token')
    let tid = "" + that.data.test_choice[that.data.test_info_index].qid;

    Http.post({
      url: api_url + 'sample/keypoint/info?token=' + token,
      params: {
        tid: tid,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let count = data.data.count;
        let rate = data.data.rate;
        if (isNaN(Number(rate))) {
          rate = 0;
        }
        let mine = data.data.mine;
        let fraction = rate * 82 / 100;

        that.setData({
          count: count,
          rate: rate,
          mine: mine,
          fraction: fraction.toFixed(0)
        })
      }
    }).catch((error) => {
      console.log(error)
    })

    // 读取Tag数据
    var tagId = that.data.test_choice[that.data.test_info_index].tid;
    var knowList = util.getTagListFirst(tagId);

    for (var i = 0; i < knowList.length; i++) {
      knowList[i].open = false;
    }

    that.setData({
      knowList: knowList
    });
  },

  onShow: function() {
    let that = this;
    let token = wx.getStorageSync('mp_token')
    Http.post({
      url: url + 'v1/base/api/showmsg/info?token=' + token,
      params: {
        vid: 'wx2019',
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let msg = data.data.msg;
        let id = data.data.scene;
        let bShow = false;
        let item = wx.getStorageSync('showMsg');
        if (item != "") {
          if (item.hasOwnProperty(id) == true) {
            // 已经显示过，看服务器的参数决定
            if (data.data.showMsg === '0') {
              // 初次显示，已经有记录表示显示过，不在显示
              bShow = false;
            } else if (data.data.showMsg === '1') {
              // 由本地决定，本地配置
              let bShowMsg = item[id];
              if (bShowMsg == '0') {
                bShow = true;
              } else {
                bShow = false;
              }
            } else if (data.data.showMsg === '2') {
              //始终弹出
              bShow = true;
            }
          } else {
            bShow = true;
          }
        } else {
          item = {};
          bShow = true;
        }
        if (bShow == true) {
          wx.showModal({
            title: '服务提醒',
            cancelText: '我知道了',
            cancelColor: '#70DA96',
            confirmText: '马上看看',
            content: msg,
            success(res) {
              if (res.confirm) {
                item[id] = '0';
                wx.setStorageSync('showMsg', item);

                var knowList = that.data.knowList;
                knowList[1].open = !knowList[1].open;
                that.setData({
                  knowList: knowList
                });

                var scdList = util.getTagListSecond(knowList[1].id)
                for (var i = 0; i < scdList.length; i++) {
                  scdList[i].open = false;
                  if (i < scdList.length - 1) {
                    scdList[i].noLast = true;
                  } else {
                    scdList[i].noLast = false;
                  }
                }
                scdList[0].open = true;

                that.setData({
                  scdList: scdList
                });

                var thrList = util.getTagListThird(scdList[0].id)
                for (var i = 0; i < thrList.length; i++) {
                  thrList[i].open = false;
                  if (i < thrList.length - 1) {
                    thrList[i].noLast = true;
                  } else {
                    thrList[i].noLast = false;
                  }
                }
                thrList[0].open = true;

                that.setData({
                  thrList: thrList
                });
              } else if (res.cancel) {
                item[id] = '1';
                wx.setStorageSync('showMsg', item);
              }
            }
          })
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  //一级展开隐藏控制
  ashowChild: function(e) {
    var that = this;
    var id = e.currentTarget.id;
    var knowList = that.data.knowList;

    for (var i = 0; i < knowList.length; i++) {
      if (knowList[i].id == id) {
        knowList[i].open = !knowList[i].open;
      } else {
        knowList[i].open = false;
      }
    }

    that.setData({
      knowList: knowList
    });

    var scdList = util.getTagListSecond(id)

    for (var i = 0; i < scdList.length; i++) {
      scdList[i].open = false;
      //这里为非最后一个二级节点设置一个noLast标记，如果不是最后的二级节点，则最后一个三级节点的下方连接线依然显示
      if (i < scdList.length - 1) {
        scdList[i].noLast = true;
      } else {
        scdList[i].noLast = false;
      }
    }
    that.setData({
      scdList: scdList
    });
  },

  //二级展开隐藏控制
  bshowChild: function(e) {
    var that = this;
    var id = e.currentTarget.id;

    var scdList = that.data.scdList;

    for (var i = 0; i < scdList.length; i++) {
      if (scdList[i].id == id) {
        scdList[i].open = !scdList[i].open;
      } else {
        scdList[i].open = false;
      }
    }

    that.setData({
      scdList: scdList
    });

    var thrList = util.getTagListThird(id)

    for (var i = 0; i < thrList.length; i++) {
      thrList[i].open = false;
      //这里为非最后一个二级节点设置一个noLast标记，如果不是最后的二级节点，则最后一个三级节点的下方连接线依然显示
      if (i < thrList.length - 1) {
        thrList[i].noLast = true;
      } else {
        thrList[i].noLast = false;
      }
    }
    that.setData({
      thrList: thrList
    });
  },

  toPaper: function(event) {
    let that = this;
    let tagid = parseInt(event.currentTarget.dataset.id);
    let token = wx.getStorageSync('token');
    let cid = that.data.test_choice[that.data.test_info_index].cid;
    tagid = util.getChgTagId(tagid);

    Http.post({
      url: api_url + 'sample/keypoint/work?token=' + token,
      // params: str
      params: {
        cid: cid,
        tid: tagid,
        // tid: "20200102",
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let sampleDate = data.data;
        //开始答题
        if (sampleDate.uWorkStatus === 0) {
          wx.showModal({
            title: '提示',
            content: '确定开始作答试卷？',
            success(res) {
              if (res.confirm) {
                wx.navigateTo({
                  url: '../paper/paper?wid=' + sampleDate.workId + "&pid=" + sampleDate.pid + "&cid=" + sampleDate.cid + "&status=" + sampleDate.uWorkStatus + "&isMixed=" + sampleDate.isMixed + "&id=" + sampleDate.id
                })
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  toVideo: function(event) {
    let tagid = event.currentTarget.dataset.id;
    if (this.data.show == 0) {
      wx.navigateTo({
        url: '../video/video?id=' + tagid
      })
    } else {
      // 没有权限，提示
      let show_count = wx.getStorageSync('show_count');
      if (isNaN(show_count) == true || show_count == '') {
        show_count = 1;
        wx.setStorageSync('show_count', show_count);
      } else {
        show_count = parseInt(show_count) + 1;
        wx.setStorageSync('show_count', show_count);
      }

      if (show_count < 10) {
        wx.showToast({
          title: '试听开始！知识点课程可用积分免费换取，详见“我的积分”页面。',
          icon: 'none',
          duration: 2000,
          success: function() {
            setTimeout(function() {
              wx.navigateTo({
                url: '../video/video?id=' + tagid
              })
            }, 2000);
          }
        });
      } else {
        wx.showToast({
          title: '暂未开通课程！打开“我的积分”页面免费换取课程（含2科，300+知识点精讲）！',
          icon: 'none',
          duration: 5000
        })
      }
    }
  },

  toMockPaper: function() {
    wx.navigateTo({
      url: '../mockexam/mockexam'
    })
  },

  toMistake: function() {
    wx.navigateTo({
      url: '../mistake/mistake?cid=' + this.data.test_choice[this.data.test_info_index].cid
    })
  },

  toFav: function() {
    wx.navigateTo({
      url: '../fav/fav'
    })
  },

  // 练习历史
  toHistory: function() {
    wx.navigateTo({
      url: '../plist/plist?cid=' + this.data.test_choice[this.data.test_info_index].cid
    })
  },

  // 易错考点练习
  toSubject: function() {
    wx.navigateTo({
      url: '../subject/subject'
    })
  },

  //转发
  onShareAppMessage: function() {
    let openId = wx.getStorageSync('openid')
    return {
      title: '【惊爆】史上最高通过率的会计职称考试培训来了！',
      path: 'pages/splash/splash?uid=' + openId,
      imageUrl: 'http://image.maixuexi.cn/image/share.png',
      success: function(res) {}
    }
  }
})