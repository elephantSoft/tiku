const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    bAdShow: true,
    id: 0,
    pid: 0,
    wid: 0,
    rate: 10,
    answer: []
  },
  onLoad: function (options) {
    let that = this;
    let token = wx.getStorageSync('token')
    let studentId = wx.getStorageSync('student');
    let id = parseInt(options.id);
    let pid = parseInt(options.pid);
    let wid = parseInt(options.wid);

    that.setData({
      id: id,
      pid: pid,
      wid: wid
    });
    
    Http.get({
      url: api_url + 'answer/user/work',
      params: {
        studentId: studentId,
        workId: wid,
        token: token
      }
    }).then((data) => {
      if (data.code == "0") {
        let list = data.data.answerList;
        let answer = [];
        let all_ok = 0;
        let all = 0;
        for (let key in list) {
          all = all + 1;
          let item = list[key];
          if (item.isRight == 1) {
            answer.push(true);
            all_ok = all_ok + 1;
          } else {
            answer.push(false);
          }
        }
        let rate = all_ok * 100 / all;
        rate = rate.toFixed(2);
        that.setData({
          rate: rate,
          answer: answer
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },
  goAnalysis: function () {
    wx.navigateTo({
      url: '../analysis/analysis?pid=' + this.data.pid + '&wid=' + this.data.wid + '&id=' + this.data.id
    })
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
  //查看视频
  goOpenVideo: function () {
    wx.showModal({
      title: '知识点课程',
      content: '您可以返回首页，点击首页的知识点树，展开知识点树到第三层找到对应的课程课程学习！',
      cancelText: '我知道了',
      cancelColor: '#70DA96',
      confirmText: '马上看看',
      success(res) {
        if (res.confirm) {
          wx.switchTab({
            url: '../index/index'
          })
        } else if (res.cancel) {
        }
      }
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
