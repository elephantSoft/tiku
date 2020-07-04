const config = require('../../utils/config.js')
const url = config.config.host
const util = require('../../utils/util.js')
const Http = require('../../utils/http.js')
var md5 = require('../../utils/md5.js')

Page({
  data: {
    isTest: 0,
    workList: [],
    finishList: [],
    reportList: [],
    tabIndex: 0,
    isEnroll: false,
    dialogShow: false,
    buttons: [{
      text: '不再弹出'
    }, {
      text: '我知道了'
    }],
    tabs: [{
        "id": 1,
        "name": "进行中",
        "active": true
      },
      {
        "id": 2,
        "name": "已结束",
        "active": false
      },
      {
        "id": 3,
        "name": "看报告",
        "active": false
      }
    ]
  },

  onLoad: function(options) {
    if (options.hasOwnProperty('t') == true) {
      let isTest = parseInt(options.t);
      this.setData({
        isTest: isTest
      });
    }

    var show = 0;

    try {
      show = wx.getStorageSync('mockshow');
    } catch (e) {
      show = 0;
    } finally {
      if (show == "") {
        show = 0;
      }
      if (show == 0) {
        this.setData({
          dialogShow: true
        });
      }
    }
  },

  onShow: function() {
    let that = this;
    that.refreshList(that);
  },

  tapDialogButton: function(e) {
    let index = e.detail.index;
    if (index == 0) {
      // 不在弹出
      wx.setStorageSync('mockshow', '1');
    }
    this.setData({
      dialogShow: false
    })
  },

  goReportPaper: function(e) {
    let that = this;
    let index = parseInt(e.currentTarget.id);
    let item = this.data.reportList[index];

    if (item.mid == 0) {
      this.setData({
        dialogShow: true
      });
      return;
    }

    // 没有报告就退出
    if (item.status == 0) {
      wx.showToast({
        title: '本场模考报告暂未生成，请稍后查询！',
        icon: 'none',
        duration: 5000
      });
      return;
    }

    // 获取积分
    let token = wx.getStorageSync('mp_token');

    Http.get({
      url: url + 'v1/base/api/user/coin/info',
      params: {
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let all_count = data.data.all_count;
        if (all_count <= 0) {
          wx.showModal({
            title: '积分不足提醒',
            cancelText: "放弃", //默认是“取消”
            confirmText: "拿积分", //默认是“确定”
            content: '您的积分不足，无法查询报告，请先分享好友拿积分！',
            success(res) {
              if (res.confirm) {
                wx.navigateTo({
                  url: '../mycoin/mycoin'
                });
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          });
        } else {
          wx.navigateTo({
            url: '../mockreport/mockreport?s1=' + item.mid + '&s2=' + item.aid
          });
        }
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  goPaper: function(e) {
    let that = this;
    let index = parseInt(e.currentTarget.id);
    let item = this.data.workList[index];
    let token = wx.getStorageSync('mp_token');

    if (item.mid == 0) {
      that.setData({
        dialogShow: true
      });
      return;
    }

    if (item.enroll === 0) {
      // 报名
      var userInfo = wx.getStorageSync('userInfo');
      if (userInfo != null && userInfo != "") {
        // 判断是否满足报名条件
        if (item.type == '9') {
          //停止报名
          wx.showToast({
            title: '本场模考报名人数已满，下场模考请尽早！',
            icon: 'none',
            duration: 5000
          });
        } else {
          if (that.data.isEnroll == false) {
            that.setData({
              isEnroll: true
            });
            let mid = item.mid;
            // 直接报名，先跳出来Dialog
            Http.post({
              url: url + 'v1/base/api/mockexam/enroll?token=' + token,
              params: {
                mid: mid,
                token: token
              }
            }).then((data) => {
              let status = data.status;
              if (status == 0) {
                that.refreshList(that);
                // 报名成功
                wx.showToast({
                  title: '报名成功！',
                  icon: 'success',
                  duration: 5000,
                  success: function() {
                    setTimeout(function() {
                      that.setData({
                        isEnroll: false
                      });
                    }, 5000);
                  }
                });
                // 缓存数据
                let key = 'A' + data.mid;
                let value = {
                  'mid': data.mid,
                  'pid': data.pid,
                  'paper': data.paper
                }
                let sitem = {};
                try {
                  var p_item = wx.getStorageSync('paper')
                  if (p_item) {
                    sitem = p_item
                  }
                } catch (e) {
                  // Do something when catch error
                  sitem = {};
                }
                sitem[key] = value;
                wx.setStorageSync('paper', sitem);
              } else {
                that.setData({
                  isEnroll: false
                });
                // 报名失败
                wx.showToast({
                  title: '报名失败，请稍后再试！',
                  icon: 'none',
                  duration: 5000
                });
              }
            }).catch((error) => {
              console.log(error)
            })
          } else {
            wx.showToast({
              title: '报名中，请等待',
              icon: 'success',
              duration: 5000
            });
          }
        }
      } else {
        wx.showModal({
          title: '报名须知',
          content: '报名参加全真模考请先到"我的"页面下登录系统，然后报名！',
          success(res) {
            if (res.confirm) {
              wx.switchTab({
                url: '../my/my'
              });
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        });
      };
    } else {
      // 加载
      var paper = {};
      try {
        var p_item = wx.getStorageSync('paper')
        if (p_item) {
          paper = p_item;
        }
      } catch (e) {
        paper = {};
      }
      var mid = 'A' + item.mid;
      var md5_hash = '';
      if (paper.hasOwnProperty(mid) == true) {
        let items = paper[mid];
        let paper_json = items['paper'];
        // 求md5，然后刷新
        try {
          md5_hash = md5(paper_json);
        } catch (error) {
          md5_hash = '';
        }
      }
      Http.post({
        url: url + 'v1/base/api/mockexam/paper?token=' + token,
        params: {
          mid: item.mid,
          hash: md5_hash,
          token: token
        }
      }).then((data) => {
        let status = data.status;
        if (status != 0) {
          // 更新数据
          let key = 'A' + data.mid;
          let value = {
            'mid': data.mid,
            'pid': data.pid,
            'paper': data.paper
          }

          let sitem = {};
          try {
            var p_item = wx.getStorageSync('paper')
            if (p_item) {
              sitem = p_item;
            }
          } catch (e) {
            // Do something when catch error
            sitem = {};
          }
          sitem[key] = value;
          wx.setStorageSync('paper', sitem);
        }
        // 判断是否进入试卷，测试入口出外
        if (that.data.isTest == 1) {
          data.show = 1;
        }
        if (data.show == 0) {
          wx.showToast({
            title: '本场模考还没开始，请指定时间参加！',
            icon: 'none',
            duration: 5000
          })
        } else if (data.show == 1) {
          wx.showModal({
            title: '开始模考',
            cancelText: "放弃", //默认是“取消”
            confirmText: "确定", //默认是“确定”
            content: '准备好开始模考了吗？中途请不要退出哦。也可用PC版微信打开小程序参加。',
            success(res) {
              if (res.confirm) {
                wx.navigateTo({
                  url: '../mockpaper/mockpaper?s1=' + item.mid + '&s2=0&s3=' + item.title + '&s4=' + item.time + '&t1=' + item.subject + '&t2=' + item.course + '&t3=' + item.start
                });
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          });
        } else {
          wx.showToast({
            title: '本场考试已经结束！',
            icon: 'none',
            duration: 5000
          })
          wx.navigateTo({
            url: '../mockpaper/mockpaper?s1=' + item.mid + '&s2=1&s3=' + item.title + '&s4=' + item.time + '&t1=' + item.subject + '&t2=' + item.course + '&t3=' + item.start
          });
        }
      }).catch((error) => {
        console.log(error)
      })
    }
  },

  goFinishPaper: function(e) {
    let index = parseInt(e.currentTarget.id);
    let item = this.data.finishList[index];
    let token = wx.getStorageSync('mp_token');

    if (item.mid == 0) {
      this.setData({
        dialogShow: true
      });
      return;
    }

    // 加载
    var paper = {};
    try {
      var p_item = wx.getStorageSync('paper')
      if (p_item) {
        paper = p_item;
      }
    } catch (e) {
      // Do something when catch error
      paper = {};
    }
    var mid = 'A' + item.mid;
    var md5_hash = '';
    if (paper.hasOwnProperty(mid) == true) {
      let items = paper[mid];
      let paper_json = items['paper'];
      // 求md5，然后刷新
      try {
        md5_hash = md5(paper_json);
      } catch (error) {
        md5_hash = '';
      }
    }
    Http.post({
      url: url + 'v1/base/api/mockexam/paper?token=' + token,
      params: {
        mid: item.mid,
        hash: md5_hash,
        token: token
      }
    }).then((data) => {
      let status = data.status;
      if (status != 0) {
        // 更新数据
        let key = 'A' + data.mid;
        let value = {
          'mid': data.mid,
          'pid': data.pid,
          'paper': data.paper
        }

        let sitem = {};
        try {
          var p_item = wx.getStorageSync('paper')
          if (p_item) {
            sitem = p_item;
          }
        } catch (e) {
          // Do something when catch error
          sitem = {};
        }
        sitem[key] = value;
        wx.setStorageSync('paper', sitem);
      };
      wx.navigateTo({
        url: '../mockpaper/mockpaper?s1=' + item.mid + '&s2=1&s3=' + item.title + '&s4=' + item.time + '&t1=' + item.subject + '&t2=' + item.course + '&t3=' + item.start
      });
    }).catch((error) => {
      console.log(error)
    })
  },

  onTabs: function(e) {
    var that = this;
    var tabs = that.data.tabs;
    var activeNode = e.currentTarget;
    var tabIndex = 0;

    for (var i = 0; i < tabs.length; i++) {
      if (activeNode.dataset.index == i) {
        tabs[i].active = true;
        tabIndex = i;
      } else {
        tabs[i].active = false;
      }
    }
    // 加载数据报告
    if (tabIndex == 2) {
      let token = wx.getStorageSync('mp_token');

      Http.post({
        url: url + 'v1/base/api/mockexam/report/list?token=' + token,
        params: {
          token: token
        }
      }).then((data) => {
        let reportList = [];
        let status = data.status;
        if (status == 0) {
          // 获取报告成功
          for (let i = 0; i < data.mocks.length; i++) {
            let item = data.mocks[i];
            item['startTime'] = util.formatTime(parseInt(item.start_time) * 1000);
            item['deliverTime'] = item.delivery_time;
            // 根据状态判断
            if (item.status == 0) {
              item['reportTime'] = '报告暂未生成，请稍后查询';
            } else if (item.status == 1) {
              item['reportTime'] = item.report_time;
            }
            reportList.push(item);
          }
        }
        // 检查是否有数据
        if (reportList.length <= 0) {
          let item = {
            'title': '暂无模考报告',
            'startTime': '-',
            'deliverTime': '-',
            'reportTime': '-',
            'status': 0,
            'mid': 0
          }
          reportList.push(item);
        }
        that.setData({
          reportList: reportList
        });
      }).catch((error) => {
        console.log(error)
      })
    }
    that.setData({
      tabs: tabs,
      tabIndex: tabIndex
    })
  },

  refreshList: function(that) {
    let token = wx.getStorageSync('mp_token');
    Http.get({
      url: url + 'v1/base/api/mockexam/list?token=' + token
    }).then((data) => {
      let workList = [];
      let finishList = []
      let mocklist = data.data.mocklist;
      for (let i = 0; i < mocklist.length; i++) {
        let item = mocklist[i];
        item['startTime'] = util.formatTime(parseInt(item.start) * 1000).substring(5);
        item['endTime'] = util.formatTime(parseInt(item.end) * 1000).substring(5);
        let hh = parseInt(item.time / 3600);
        let mm = parseInt(item.time % 3600 / 60);
        item['time_length'] = hh + '小时' + mm + '分'
        // 根据状态判断
        if (item.status == 0) {
          workList.push(item);
        } else if (item.status == 1) {
          workList.push(item);
        } else if (item.status == 2) {
          finishList.push(item);
        } else if (item.status == 9) {
          finishList.push(item);
        }
      }
      // 检查是否有数据
      if (workList.length <= 0) {
        let item = {
          'title': '暂无模考信息',
          'startTime': '暂无时间',
          'endTime': '-',
          'time_length': '-',
          'count': 0,
          'mid': 0
        }
        workList.push(item);
      }
      if (finishList.length <= 0) {
        let item = {
          'title': '暂无结束模考',
          'startTime': '-',
          'endTime': '-',
          'count': 0,
          'mid': 0
        }
        finishList.push(item);
      }
      that.setData({
        workList: workList,
        finishList: finishList
      });
    }).catch((error) => {
      console.log(error)
    })
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