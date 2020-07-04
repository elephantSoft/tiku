const config = require('/utils/config.js')
const util = require('/utils/util.js')
const url = config.config.host
const api_url = config.config.apihost
const Http = require('/utils/http.js')

//app.js
App({
  onLaunch: function (options) {
    let path = options.path;
    if (path.indexOf('pages/splash/splash') >= 0) {
      wx.setStorageSync('showAD', 0);
    } else {
      wx.setStorageSync('showAD', 1);
    }
  },
  
  getInitLogin: function () {
    return new Promise(function (resolve, reject) {
      // 登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          Http.post({
            url: url + 'v1/wxmp/login/getcode',
            params: {
              jsCode: res.code
            }
          }).then((data) => {
            let openid = data.data.openid;
            let token = data.data.token;
            let studentid = data.data.studentid;
            let goods = data.data.goods;
            let show = data.data.show;
            wx.setStorageSync('openid', openid);
            wx.setStorageSync('mp_token', goods);
            wx.setStorageSync('student', studentid);
            wx.setStorageSync('token', token);
            wx.setStorageSync('show', show);

            resolve(res);
          }).catch((error) => {
            console.log(error)
          })
        }
      })
    })
  },

  getInitSys: function () {
    return new Promise(function (resolve, reject) {
      let token = wx.getStorageSync('token');
      
      Http.get({
        url: api_url + 'tag',
        params: {
          isPublic: 1,
          tagType: 3,
          page: 1,
          size: 99999,
          token: token
        }
      }).then((data) => {
        if (data.code == '0') {
          var tagList = data.data.tagList;
          util.setTagList(tagList);
          // 获取tags信息
          Http.get({
            url: api_url + 'the/wrong/question/tags/student',
            params: {
              page: 1,
              size: 20,
              token: token
            }
          }).then((data) => {
            if (data.code = '0') {
              let tags = data.data.tagList;
              let bFlag = false;
              let tagId = 0;
              for (let i = 0; i < tags.length; i++) {
                let tag = tags[i];
                if (tag.tagName === "智能练习") {
                  bFlag = true;
                  tagId = tag.tagId;
                  break;
                }
              }
              if (bFlag == true) {
                wx.setStorageSync('favTag', tagId);
                resolve(data);
              } else {
                // 保存一个新的tag
                Http.post({
                  url: api_url + 'tag?token=' + token,
                  params: {
                    tagName: "智能练习",
                    tagType: 9,
                    isPublic: 0,
                    token: token
                  }
                }).then((data) => {
                  // 获取tags信息
                  Http.get({
                    url: api_url + 'the/wrong/question/tags/student',
                    params: {
                      page: 1,
                      size: 20,
                      token: token
                    }
                  }).then((data) => {
                    if (data.code = '0') {
                      let tags = data.data.tagList;
                      let bFlag = false;
                      let tagId = 0;
                      for (let i = 0; i < tags.length; i++) {
                      let tag = tags[i];
                      if (tag.tagName === "智能练习") {
                        bFlag = true;
                        tagId = tag.tagId;
                        break;
                      }
                      }
                      if (bFlag == true) {
                        wx.setStorageSync('favTag', tagId);
                      }
                      resolve(data);
                    }
                  }).catch((error) => {
                    console.log(error)
                  })
                }).catch((error) => {
                  console.log(error)
                })
              }
            }
          }).catch((error) => {
            console.log(error)
          })
        }
      }).catch((error) => {
        console.log(error)
      })
    })
  },

  globalData: {
    systeminfo: false
  },

  onShow: function () {
    console.log('App Show')
  },

  onHide: function () {
    console.log('App Hide')
  }
})