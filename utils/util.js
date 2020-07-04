var tagList = []

function setTagList(tagList) {
  this.tagList = tagList;
}

function getTagName(qid) {
  let tagName = "";
  for (let i = 0; i < this.tagList.length; i++) {
    if (this.tagList[i].hasOwnProperty("qids")) {
      let qids = this.tagList[i].qids;
      for (let j = 0; j < qids.length; j++) {
        if (qids[j] === qid) {
          tagName = this.tagList[i].tagName;
          break;
        }
      }
      if (tagName !== "") {
        break;
      }
    }
  }
  return tagName;
}

function getTagCount(qid) {
  let that = this;
  let tagCount = 0;
  for (let i = 0; i < that.tagList.length; i++) {
    if (that.tagList[i].tagId === qid) {
      tagCount = that.tagList[i].count;
      break;
    }
  }
  return tagCount;
}

// 修改tagID的explain
function getChgTagId(tid) {
  let that = this;
  let item = {};
  let tagExplain = "";
  for (let i = 0; i < that.tagList.length; i++) {
    let id = that.tagList[i].tagId;
    if (id === tid) {
      item = that.tagList[i];
      break;
    }
  }
  //变换tid
  for (let i = 0; i < that.tagList.length; i++) {
    if (that.tagList[i].tagId != tid && that.tagList[i].tagName == item.tagName) {
      tagExplain = that.tagList[i].tagExplain;
      break;
    }
  }
  return tagExplain;
}

// 修改tagID的explain
function getNewTagId(tid) {
  let that = this;
  let item = {};
  let tagId = "";
  for (let i = 0; i < that.tagList.length; i++) {
    let id = that.tagList[i].tagId;
    if (id === tid) {
      item = that.tagList[i];
      break;
    }
  }
  //变换tid
  for (let i = 0; i < that.tagList.length; i++) {
    if (that.tagList[i].tagId != tid && that.tagList[i].tagName == item.tagName) {
      tagId = that.tagList[i].tagId;
      break;
    }
  }
  return tagId;
}

function getTagListInfo() {
  if (this.tagList.length == 0) {
    return false;
  } else {
    return true;
  }
}

function getTagListFirst(tagIndex) {
  let knowList = [];
  for (let index = 0; index < this.tagList.length; index++) {
    let item = this.tagList[index];
    if (item.parentTagId == tagIndex) {
      let tagId = this.getNewTagId(item.tagId);
      let count = '共' + this.getTagCount(tagId) + '题';
      let tag = {
        "id": item.tagExplain,
        "parentName": item.tagName,
        "tagId": item.tagId,
        "parentTagId": item.parentTagId,
        "num": count
      }
      knowList.push(tag);
    }
  }
  return knowList;
}

function getTagListSecond(tagExplain) {
  let scdList = [];
  // 选出第二层
  for (let index = 0; index < this.tagList.length; index++) {
    let item = this.tagList[index];
    if (item.tagExplain.length == 10 && item.tagExplain.indexOf(tagExplain) != -1) {
      let tagId = this.getNewTagId(item.tagId);
      let count = '共' + this.getTagCount(tagId) + '题';
      let tag = {
        "id": item.tagExplain,
        "scdName": item.tagName,
        "tagId": item.tagId,
        "parentTagId": item.parentTagId,
        "num": count
      }
      scdList.push(tag);
    }
  }
  return scdList;
}

function getTagListThird(tagExplain) {
  let thrList = [];
  // 选出第二层
  for (let index = 0; index < this.tagList.length; index++) {
    let item = this.tagList[index];
    if (item.tagExplain.length == 12 && item.tagExplain.indexOf(tagExplain) != -1) {
      let tag = {
        "id": item.tagExplain,
        "thrName": item.tagName,
        "tagId": item.tagId,
        "parentTagId": item.parentTagId,
        "num": ''
      }
      thrList.push(tag);
    }
  }
  return thrList;
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

//////////////////////////////////////////////////////////////
function dateDiff(sDate2) {
  var sDate1 = dateToString(new Date());
  sDate2 = sDate2.substring(0, 10);
  var aDate, oDate1, oDate2, iDays;
  aDate = sDate1.split("-");
  oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]); //转换为yyyy-MM-dd格式
  aDate = sDate2.split("-");
  oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]);
  iDays = parseInt((oDate2 - oDate1) / 1000 / 60 / 60 / 24); //把相差的毫秒数转换为天数
  return iDays; //返回相差天数
}

function formatTime(timestamp) {
  var date = new Date(timestamp);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  // const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

function dateToString(date) {
  var year = date.getFullYear();
  var month = (date.getMonth() + 1).toString();
  var day = (date.getDate()).toString();
  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }
  var dateTime = year + "-" + month + "-" + day;
  return dateTime;
}

module.exports = {
  formatTime: formatTime,
  dateDiff: dateDiff,
  setTagList: setTagList,
  getTagName: getTagName,
  getNewTagId: getNewTagId,
  getTagCount: getTagCount,
  getTagListInfo: getTagListInfo,
  getTagListFirst: getTagListFirst,
  getTagListSecond: getTagListSecond,
  getTagListThird: getTagListThird,
  getChgTagId: getChgTagId
}