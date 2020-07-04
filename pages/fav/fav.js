const config = require('../../utils/config.js')
const util = require('../../utils/util.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    all_count: 0,
    tagsList: []
  },
  onLoad: function () {
    let token = wx.getStorageSync('token');
    let tagId = wx.getStorageSync('favTag');

    Http.get({
      url: api_url + 'tag/student/question/list',
      params: {
        tagId: tagId,
        startTime: "2015-01-01 59:59:59",
        endTime: "2100-01-01 59:59:59",
        page: 1,
        size: 10000,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let questionList = data.data.questionList;
        let json = {};
        let tagsList = [];
        for (let i = 0; i < questionList.length; i++) {
          questionList[i].tagName = util.getTagName(questionList[i].qid);
          if (json.hasOwnProperty(questionList[i].tagName)) {
            let value = json[questionList[i].tagName];
            value.count = value.count + 1;
            value.qids.push(questionList[i].qid);
            json[questionList[i].tagName] = value;
          } else {
            let value = {
              "count": 1,
              "qids": [questionList[i].qid]
            }
            json[questionList[i].tagName] = value;
          }
        }

        // 合并数据
        for (let key in json) {
          let item = {
            "tagname": key,
            "count": json[key].count,
            "qids": json[key].qids,
            "pass": this.getNumber()
          }
          tagsList.push(item);
        }

        this.setData({
          tagsList: tagsList,
          all_count: questionList.length
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  goPaper: function (e) {
    let index = parseInt(e.currentTarget.id);
    let item = this.data.tagsList[index];

    let qids_info = JSON.stringify(item.qids);
    wx.navigateTo({
      url: '../favanalysis/favanalysis?qids=' + qids_info
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