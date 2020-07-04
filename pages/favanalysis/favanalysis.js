const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    swiperHeight: 100, //滑块高度，这里随意设置
    favStatus: false, //收藏状态
    screenHeight: 0, //获取窗口高度
    boxHeight: 160, //设置材料区域高度
    openCard: 100, //设置答题卡平移量
    animationData: {}, //动画
    currentTab: 0,
    completeNum: 0,
    //题目测试
    qids: [],
    type_info: 0,

    questions: [],
    questionindex: 0,
    index: 0
  },
  onLoad: function (options) {
    let that = this;
    let token = wx.getStorageSync('token');
    let ids = options.qids;
    let qids = JSON.parse(ids);
    const option = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    that.setData({
      qids: qids
    });

    //加载时设置swiper高度
    resetHeight(that);

    let questions = [];

    for (let i = 0; i < qids.length; i++) {
      Http.get({
        url: api_url + 'test/question?token=' + token,
        params: {
          qid: qids[i],
          token: token
        }
      }).then((data) => {
        if (data.code == '0') {
          let question = data.data;
          let qContent = question.qContent;
          qContent = qContent.replace(/<table[^>]*>/gi, function (match, capture) {
            return match.replace(/width=\"(.*)\"/gi, '');
          });
          question.qContent = qContent;
          let choice = question.choices;
          let choices = [];
          for (var j = 0; j < choice.length; j++) {
            let s = choice[j];
            let item = {
              "text": that.getHtmlTxt(s),
              "selected": false,
              "option": option[j],
              "thistrue": false
            }
            choices.push(item);
          }

          question.choices_info = choices;
          question.done = false;
          question.answer = "";

          // 正确答案
          for (var j = 0; j < question.qAnswer.length; j++) {
            let index = question.qAnswer[j];
            question.choices_info[index].thistrue = true;
            question.answer = "" + question.answer + option[index];
          }

          if (question.qType) {
            if (!question.qResolve) {
              question.qResolve = {}
            }
            question.resolve = question.qResolve;
            question.resolve['本题解析'] = that.getHtmlTxt(question.resolve['本题解析']);
          }
          question.show_set = 1;

          // 我的作答
          question.done = false;
          question.you_answer = "";

          questions.push(question);
        }

        that.setData({
          questions: questions
        });
      }).catch((error) => {
        console.log(error)
      })
    }


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

  //选择题选项控制
  selectedItem: function (e) {
    var that = this;
    var touchNode = e.currentTarget;
    var completeNum = 0;
    let questions = that.data.questions;

    for (var i = 0; i < questions.length; i++) {
      if (touchNode.dataset.parentindex == i) {
        var choItems = questions[i].choices_info;

        //遍历以选择的选项累计值，初始为选项的数量
        for (var j = 0; j < choItems.length; j++) {
          if (touchNode.id == j) {
            choItems[j].selected = !choItems[j].selected;
          } else {
            //如果是单选题,将其他选择清空
            if (touchNode.dataset.chotype == 1 || touchNode.dataset.chotype == 9) {
              choItems[j].selected = false;
            }
          }
        }
        //显示出答案
        questions[i].show_set = 0;

        questions[i].done = true;
        break;
      }
      //统计答题数量
      if (questions[i].done) {
        completeNum++;
      }
    }

    var index = parseInt(touchNode.dataset.parentindex) + 1;
    that.setData({
      index: index,
      questions: questions,
      completeNum: completeNum
    })
  },

  //答题卡展开
  toopenCard: function () {
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
      success: function (res) { }
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