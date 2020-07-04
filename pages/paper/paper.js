const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    swiperHeight: 500, //滑块高度，这里随意设置
    title: '练习',
    //计时器
    time: {
      m: "00",
      s: "00",
      status: true
    },
    screenHeight: 0, //获取窗口高度
    boxHeight: 160, //设置材料区域高度
    openCard: 100, //设置答题卡平移量
    animationData: {}, //动画
    animationCacl: {}, //动画
    currentTab: 0,
    completeNum: 0,
    title: '',
    workId: 0,
    cid: 0,
    status: 0,
    id: 0,
    inMix: 0,
    pid: 0,

    paper: [],
    questions: [],
    stem: [],

    questionindex: 0,
    index: 0,

    //底部功能按钮数组
    array: ['返回', 'AC', '←', "÷",
      '7', '8', '9', '×',
      '4', '5', '6', '-',
      '1', '2', '3', '+',
      '+/-', '0', '.', '='
    ],
    currentEnd: '0', //当前的结果
    operator: '', //记录运算符式
    isCal: false
  },

  onLoad: function(options) {
    let that = this;
    let token = wx.getStorageSync('token')
    //加载时设置swiper高度
    resetHeight(that);

    //加载题目
    let workId = parseInt(options.wid);
    let cid = parseInt(options.cid);
    let status = parseInt(options.status);; //uWorkStatus===flag
    let id = parseInt(options.id);
    let isMix = parseInt(options.isMixed);
    let pid = parseInt(options.pid);
    const option = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    that.setData({
      workId: workId,
      cid: cid,
      status: status,
      id: id,
      inMix: isMix,
      pid: pid
    });

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
              item.qContent = item.qAnswer;
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

              // 正确答案
              for (let k = 0; k < qAnswer.length; k++) {
                let index = qAnswer[k];
                choices[index].thistrue = true;
              }

              item.choices_info = choices;
              item.done = false;

              if (item.qType) {
                if (!item.qResolve) {
                  item.qResolve = {}
                }
                item.resolve = Object.keys(item.qResolve);
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

          // 正确答案
          for (let k = 0; k < data.data.questions[i].qAnswer.length; k++) {
            let index = data.data.questions[i].qAnswer[k];
            choices[index].thistrue = true;
          }

          data.data.questions[i].choices_info = choices;
          data.data.questions[i].done = false;

          if (data.data.questions[i].qType) {
            if (!data.data.questions[i].qResolve) {
              data.data.questions[i].qResolve = {}
            }
            data.data.questions[i].resolve = Object.keys(data.data.questions[i].qResolve);
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

      let studentId = wx.getStorageSync('student');
      let completeNum = 0;
      // 记录回答数据
      Http.get({
        url: api_url + 'answer/user/work',
        params: {
          studentId: studentId,
          workId: that.data.workId,
          token: token
        }
      }).then((data) => {
        if (data.code == "0") {
          let list = data.data.answerList;
          let questions = that.data.questions;
          for (var i = questions.length - 1; i >= 0; i--) {
            let qid = '' + questions[i].qid;
            if (list.hasOwnProperty(qid) == true) {
              let item = list[qid];
              if (item.hasOwnProperty('answer') == true) {
                let qAnswer = item['answer'];
                // 作答过
                var choItems = questions[i].choices_info;
                //遍历以选择的选项累计值，初始为选项的数量
                for (var n = qAnswer.length - 1; n >= 0; n--) {
                  for (var m = 0; m < choItems.length; m++) {
                    if (qAnswer[n] == m) {
                      choItems[m].selected = !choItems[m].selected;
                      questions[i].done = true;
                    } else {
                      //如果是单选题,将其他选择清空
                      if (questions[i].qtype == 1 || questions[i].qtype == 9) {
                        choItems[m].selected = false;
                      }
                    }
                  }
                }
                //统计答题数量
                if (questions[i].done == true) {
                  completeNum++;
                }
              }
            }
          }

          that.setData({
            questions: questions,
            completeNum: completeNum
          });
        }
      }).catch((error) => {
        console.log(error)
      })

      Http.put({
        url: api_url + 'userwork?token=' + token,
        params: {
          "id": id,
          "token": token
        }
      }).then((data) => {
        console.log("开始进行作业")
      }).catch((error) => {
        console.log(error)
      })

      let title = '职称通关 - ' + paper.paperName;
      wx.setNavigationBarTitle({
        title: title
      })

      that.setData({
        paper: paper,
        questions: questions,
        stem: stem,
        title: title
      });
    }).catch((error) => {
      console.log(error)
    })

    atimer(that)();

    //获取屏幕宽度
    wx.getSystemInfo({
      success: function(res) {
        var screenWidth = res.screenWidth;
        that.setData({
          openCard: screenWidth
        });
      }
    })
  },

  //计算器
  onCalculator: function() {
    var openCard = this.data.openCard;

    var animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease',
    })

    this.animation = animation

    animation.translateX(-openCard).step()
    this.setData({
      animationCacl: animation.export()
    })
  },

  //休息，暂停计时
  keepTime: function() {
    var that = this;
    var time = that.data.time;

    if (time.status) {
      clearTimeout(timer);
      time.status = !time.status;
    }

    that.setData({
      time: time
    })
  },

  //开始计时
  runTimer: function() {
    var that = this;
    var time = that.data.time;

    if (!time.status) {
      atimer(that)();
      time.status = !time.status;
    }
  },

  //加收藏
  addFav: function() {
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
  touchMove: function(e) {
    var that = this;
    //先获取屏幕窗口高度
    wx.getSystemInfo({
      success: function(res) {
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

    //设置面板距离顶部的距离
    var y = pageY - 14;

    that.setData({
      boxHeight: y
    });
  },

  //切换试题
  changeTab: function(e) {
    let index = e.detail.current;
    this.setData({
      questionindex: index
    });
    let current = this.data.index - 1;
    if (current >= 0) {
      if (this.data.questions[current].done == true) {
        this.saveQuestion(current);
      }
    }
  },

  //选择题选项控制
  selectedItem: function(e) {
    var that = this;
    var touchNode = e.currentTarget;
    var questions = that.data.questions;
    var completeNum = 0;

    for (var i = 0; i < questions.length; i++) {
      if (touchNode.dataset.parentindex == i) {
        var choItems = questions[i].choices_info;
        var bChoice = false;

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
          if (choItems[j].selected == true) {
            bChoice = true;
          }
        }
        if (bChoice == true) {
          questions[i].done = true;
        } else {
          questions[i].done = false;
        }
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
  toopenCard: function() {
    var that = this;
    let current = that.data.index - 1;
    if (current >= 0) {
      if (that.data.questions[current].done == true) {
        this.saveQuestion(current);
      }
    }
    openCard(that);
  },

  //答题卡关闭
  tocloseCard: function() {
    var that = this;
    closeCard(that);
  },

  //点击答题卡跳转到相应的题目
  swichNav: function(e) {
    var that = this;
    that.setData({
      currentTab: e.target.dataset.current
    });
    closeCard(that);
  },

  goResult: function() {
    let token = wx.getStorageSync('token')

    // 需要提交单题数据
    Http.put({
      url: api_url + 'userwork/submit?token=' + token,
      params: {
        id: this.data.id,
        token: token
      }
    }).then((data) => {
      if (!data.status) {
        wx.navigateTo({
          url: '../result/result?wid=' + this.data.workId + '&pid=' + this.data.pid + '&id=' + this.data.id
        })
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  getHtmlTxt: function(str) {
    let sResult = "";
    var dd = str.replace(/<[^>]+>/g, ""); //截取html标签
    sResult = dd.replace(/&nbsp;/ig, ""); //截取空格等特殊标签
    return sResult;
  },

  saveQuestion: function(current) {
    let item = this.data.paper.paperStructJson[current];
    let qType = this.data.questions[current].qType;
    let answer_item = this.data.questions[current].choices_info;
    let answer = [];

    for (let i = 0; i < answer_item.length; i++) {
      if (answer_item[i].selected == true) {
        answer.push(i);
      }
    }

    let token = wx.getStorageSync('token');
    let studentId = wx.getStorageSync('student');

    // 需要提交单题数据
    Http.put({
      url: api_url + 'answer/submit/single?token=' + token,
      params: {
        workId: this.data.workId,
        studentId: studentId,
        qid: item.qid,
        qType: qType,
        answer: answer,
        token: token
      }
    }).then((data) => {
      if (!data.status) {} else if (data.status == 3) {
        // 用户已交卷
        alert('您已经交过卷了哦');
        wx.navigateTo({
          url: '../result/result?wid=' + this.data.workId + '&pid=' + this.data.pid + '&id=' + this.data.id
        })
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  bindtap: function(res) {
    //获取点击的
    // console.log(res.currentTarget.dataset.index);
    var index = res.currentTarget.dataset.index;
    //取出当前的值
    var currentEnd = this.data.currentEnd;
    //查看当前的运算符
    var operator = this.data.operator;
    //下面处理点击事件
    if (index == 0) {
      //返回上一级
      closeCalculator(this);
    } else if (index == 1) {
      //AC按钮点击 清空
      currentEnd = '0';
      operator = '';
    } else if (index == 2) {
      //回退按钮 清空
      var endW = operator.substr(-1, 1);
      if (endW == '/' || endW == '*' || endW == '+' || endW == '-') {
        console.log("最后是运算符，不做处理");
      } else {
        if (currentEnd.length > 0) {
          currentEnd = currentEnd.substr(0, currentEnd.length - 1);
        }
      }
    } else if (index == 16) {
      //正负取反
      //如果最后一位是运算符就不做处理
      var endW = operator.substr(-1, 1);
      if (endW == '/' || endW == '*' || endW == '+' || endW == '-') {
        console.log("最后是运算符，不做处理");
      } else {
        //正负取反处理
        var str = operator.substr(0, operator.length - (currentEnd + '').length);
        currentEnd = currentEnd * 1;
        currentEnd = -currentEnd;
        operator = str + (currentEnd + '');
      }
    } else if (index == 18) {
      //小数点点击
      //如果最后一位是运算符就不做处理
      var endW = operator.substr(-1, 1);
      if (endW == '%' || endW == '/' || endW == '*' || endW == '+' || endW == '-') {
        console.log("最后是运算符，不做处理");
      } else {
        //小数点点击处理
        if ((currentEnd + '').indexOf('.') == -1) {
          currentEnd = currentEnd + '.';
          operator += '.';
        } else {
          console.log('已经是小数了，不做处理');
        }
      }
    } else if (index == 19) {
      //等号点击
      //判断最后一位
      //最后一位是运算符就去掉
      //最后一位是小数点也去掉
      var endW = operator.substr(-1, 1);
      if (endW == '/' || endW == '*' || endW == '+' || endW == '-' || endW == '.') {
        operator = operator.substr(0, operator.length - 1);
      }
      //等号点击运算结果
      currentEnd = jisuanFun(operator);
      //再次点击从新开始
      operator = '' + currentEnd;
      this.setData({
        isCal: true
      })
    }
    /* 下面是运算符类 */
    else if (index == 3) {
      //运算符'/';
      operator = fuhaoFun(operator, '/');
      if (this.data.isCal == true) {
        this.setData({
          isCal: false
        })
      }
    } else if (index == 7) {
      //运算符'*';
      operator = fuhaoFun(operator, '*');
      if (this.data.isCal == true) {
        this.setData({
          isCal: false
        })
      }
    } else if (index == 11) {
      //运算符'-';
      operator = fuhaoFun(operator, '-');
      if (this.data.isCal == true) {
        this.setData({
          isCal: false
        })
      }
    } else if (index == 15) {
      //运算符'+';
      operator = fuhaoFun(operator, '+');
      if (this.data.isCal == true) {
        this.setData({
          isCal: false
        })
      }
    }
    /* 剩下的都是数字 */
    else if (index == 17) {
      //数字0
      if (this.data.isCal == true) {
        currentEnd = '0';
        operator = '0';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 0);
        operator += '0';
      }
    } else if (index == 12) {
      //数字1
      if (this.data.isCal == true) {
        currentEnd = '1';
        operator = '1';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 1);
        operator += '1';
      }
    } else if (index == 13) {
      //数字2
      if (this.data.isCal == true) {
        currentEnd = '2';
        operator = '2';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 2);
        operator += '2';
      }
    } else if (index == 14) {
      //数字3
      if (this.data.isCal == true) {
        operator = '3';
        currentEnd = '3';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 3);
        operator += '3';
      }
    } else if (index == 8) {
      //数字4
      if (this.data.isCal == true) {
        operator = '4';
        currentEnd = '4';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 4);
        operator += '4';
      }
    } else if (index == 9) {
      //数字5
      if (this.data.isCal == true) {
        operator = '5';
        currentEnd = '5';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 5);
        operator += '5';
      }
    } else if (index == 10) {
      //数字6
      if (this.data.isCal == true) {
        operator = '6';
        currentEnd = '6';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 6);
        operator += '6';
      }
    } else if (index == 4) {
      //数字7
      if (this.data.isCal == true) {
        operator = '7';
        currentEnd = '7';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 7);
        operator += '7';
      }
    } else if (index == 5) {
      //数字8
      if (this.data.isCal == true) {
        operator = '8';
        currentEnd = '8';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 8);
        operator += '8';
      }
    } else if (index == 6) {
      //数字9
      if (this.data.isCal == true) {
        operator = '9';
        currentEnd = '9';
        this.setData({
          isCal: false
        })
      } else {
        currentEnd = yunsuanFun(operator, currentEnd, 9);
        operator += '9';
      }
    }
    console.log(operator + '=====' + currentEnd);
    // 对于超过位数的float控制位数
    currentEnd = currentEnd.toString();
    currentEnd = currentEnd.substr(0, 11);
    //所有情况处理完赋值
    this.setData({
      currentEnd: currentEnd,
      operator: operator,
    })
  },

  //navBar的高度
  commonNavAttr(e) {
    if (e.detail) {
      this.setData({
        commonNavAttr: e.detail
      })
    }
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

function resetHeight(that) {
  //调用系统信息，获取可使用屏幕高度
  wx.getSystemInfo({
    success: function(res) {
      var height = res.windowHeight - 50; // 减掉上面用户信息栏的高度，单位px
      console.log("可使用屏幕高度" + res.windowHeight)
      that.setData({
        swiperHeight: height
      });
    }
  })
}

//计时器
var timer;

function atimer(that) {
  var time = that.data.time;

  var m = time.m;
  var s = time.s;

  var n = m * 60 + s;

  function Countdown() {
    timer = setTimeout(function() {
      Countdown();
    }, 1000);

    n++;

    m = parseInt(n / 60);
    s = parseInt(n % 60);
    if (m < 10) {
      m = "0" + m;
    }
    if (s < 10) {
      s = "0" + s;
    }
    time.m = m;
    time.s = s;

    that.setData({
      time: time
    })

  };
  return Countdown;
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

//关闭计算器模块
function closeCalculator(that) {
  var openCard = that.data.openCard;
  var animation = wx.createAnimation({
    duration: 500,
    timingFunction: 'ease',
  })

  that.animation = animation

  animation.translateX(openCard).step()
  that.setData({
    animationCacl: animation.export()
  })
}

function isdigit(a) {
  if (a <= '9' && a >= '0')
    return true;
  else
    return false;
}

function work(a, b, c) {
  if (c == '+')
    return a + b;
  if (c == '-')
    return a - b;
  if (c == '*')
    return a * b;
  if (c == '/')
    return a / b;
}

//输入=号进行计算
function jisuanFun(str) {
  const level = new Array();
  level['+'] = 1;
  level['-'] = 1;
  level['*'] = 2;
  level['/'] = 2;

  const opt = new Array();
  opt['+'] = 2;
  opt['-'] = 2;
  opt['*'] = 2;
  opt['/'] = 2;

  var stack1 = new Array();
  var stack2 = new Array();
  var top1 = 0;
  var top2 = 0;

  console.log(str)
  if (str[0] == '-')
    str = '0' + str;
  for (var i = 0; i < str.length; i++) {
    if (isdigit(str[i])) {
      var j = i;
      var result = 0;
      var result2 = 0;
      while (j < str.length + 1 && isdigit(str[j])) {
        result = result * 10 + Number(str[j]);
        j++;
      }
      if (str[j] == '.') {
        var bit = 0.1;
        j++;
        while (j < str.length + 1 && isdigit(str[j])) {
          result2 += str[j] * bit;
          bit /= 10.0;
          j++;
        }
      }
      stack2[++top2] = result + result2;
      i = j - 1;
    } else if (top1 == 0 || level[str[i]] > level[stack1[top1]]) {
      stack1[++top1] = str[i];
    } else {
      while (top1 > 0 && level[str[i]] <= level[stack1[top1]]) {
        var oper = stack1[top1--];
        if (opt[oper] == 2) {
          var num1 = stack2[top2--];
          var num2 = stack2[top2--];
          var num = work(num2, num1, oper);
        } else {
          var num1 = stack2[top2--];
          var num = work(num1, 0, oper);
        }
        stack2[++top2] = num;
      }
      stack1[++top1] = str[i];
    }
  }
  while (top1 > 0) {
    var oper = stack1[top1--];
    if (opt[oper] == 2) {
      var num1 = stack2[top2--];
      var num2 = stack2[top2--];
      var num = work(num2, num1, oper);
    } else {
      var num1 = stack2[top2--];
      var num = work(num1, 0, oper);
    }
    stack2[++top2] = num;
  }
  return stack2[top2];
}

//输入的是数字的时候进行运算
function yunsuanFun(operator, currentEnd, num) {
  //判断是否是重新开始的
  if (operator.length == 0) {
    currentEnd = num;
    return currentEnd;
  }
  //不是重新开始的运算
  var endW = operator.substr(-1, 1);
  if (endW == '%' || endW == '/' || endW == '*' || endW == '+' || endW == '-') {
    currentEnd = num;
  } else {
    if (currentEnd == 0) {
      //初始时点击数字
      currentEnd = num;
    } else {
      currentEnd = currentEnd + '' + num;
    }
  }
  return currentEnd;
}

//输入的是运算符的时候进行运算
function fuhaoFun(operator, fuhao) {
  //点击了等号后点击了运算符
  if (operator.length == 0) {
    operator = 0 + fuhao;
    return operator;
  }
  //判断是不是运算符
  var endW = operator.substr(-1, 1);
  if (endW == '/' || endW == '*' || endW == '+' || endW == '-') {
    //把最后一个运算符进行替换掉
    operator = operator.substr(0, operator.length - 1);
    operator += fuhao;
  } else if (endW == '.') {
    //最后一位为小数点的情况
    operator = operator + '0' + fuhao;
  } else {
    //直接添加运算符
    operator += fuhao;
  }
  return operator;
}