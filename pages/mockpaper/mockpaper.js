const config = require('../../utils/config.js')
const util = require('../../utils/util.js')
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    swiperHeight: 500, //滑块高度，这里随意设置
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
    mid: 0,
    show: 0,
    paper_time: 0, //考试时长

    paper: [],
    questions: [],
    stem: [],
    exam_title: '',

    result: 0,
    count: 0,
    correct: 0,
    error: 0,
    use_time: 0,
    error_question: [], //错题列表

    questionindex: 0,
    index: 0,

    dialogShow: false,
    buttons: [{
      text: '返回'
    }, {
      text: '拿积分'
    }],
    subject: '初级会计师',
    course: "会计实务",
    report_time: '',

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

  onLoad: function (options) {
    let that = this;
    let token = wx.getStorageSync('mp_token');
    //加载时设置swiper高度
    resetHeight(that);

    //加载题目
    let mid = parseInt(options.s1);
    let show = parseInt(options.s2);
    let exam_title = options.s3;
    let time = parseInt(options.s4);
    let t1 = parseInt(options.t1);
    let t2 = parseInt(options.t2);
    let t3 = parseInt(options.t3); //开考时间
    const option = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    let subject = '初级会计师';
    let course = "会计实务";
    if (t1 === 2) {
      subject = '中级会计师'
    }
    if (t2 === 2) {
      course = '经济法基础'
    } else if (t2 === 3) {
      course = '财务管理'
    }

    t3 = t3 + 4 * 3600;
    let report_time = util.formatTime(t3 * 1000);

    that.setData({
      mid: mid,
      show: show,
      exam_title: exam_title,
      paper_time: time,
      subject: subject,
      course: course,
      report_time: report_time
    });

    // 加载
    var paper_json = {};
    try {
      var p_item = wx.getStorageSync('paper')
      if (p_item) {
        paper_json = p_item;
      }
    } catch (e) {
      paper_json = {};
    }
    var item_mid = 'A' + mid;
    let items = paper_json[item_mid];
    let str_paper = '';
    let paper = {};
    let questions = [];
    let stem = {};

    try {
      if (items.hasOwnProperty('paper') == true) {
        str_paper = items['paper'];
        paper = JSON.parse(str_paper);
        items = '';
      }

      paper['paper'].paperStructJson = [];
      if (paper.hasOwnProperty("stem") == true) {
        stem = paper['stem'];
      }
    } catch (e) {
      wx.showToast({
        title: '手机加载试卷失败，请重新刷新！',
        icon: 'none',
        duration: 2000,
        success: function () {
          setTimeout(function () {
            wx.navigateBack({
              delta: 1,
            }); //返回上一页面
          }, 2000);
        }
      });
    }

    for (let i = 0; i < paper.questions.length; i++) {
      if (paper.questions[i].hasOwnProperty('mContent') == true) {
        // 材料题
        let mid = paper.questions[i].mid.toString();
        // let mContent = that.getHtmlTxt(paper.questions[i].mContent);
        let mContent = paper.questions[i].mContent;
        mContent = mContent.replace(/<table[^>]*>/gi, function (match, capture) {
          return match.replace(/width=\"(.*)\"/gi, '');
        });
        if (stem.hasOwnProperty(mid) == true) {
          let items = stem[mid];
          for (let j = 0; j < items.length; j++) {
            let item = items[j];
            let qAnswer = item.qAnswer;
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
            paper['paper'].paperStructJson.push(qid_item);
          }
        }
      } else {
        let qContent = paper.questions[i].qContent;
        qContent = qContent.replace(/<table[^>]*>/gi, function (match, capture) {
          return match.replace(/width=\"(.*)\"/gi, '');
        });
        paper.questions[i].qContent = qContent;
        let choice = paper.questions[i].choices;
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
        for (let k = 0; k < paper.questions[i].qAnswer.length; k++) {
          let index = paper.questions[i].qAnswer[k];
          choices[index].thistrue = true;
        }

        paper.questions[i].choices_info = choices;
        paper.questions[i].done = false;

        if (paper.questions[i].qType) {
          if (!paper.questions[i].qResolve) {
            paper.questions[i].qResolve = {}
          }
          paper.questions[i].resolve = Object.keys(paper.questions[i].qResolve);
        }

        paper.questions[i].isContent = false;

        let info = JSON.stringify(paper.questions[i]);
        questions.push(JSON.parse(info));

        let qid_item = {
          qid: paper.questions[i].qid
        }
        paper['paper'].paperStructJson.push(qid_item);
      }
    }

    var completeNum = 0;

    // 如果是可以考试状态，需要从本地缓存加载已经完成的试题内容
    if (show == 0) {
      var paper_json = {};
      try {
        var p_item = wx.getStorageSync('paper')
        if (p_item) {
          paper_json = p_item;
        }
      } catch (e) {
        paper_json = {};
      }
      var item_mid = 'B' + that.data.mid;
      if (paper_json.hasOwnProperty(item_mid) == true) {
        let local_questions = paper_json[item_mid];
        if (local_questions.length == questions.length) {
          questions = local_questions;
        }
      }
      //统计答题数量
      completeNum = 0;
      for (let i = 0; i < questions.length; i++) {
        if (questions[i].done == true) {
          completeNum++;
        }
      }
      that.setData({
        questions: questions,
        completeNum: completeNum
      });
      //打开定时器
      atimer(that)();
    } else {
      // 查看试卷，先获取服务器上的答题数据
      Http.post({
        url: url + 'v1/base/api/mockexam/answer?token=' + token,
        params: {
          mid: that.data.mid,
          token: token
        }
      }).then((data) => {
        if (data.status == 1) {
          // 交卷过
          let str_json = data.answer_json;
          let server_questions = JSON.parse(str_json);
          //统计答题数量
          completeNum = 0;
          for (let i = 0; i < server_questions.length; i++) {
            if (server_questions[i].done == true) {
              for (let j = 0; j < questions.length; j++) {
                if (questions[j].qid == server_questions[i].qid) {
                  questions[j].qAnswer = server_questions[i].qAnswer;
                  questions[j].done = server_questions[i].done;
                  for (let k = 0; k < questions[j].choices_info.length; k++) {
                    for (let l = 0; l < server_questions[i].choices_info.length; l++) {
                      if (questions[j].choices_info[k].option == server_questions[i].choices_info[l].option) {
                        questions[j].choices_info[k].selected = server_questions[i].choices_info[l].selected;
                        questions[j].choices_info[k].thistrue = server_questions[i].choices_info[l].thistrue;
                        break;
                      }
                    }
                  }
                  break;
                }
              }
              completeNum++;
            }
          }
          that.setData({
            questions: questions,
            completeNum: completeNum
          });
        } else {
          wx.showToast({
            title: '本场模考未参加！不能查看答题数据。',
            icon: 'none',
            duration: 2000,
            success: function () {
              setTimeout(function () {
                wx.navigateBack({
                  delta: 1,
                }); //返回上一页面
              }, 2000);
            }
          });
        }
      }).catch((error) => {
        console.log(error)
      })
    }

    that.setData({
      paper: paper,
      questions: questions,
      completeNum: completeNum,
      stem: stem
    });

    //获取屏幕宽度
    wx.getSystemInfo({
      success: function (res) {
        var screenWidth = res.screenWidth;
        that.setData({
          openCard: screenWidth
        });
      }
    });
  },

  //navBar的高度 
  commonNavAttr(e) { 
    if (e.detail) { 
      this.setData({ 
        commonNavAttr: e.detail 
      }) 
    } 
  },

  tapDialogButton: function (e) {
    let index = e.detail.index;
    this.setData({
      dialogShow: false
    })
    if (index == 0) {
      // 返回上级
      wx.switchTab({
        url: '../index/index'
      })
    } else {
      // 获取积分
      wx.redirectTo({
        url: '../mycoin/mycoin'
      })
    }
  },

  onMyCoin() {
    wx.redirectTo({
      url: '../mycoin/mycoin'
    })
  },

  //计算器
  onCalculator: function () {
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
  keepTime: function () {
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
  runTimer: function () {
    var that = this;
    var time = that.data.time;

    if (!time.status) {
      atimer(that)();
      time.status = !time.status;
    }
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

    //设置面板距离顶部的距离
    var y = pageY - 14;

    that.setData({
      boxHeight: y
    });
  },

  //选择题选项控制
  selectedItem: function (e) {
    var that = this;
    var touchNode = e.currentTarget;
    var questions = that.data.questions;
    var completeNum = 0;

    if (that.data.show == 1) {
      return;
    }
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
    }
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].done == true) {
        completeNum++;
      }
    }

    var index = parseInt(touchNode.dataset.parentindex) + 1;
    that.setData({
      index: index,
      questions: questions,
      completeNum: completeNum
    })

    //将数据更新到本地缓存
    var paper_json = {};
    try {
      var p_item = wx.getStorageSync('paper')
      if (p_item) {
        paper_json = p_item;
      }
    } catch (e) {
      paper_json = {};
    }
    var item_mid = 'B' + that.data.mid;
    paper_json[item_mid] = that.data.questions;
    wx.setStorageSync('paper', paper_json);
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

  goResult: function () {
    let that = this;

    if (this.data.show == 1) {
      wx.showToast({
        title: '跳转到报告页面！',
        icon: 'none',
        duration: 2000,
        success: function () {
          setTimeout(function () {
            wx.navigateBack({
              delta: 1,
            }); //返回上一页面
          }, 2000);
        }
      });
    } else {
      wx.showModal({
        title: '模考交卷',
        cancelText: "放弃", //默认是“取消”
        confirmText: "确定", //默认是“确定”
        content: '确定要交卷吗？',
        success(res) {
          if (res.confirm) {
            that.handPaper();
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      });
    }
  },

  handPaper() {
    let that = this;
    let token = wx.getStorageSync('mp_token');

    that.getResult();

    let answer_item = [];
    //得到精简的答案数据
    for (let i = 0; i < that.data.questions.length; i++) {
      let choice_info = [];
      let choices_info_item = that.data.questions[i].choices_info;
      for (let j = 0; j < choices_info_item.length; j++) {
        let choices_item = {
          'selected': choices_info_item[j].selected,
          'option': choices_info_item[j].option,
          'thistrue': choices_info_item[j].thistrue,
        }
        choice_info.push(choices_item);
      }
      let item = {
        'choices_info': choice_info,
        'done': that.data.questions[i].done,
        'qAnswer': that.data.questions[i].qAnswer,
        'qid': that.data.questions[i].qid
      }
      answer_item.push(item);
    }
    let answer_str = JSON.stringify(answer_item);

    let pid = '0';
    let report = 0; //出报告
    Http.post({
      url: url + 'v1/base/api/mockexam/hand?token=' + token,
      params: {
        mid: that.data.mid,
        pid: pid,
        key: answer_str,
        result: that.data.result,
        count: that.data.count,
        correct: that.data.correct,
        error: that.data.error,
        time: that.data.use_time,
        report: report,
        error_question: that.data.error_question,
        token: token
      }
    }).then((data) => {
      if (data.status == 0) {
        that.setData({
          dialogShow: true
        })
      } else if (data.status == 1) {
        {
          wx.showToast({
            title: '不能重复交卷！',
            icon: 'none',
            duration: 5000
          });
        }
      } else if (data.status == 2) {
        wx.showToast({
          title: '交卷失败！',
          icon: 'none',
          duration: 5000
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  // 计算成绩
  getResult: function () {
    // 用时
    var time = this.data.time;
    var m = parseInt(time.m);
    var s = parseInt(time.s);
    var n = m * 60 + s;
    var error_question = [];

    this.setData({
      use_time: n
    })
    // 成绩
    let result = 0;
    let count = this.data.completeNum;
    let correct = 0;
    let error = 0;
    for (let i = 0; i < this.data.questions.length; i++) {
      let item = this.data.questions[i];
      if (item.done == true) {
        // 只看回答的数据
        let choices_info = item.choices_info;
        let bOK = true;
        for (let j = 0; j < choices_info.length; j++) {
          if (choices_info[j].selected != choices_info[j].thistrue) {
            bOK = false;
            break;
          }
        }
        if (bOK == true) {
          correct++;
          // 正确加分
          result = parseFloat(result) + parseFloat(item.qScore);
        } else {
          // 错误，判断题倒扣分
          error_question.push(i);
          error++;
          if (item.qType === 9) {
            for (let j = 0; j < choices_info.length; j++) {
              if (choices_info[j].selected == true && choices_info[j].thistrue == false) {
                let qScore = parseFloat(item.qScore) / 2;
                result = parseFloat(result) - qScore.toFixed(2);
                result = result.toFixed(2);
                break;
              }
            }
          } else if (item.qType === 10) {
            // 不定项选择
            let r = 0.0
            for (let j = 0; j < choices_info.length; j++) {
              if (choices_info[j].selected == choices_info[j].thistrue && choices_info[j].thistrue == true) {
                r = r + 0.5;
              } else if (choices_info[j].selected == true && choices_info[j].thistrue == false) {
                r = 0;
                break;
              }
            }
            result = parseFloat(result) + parseFloat(r);
            result = result.toFixed(2);
          }
        }
      }
    }
    if (result < 0) {
      result = 0;
    }
    this.setData({
      result: result,
      count: count,
      correct: correct,
      error: error,
      error_question: error_question,
    })
  },

  getHtmlTxt: function (str) {
    let sResult = "";
    var dd = str.replace(/<[^>]+>/g, ""); //截取html标签
    sResult = dd.replace(/&nbsp;/ig, ""); //截取空格等特殊标签
    return sResult;
  },

  bindtap: function (res) {
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
  var time1 = that.data.paper_time - 300; //5分钟提醒;
  var time2 = that.data.paper_time - 60; //1分钟提醒;
  var time3 = that.data.paper_time - 1; //交卷

  var m = parseInt(time.m);
  var s = parseInt(time.s);

  var n = m * 60 + s;
  var bOver = true;

  function Countdown() {
    if (bOver == true) {
      timer = setTimeout(function () {
        Countdown();
      }, 1000);
    } else {
      if (timer != 0) {
        clearTimeout(timer);
        timer = 0;
      }
    }

    n++;

    // 倒计时弹出提醒
    if (n == time1) {
      //5分钟
      wx.showToast({
        title: '注意:5分钟后结束考试！',
        icon: 'none',
        duration: 2000
      });
    } else if (n == time2) {
      //1分钟
      wx.showToast({
        title: '注意:1分钟后结束考试！',
        icon: 'none',
        duration: 2000
      });
    } else if (n == time3) {
      bOver = false;
      //交卷
      wx.showToast({
        title: '考试结束，交卷中！',
        icon: 'none',
        duration: 2000
      });
      that.handPaper();
    }
    // 计算显示时间
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