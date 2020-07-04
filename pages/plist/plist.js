const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    cid: 0,
    workList: [],
    finishList: [],
    tabIndex: 0,
    tabs: [
      {
        "id": 1,
        "name": "新练习",
        "active": true
      },
      {
        "id": 2,
        "name": "已完成",
        "active": false
      }
    ]
  },
  onLoad: function (options) {
    let token = wx.getStorageSync('token')
    let cid = parseInt(options.cid)

    this.setData({
      cid: cid
    })

    let studentId = wx.getStorageSync('student');
    
    Http.get({
      url: api_url + 'work/class/student/new',
      params: {
        cid: cid,
        studentId: studentId,
        page: 1,
        size: 9999,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let workList = data.data.workList;
        for (let i = 0; i < workList.length; i++) {
          workList[i].pass = this.getNumber()
        }
        this.setData({
          workList: workList
        });
      }
    }).catch((error) => {
      console.log(error)
    })

    Http.get({
      url: api_url + 'work/class/student/finish',
      params: {
        cid: cid,
        studentId: studentId,
        page: 1,
        size: 9999,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let finishList = data.data.workList;
        for (let i = 0; i < finishList.length; i++) {
          finishList[i].pass = this.getNumber()
        }
        this.setData({
          finishList: finishList
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  goPaper: function (e) {
    let index = parseInt(e.currentTarget.id);
    let item = this.data.workList[index];

    wx.navigateTo({
      url: '../paper/paper?wid=' + item.workId + "&pid=" + item.pid + "&cid=" + item.cid + "&status=" + item.uWorkStatus + "&isMixed=" + item.isMixed + "&id=" + item.id
    })
  },

  goFinishPaper: function (e) {
    let index = parseInt(e.currentTarget.id);
    let item = this.data.finishList[index];

    wx.navigateTo({
      url: '../analysis/analysis?pid=' + item.pid + '&wid=' + item.workId + '&id=' + item.id
    })
  },

  onTabs: function (e) {
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
    that.setData({
      tabs: tabs,
      tabIndex: tabIndex
    })
  },

  getNumber: function () {
    return Math.floor(Math.random() * (9999 - 4567)) + 4567;
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
