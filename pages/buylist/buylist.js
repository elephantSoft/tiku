const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    swiperHeight: 500, // swiper高度，这里随意赋值
    currentTab: 0,
    dialogShow: false,
    buttons: [{
      text: '我已了解'
    }],
    tabs: [{
        "id": 1,
        "name": "我的课程",
        "active": true
      },
      {
        "id": 2,
        "name": "已学资料",
        "active": false
      }
    ],
    classList: [],
    choiceIndex: 0,
    videoList: []
  },
  onLoad: function () {
    let that = this;
    let token = wx.getStorageSync('token')
    let studentId = wx.getStorageSync('student');
    let classList = [];
    let videoList = []

    Http.get({
      url: api_url + 'student/class?token=' + token,
      params: {
        studentId: studentId,
        page: 1,
        size: 99,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        classList = data.data.classList;
        for (let i = classList.length - 1; i >= 0; i--) {
          let item = classList[i];
          if (item.classType != 1) {
            classList.splice(i, 1);
          }
        }
        
        that.setData({
          classList: classList
        })
      }
    }).catch((error) => {
      console.log(error)
    })
    Http.post({
      url: api_url + 'v2.0/student/video/list?token=' + token,
      params: {
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        videoList = data.data.videoList;
        that.setData({
          videoList: videoList
        })
      }
    }).catch((error) => {
      console.log(error)
    })
    resetHeight(that);
  },
  onTabs: function (e) {
    var that = this;
    var tabs = that.data.tabs;
    var activeNode = e.currentTarget;
    var currentTab = that.data.currentTab;
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
    var swipercurrent = e.detail.current;
    var tabs = that.data.tabs;
    var activeNode = e.currentTarget;
    var currentTab = that.data.currentTab;
    console.log(tabs);
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
  tapDialogButton: function (e) {
    this.setData({
      dialogShow: false
    })
  },
  toGoods: function (e) {
    let index = e.currentTarget.dataset.index;
    let cid = this.data.classList[index].cid;

    wx.navigateTo({
      url: '../plist/plist?cid=' + cid
    })
  },
  toInfo: function (e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      dialogShow: true,
      choiceIndex: index
    });
  },
  toVideo: function (e) {
    let token = wx.getStorageSync('token');
    let index = e.currentTarget.dataset.index; 
    let vid = this.data.videoList[index].vid; 
    let tid = this.data.videoList[index].tid;
    let title = this.data.videoList[index].title;
    
    let host = 'https://xcx.maixuexi.cn/v1/base/api/video?vid=';
    let Url = host + vid + '&sid=' + 100035 + '&tid=' + tid + '&token=' + token;
    Url = encodeURIComponent(Url);
    title = '职称通关 - ' + encodeURIComponent(title);

    wx.navigateTo({
      url: '../event-link/event-link?url=' + Url + '&title=' + title
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
      console.log("可使用屏幕高度" + res.windowHeight)
      that.setData({
        swiperHeight: height
      });
    }
  })
}