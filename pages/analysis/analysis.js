const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    swiperHeight: 500, //滑块高度，这里随意设置
    favStatus: false, //收藏状态
    screenHeight: 0, //获取窗口高度
    boxHeight: 160, //设置材料区域高度
    openCard: 100, //设置答题卡平移量
    animationData: {}, //动画
    currentTab: 0,
    completeNum: 0,
    //题目测试
    title: '',
    id: 0,
    pid: 0,
    wid: 0,

    paper: [],
    questions: [],
    questionindex: 0,
    index: 0
  },
  onLoad: function (options) {
    let that = this;
    let token = wx.getStorageSync('token');
    let id = parseInt(options.id);
    let pid = parseInt(options.pid);
    let wid = parseInt(options.wid);
    const option = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    that.setData({
      id: id,
      pid: pid,
      wid: wid
    });

    //加载时设置swiper高度
    resetHeight(that);

    Http.get({
      url: api_url + 'test/paper/preview?token=' + token,
      params: {
        pid: pid,
        token: token
      }
    }).then((data) => {
      let paper = data.data.paper;
      paper.paperStructJson = [];
      let questions = [];
      let stem = data.data.stem;

      for (let i = 0; i < data.data.questions.length; i++) {
        if (data.data.questions[i].hasOwnProperty('mContent') == true) {
          // 材料题
          let mid = data.data.questions[i].mid;
          let mContent = data.data.questions[i].mContent;
          mContent = mContent.replace(/<table[^>]*>/gi, function (match, capture) {
            return match.replace(/width=\"(.*)\"/gi, '');
          });
          if (stem.hasOwnProperty(mid) == true) {
            let items = stem[mid];
            for (let j = 0; j < items.length; j++) {
              let item = items[j];
              item.mContent = mContent;
              item.isContent = true;

              let choice = item.choices;
              let choices = [];
              for (let k = 0; k < choice.length; k++) {
                let s = choice[k];
                let sitem = {
                  "text": that.getHtmlTxt(s),
                  "selected": false,
                  "option": option[k],
                  "thistrue": false
                }
                choices.push(sitem);
              }

              item.choices_info = choices;
              item.done = false;
              item.answer = "";

              // 正确答案
              for (let k = 0; k < item.qAnswer.length; k++) {
                let index = item.qAnswer[k];
                item.choices_info[index].thistrue = true;
                item.answer = "" + item.answer + option[index];
              }

              if (item.qType) {
                if (!item.qResolve) {
                  item.qResolve = {'本题解析': ''}
                }
                item.resolve = item.qResolve;
                item.resolve['本题解析'] = that.getHtmlTxt(item.resolve['本题解析']);
              }
              
              questions.push(item);

              let qid_item = {
                qid: item.qid
              }
              paper.paperStructJson.push(qid_item);
            }
          }
        } else {
          let qContent = data.data.questions[i].qContent;
          qContent = qContent.replace(/<table[^>]*>/gi, function (match, capture) {
            return match.replace(/width=\"(.*)\"/gi, '');
          });
          data.data.questions[i].qContent = qContent;
          
          let choice = data.data.questions[i].choices;
          let choices = [];
          for (let j = 0; j < choice.length; j++) {
            let s = choice[j];
            let item = {
              "text": that.getHtmlTxt(s),
              "selected": false,
              "option": option[j],
              "thistrue": false
            }
            choices.push(item);
          }

          data.data.questions[i].choices_info = choices;
          data.data.questions[i].done = false;
          data.data.questions[i].answer = "";

          // 正确答案
          for (let j = 0; j < data.data.questions[i].qAnswer.length; j++) {
            let index = data.data.questions[i].qAnswer[j];
            data.data.questions[i].choices_info[index].thistrue = true;
            data.data.questions[i].answer = "" + data.data.questions[i].answer + option[index];
          }

          if (data.data.questions[i].qType) {
            if (!data.data.questions[i].qResolve) {
              data.data.questions[i].qResolve = {'本题解析': ''}
            }
            data.data.questions[i].resolve = data.data.questions[i].qResolve;
            data.data.questions[i].resolve['本题解析'] = that.getHtmlTxt(data.data.questions[i].resolve['本题解析']);
          }
          data.data.questions[i].isContent = false;

          let info = JSON.stringify(data.data.questions[i]);
          questions.push(JSON.parse(info));

          let qid_item = {
            qid: data.data.questions[i].qid
          }
          paper.paperStructJson.push(qid_item);
        }
      }

      let title = '职称通关 - ' + paper.paperName;
      wx.setNavigationBarTitle({
        title: title
      })

      let studentId = wx.getStorageSync('student');
      // 记录回答数据
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
          for (var i = questions.length - 1; i >= 0; i--) {
            let item = questions[i];
            let qid = item.qid;
            let answer = list[qid];

            questions[i].you_answer = "";
            // 我的作答
            if (answer.hasOwnProperty('answer') == true) {
              let info = answer['answer'];
              for (var j = 0; j < info.length; j++) {
                let index = info[j]
                questions[i].choices_info[index].selected = true;
                questions[i].you_answer = "" + questions[i].you_answer + option[index];
              }
              questions[i].done = true;
            } else {
              questions[i].done = false;
              questions[i].you_answer = ""
            }
            questions[i].isRight = answer.isRight;
          }

          that.setData({
            questions: questions,
            paper: paper,
            title: title
          });
        }
      }).catch((error) => {
        console.log(error)
      })
    }).catch((error) => {
      console.log(error)
    })

    var openCard = that.data.openCard;

    //获取屏幕宽度
    wx.getSystemInfo({
      success: function (res) {
        var screenWidth = res.screenWidth;
        that.setData({
          openCard: screenWidth
        });
      }
    })
  },

  //加收藏
  addFav: function () {
    let token = wx.getStorageSync('token');
    let index = this.data.questionindex;
    let item = this.data.paper.paperStructJson[index];
    let tagId = wx.getStorageSync('favTag');

    Http.post({
      url: api_url + 'student/question/tag?token=' + token,
      params: {
        studentWorkId: this.data.id,
        qid: item.qid,
        tagId: [tagId],
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        wx.showToast({
          title: '收藏成功！',
          icon: 'success',
          duration: 2000
        })
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  //拖动面板
  touchMove: function (e) {
    var that = this;
    //先获取屏幕窗口高度
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          screenHeight: res.windowHeight
        });
      }
    })

    //获取事件y轴信息
    var touchs = e.touches[0];
    var pageY = touchs.pageY;

    //防止底部越界，这里的数值=事件手柄高度的一半+底部bar的高度
    if (that.data.screenHeight - pageY <= 63) return;
    //防止顶部越界，这里的数值=事件手柄高度的一半
    if (pageY <= 14) return;
    console.log('pageY: ' + pageY);

    //设置面板距离顶部的距离
    var y = pageY - 14;

    console.log('y: ' + y)
    that.setData({
      boxHeight: y
    });
  },

  //切换试题
  changeTab: function (e) {
    let index = e.detail.current;
    this.setData({
      questionindex: index
    });
  },

  //答题卡展开
  toOpenCard: function () {
    var that = this;
    openCard(that);
  },

  //答题卡关闭
  tocloseCard: function () {
    var that = this;
    closeCard(that);
  },

  //点击答题卡跳转到相应的题目
  swichNav: function (e) {
    var that = this;
    that.setData({
      currentTab: e.target.dataset.current
    });
    closeCard(that);
  },

  goIndex: function () {
    wx.reLaunch({
      url: '../index/index'
    })
  },

  goPaper: function () {
    wx.navigateBack({
      delta: 1,
    }); //返回上一页面
  },

  getHtmlTxt: function (str) {
    let sResult = "";
    var dd = str.replace(/<[^>]+>/g, ""); //截取html标签
    sResult = dd.replace(/&nbsp;/ig, ""); //截取空格等特殊标签
    return sResult;
  },

  //查看视频
  toOpenVideo: function () {
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
      success: function (res) {}
    }
  }
})

function resetHeight(that) {
  //调用系统信息，获取可使用屏幕高度
  wx.getSystemInfo({
    success: function (res) {
      var height = res.windowHeight - 50; // 减掉上面用户信息栏的高度，单位px
      that.setData({
        swiperHeight: height
      });
    }
  })
}

//展开答题卡模块
function openCard(that) {
  var openCard = that.data.openCard;

  var animation = wx.createAnimation({
    duration: 500,
    timingFunction: 'ease',
  })

  that.animation = animation

  animation.translateX(-openCard).step()
  that.setData({
    animationData: animation.export()
  })
}

//关闭答题卡模块
function closeCard(that) {
  var openCard = that.data.openCard;
  console.log(openCard);
  var animation = wx.createAnimation({
    duration: 500,
    timingFunction: 'ease',
  })

  that.animation = animation

  animation.translateX(openCard).step()
  that.setData({
    animationData: animation.export()
  })
}