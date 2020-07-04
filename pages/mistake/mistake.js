const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    cid: 0,
    all_count: 0,
    workList: []
  },
  onLoad: function (options) {
    let token = wx.getStorageSync('token');
    let cid = parseInt(options.cid);
    let all_count = 0;

    Http.get({
      url: api_url + 'the/wrong/question/work/list',
      params: {
        cid: cid,
        startTime: "2015-01-01 59:59:59",
        endTime: "2100-01-01 59:59:59",
        page: 1,
        size: 10000,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let workList = data.data.workList;
        for (let i = 0; i < workList.length; i++) {
          all_count = all_count + workList[i].notMastered;
          workList[i].pass = this.getNumber()
        }

        this.setData({
          cid: cid,
          workList: workList,
          all_count: all_count
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  goPaper: function (e) {
    let token = wx.getStorageSync('token');
    let index = parseInt(e.currentTarget.id);
    let item = this.data.workList[index];

    Http.get({
      url: api_url + 'the/wrong/question/userwork/base',
      params: {
        studentWorkId: item.studentWorkId,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let qidsList = data.data.theWrongQuestionStructJson;
        let qids = [];
        for (let i = 0; i < qidsList.length; i++) {
          qids.push(qidsList[i].qid);
        }
        let qids_info = JSON.stringify(qids);
        wx.navigateTo({
          url: '../favanalysis/favanalysis?qids=' + qids_info
        })
      }
    }).catch((error) => {
      console.log(error)
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