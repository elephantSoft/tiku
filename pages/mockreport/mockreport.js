import * as echarts from '../../components/ec-canvas/echarts.min.js';

const config = require('../../utils/config.js')
const util = require('../../utils/util.js')
const url = config.config.host
const Http = require('../../utils/http.js')

Page({
  data: {
    aid: 0,
    mid: 0,
    title: '-',
    exam_count: 0,
    delivery_time: '-',
    my_result: 0,
    my_time: '0\'0',
    bPass: false,
    my_rank: 0,
    pass_rank: 0,
    tags: [],
    subject: '',
    course: '',
    // 正确率
    correct_rate: [0, 0],
    // 答题速度
    speed_rate: [0, 0, 0, 0],

    ecBar: {
      lazyLoad: true // 延迟加载
    },

    ecScatter: {
      lazyLoad: true
    },

    dialogShow: false,
    buttons: [{
      text: '我已了解'
    }],
  },

  onLoad: function (options) {
    let that = this;
    let token = wx.getStorageSync('mp_token');
    //加载题目
    let mid = parseInt(options.s1);
    let aid = parseInt(options.s2);

    that.setData({
      mid: mid,
      aid: aid
    });

    // 查看试卷，先获取服务器上的答题数据
    Http.post({
      url: url + 'v1/base/api/mockexam/report/info?token=' + token,
      params: {
        mid: that.data.mid,
        aid: that.data.aid,
        token: token
      }
    }).then((data) => {
      if (data.status == 0) {
        let exam_str = data.exam_analyes;
        let exam_analyes = JSON.parse(exam_str);
        let title = data.title;
        let exam_count = exam_analyes.mock_count;
        let delivery_time = data.delivery_time.substring(5, 16);
        let my_result = data.result;

        let subject = '初级会计师'
        if (data.subject == 2) {
          subject = '中级会计师'
        }
        let course = '会计实务'
        if (data.course == 2) {
          course = '经济法基础'
        } else if (data.subject == 3) {
          course = '财务管理'
        }

        let s_time = data.time;
        let mm = Math.floor(s_time / 60);
        let ss = Math.floor(s_time % 60);
        let my_time = '' + mm + '\'' + ss;

        let my_rank = data.rank;
        let pass_rank = data.pass_rank;

        let bPass = false;
        if (my_rank > pass_rank) {
          bPass = false;
        } else {
          bPass = true;
        }

        // 获取错误最高的10道题
        let tags = [];
        let length = exam_analyes.error_question.length;
        if (length > 10) {
          length = 10;
        }
        for (let i = 0; i < length; i++) {
          let a_item = exam_analyes.error_question[i];
          let item = {
            'id': a_item.index,
            'value': '知识点'
          };
          tags.push(item);
        }

        // 计算正确率
        let my_rate = data.correct * 100 / data.count;
        my_rate = my_rate.toFixed(2);
        let pass_rate = exam_analyes.all_correct * 100 / exam_analyes.all_count;
        pass_rate = pass_rate.toFixed(2);
        let correct_rate = [my_rate, pass_rate];

        // 计算答题速度
        let my_speed = data.time / data.count;
        my_speed = my_speed.toFixed(0);
        let pass_speed = exam_analyes.all_time / exam_analyes.all_up_count;
        pass_speed = pass_speed.toFixed(0);
        let mix_speed = exam_analyes.mix_time / exam_analyes.mix_count;
        mix_speed = mix_speed.toFixed(0);
        // 计算显示最大值
        let max = mix_speed;
        if (max < pass_speed) {
          max = pass_speed;
        }
        if (max < my_speed) {
          max = my_speed;
        }
        max = max / 0.8;
        max = max.toFixed(0);
        let speed_rate = [mix_speed, pass_speed, my_speed, max];

        that.setData({
          title: title,
          subject: subject,
          course: course,
          exam_count: exam_count,
          delivery_time: delivery_time,
          my_result: my_result,
          my_time: my_time,
          bPass: bPass,
          my_rank: my_rank,
          pass_rank: pass_rank,
          tags: tags,
          correct_rate: correct_rate,
          speed_rate: speed_rate
        });

        // 获取答题数据
        // 查看试卷，先获取服务器上的答题数据
        Http.post({
          url: url + 'v1/base/api/mockexam/answer?token=' + token,
          params: {
            mid: that.data.mid,
            token: token
          }
        }).then((data) => {
          if (data.status == '1') {
            // 交卷过
            let str_json = data.answer_json;
            let questions = JSON.parse(str_json);
            //统计答题数量
            for (let i = 0; i < that.data.tags.length; i++) {
              let item = tags[i];
              let index = item.id;
              if (questions[index].hasOwnProperty('qResolve') == true) {
                if (questions[index].qResolve.hasOwnProperty('知识点') == true) {
                  let key = questions[index].qResolve['知识点'];
                  if (key != '') {
                    item.value = key;
                    // 获取tagid
                  }
                }
              }
            }
          }
        }).catch((error) => {
          console.log(error)
        })

        this.echartsBar = this.selectComponent('#mychart-dom-multi-bar');
        this.onBarInit();

        this.echartsScatter = this.selectComponent('#mychart-dom-multi-scatter');
        this.onScatterInit();
      } else {
        wx.showToast({
          title: 'Sorry,没有找到对应的报告！',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },

  toInfo: function () {
    this.setData({
      dialogShow: true
    });
  },

  tapDialogButton: function (e) {
    this.setData({
      dialogShow: false
    })
  },

  //初始化图表
  onBarInit: function () {
    let that = this;
    this.echartsBar.init((canvas, width, height, dpr) => {
      // 初始化图表
      const barChart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });
      canvas.setChart(barChart);
      barChart.setOption(that.getBarOption());

      return barChart;
    });
  },

  getBarOption: function () {
    let that = this;
    return {
      title: {
        text: '',
        subtext: ''
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['考生平均值(%)', '我的正确率(%)']
      },
      xAxis: {
        type: 'value',
        max: '100'
      },
      yAxis: {
        type: 'category',
        data: ['']
      },
      series: [
        {
          name: '考生平均值(%)',
          type: 'bar',
          data: [that.data.correct_rate[1]],
          color: ['#e6b600']
        },
        {
          name: '我的正确率(%)',
          type: 'bar',
          data: [that.data.correct_rate[0]],
          color: ['#053afe']
        }
      ]
    }
  },

  onScatterInit: function () {
    let that = this;
    this.echartsScatter.init((canvas, width, height, dpr) => {
      // 初始化图表
      const scatterChart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });
      canvas.setChart(scatterChart);
      scatterChart.setOption(that.getScatterOption());

      return scatterChart;
    });
  },

  getScatterOption: function () {
    let that = this;
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a}{b}: {c}'
      },
      legend: {
        show: true,
        data: ['最快(秒)', '平均(秒)', '我的(秒)']
      },
      color: ['#dc1439', '#e6b600', '#053afe'],
      series: [
        {
          name: '最快(秒)',
          type: 'pie',
          radius: ['35%', '20%'],//环的位置
          center: ['50%', '56%'],
          label: {
            normal: {
              position: 'inner'
            }
          },
          labelLine: {
            normal: {
              show: false
            }
          },
          data: [
            {
              value: that.data.speed_rate[0], //需要显示的数据speed_rate = [mix_speed, pass_speed, my_speed, max];
              itemStyle: {
                normal: {
                  color: '#dc1439'
                }
              }
            },
            {
              value: that.data.speed_rate[3] - that.data.speed_rate[0], //不需要显示的数据，颜色设置成和背景一样
              itemStyle: {
                normal: {
                  color: 'transparent'
                }
              }
            }
          ]
        },
        {
          name: '平均(秒)',
          type: 'pie',
          radius: ['55%', '40%'],
          center: ['50%', '56%'],
          label: {
            normal: {
              position: 'inner'
            }
          },
          labelLine: {
            normal: {
              show: false
            }
          },
          data: [
            {
              value: that.data.speed_rate[1],
              itemStyle: {
                normal: {
                  color: '#e6b600'
                }
              }
            },
            {
              value: that.data.speed_rate[3] - that.data.speed_rate[1],
              itemStyle: {
                normal: {
                  color: 'transparent'
                }
              },
            }
          ]
        },
        {
          name: '我的(秒)',
          type: 'pie',
          radius: ['75%', '60%'],
          center: ['50%', '56%'],
          label: {
            normal: {
              position: 'inner'
            }
          },
          labelLine: {
            normal: {
              show: false
            }
          },
          data: [
            {
              value: that.data.speed_rate[2],
              itemStyle: {
                normal: {
                  color: '#053afe'
                }
              }
            },
            {
              value: that.data.speed_rate[3] - that.data.speed_rate[2],
              itemStyle: {
                normal: {
                  color: 'transparent'
                }
              }
            }
          ]
        },
      ]
    };
  }
});
