const config = require('../../utils/config.js')
const api_url = config.config.apihost
const Http = require('../../utils/http.js')

Page({
  data: {
    tagid: 0,
    workListIndex: 0,
    workList: []
  },
  onLoad: function (options) {
    let that = this;
    let sid = 100035;
    let token = wx.getStorageSync('token')
    let tagid = parseInt(options.id)

    that.setData({
      tagid: tagid,
      workList: []
    });

    // 可能有多个视频
    Http.get({
      url: api_url + 'tag/video',
      params: {
        sid: sid,
        tagid: tagid,
        token: token
      }
    }).then((data) => {
      if (data.code == '0') {
        let list = [];
        for (let i = 0; i < data.data.videoworkList.length; i++) {
          const item = JSON.parse(JSON.stringify(data.data.videoworkList[i]));
          list.push(item);
        }
        that.setData({
          workList: list
        });
      }
    }).catch((error) => {
      console.log(error)
    })
  },
  goIndex: function (event) {
    let index = parseInt(event.currentTarget.dataset.index);
    let item = this.data.workList[index];
    let token = wx.getStorageSync('token')

    let host = 'https://xcx.maixuexi.cn/v1/base/api/video?vid=';
    let Url = host + item.id + '&sid=' + 100035 + '&tid=' + this.data.tagid + '&token=' + token;
    Url = encodeURIComponent(Url);
    let title = '职称通关 - ' + encodeURIComponent(item.name);

    if (item.iswork == false) {
      Http.get({
        url: api_url + 'tag/video/work',
        params: {
          sid: 100035,
          vid: item.id,
          token: token
        }
      }).then((data) => {
        if (data.code == '0') {
          wx.navigateTo({
            url: '../event-link/event-link?url=' + Url + '&title=' + title
          })
        }
      }).catch((error) => {
        console.log(error)
      })
    } else {
      wx.navigateTo({
        url: '../event-link/event-link?url=' + Url + '&title=' + title
      })
    }
  },
})