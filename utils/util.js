/**
 * request请求封装
 * url {String}   传递方法名
 * types {Number} 传递方式(1,GET,2,POST)
 * data {Object}  传递数据对象
 */

function getDataFromServer(url, data = {}, types = 2) {
  // 获取公共配置
  var ROOTURL = "https://www.luoyunyu.com";
  // 请求校验
  var checkData = {};
  // 合并对象，处理请求参数
  var params = mergeObj(checkData, data);

  var promise = new Promise(function (resolve, reject) {
    wx.request({
      url: ROOTURL + url,
      data: params,
      method: (types === 1) ? 'GET' : 'POST',
      header: (types === 1) ? { 'content-type': 'application/json' } : { 'content-type': 'application/x-www-form-urlencoded' },
      success: function (res) {
        if (res.statusCode === 200) {
          resolve(res)
        } else {
          reject(res)
        }
      },
      fail: function(res) {
        reject(res)
      }
    })
  });
  return promise;
}
// object 对象合并
function mergeObj(o1, o2) {
  for (var key in o2) {
    o1[key] = o2[key]
  }
  return o1;
}


// 计算倒计时的时间差
const completeTime = function (endTime) {
  if(endTime === '') {
    return -1;
  }
  let now = new Date().getTime();
  let end = new Date(endTime).getTime();
  return end - now;
}


// 转换事件格式
function ToDate(inputstr) {
  //Wed Mar 22 13:38:37 CST 2017
  inputstr = inputstr + " "; //末尾加一个空格
  var date = "";
  var month = new Array();
  var week = new Array();

  month["Jan"] = 1; month["Feb"] = 2; month["Mar"] = 3; month["Apr"] = 4; month["May"] = 5; month["Jan"] = 6;
  month["Jul"] = 7; month["Aug"] = 8; month["Sep"] = 9; month["Oct"] = 10; month["Nov"] = 11; month["Dec"] = 12;

  var str = inputstr.split(" ");
  date = str[5];
  date += '/' + month[str[1]] + '/' + str[2];
  date += " " + str[3];

  return date;
}


// 处理个人所持币的格式（字符串转为对象）
function DealMyOwn(str) {
  if (str === '') {
    return {};
  }
  let temp = str.split(",");
  let item = {};
  for (let i = 0, len = temp.length; i < len; i++) {
    if (temp[i] !== "") {
      let key = temp[i].split(" ");
      if(Number(key[1]) !== 0){
        item[key[0]] = key[1];
      }
    }
  }
  return item;
}


// 处理时间的格式 yyyy-MM-dd hh:mm:ss
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function getTheEndTime (date) {
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  let hour = date.getHours()
  let minute = date.getMinutes()
  let second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}


// 时间格式化输出 hh:mm:ss
function dateFormat(mis_second) {
  var second = Math.floor(mis_second / 1000); // 总的秒数
  var hr = fill_zero_prefix(Math.floor(second / 3600)); // 小时位
  var min = fill_zero_prefix(Math.floor((second - hr * 3600) / 60));  // 分钟位
  var sec = fill_zero_prefix((second - hr * 3600 - min * 60));  // 秒位
  var ms = parseInt((mis_second / 100) % 10); // 豪秒位
  return hr + ":" + min + ":" + sec + " " + ms;
}
// 位数不足补零
function fill_zero_prefix(num) {
  return num < 10 ? "0" + num : num
}


// 获取公有数据--key:表示要取字段的键值
function checkParams (that,app,key) {
  let temp = app.globalData[key];
  if (temp === '') {
    if (that.data[key] !== '' && that.data[key] !== undefined && that.data[key] !== null) {
      temp = that.data[key];
    } else {
      wx.getStorage({
        key: key,
        success: res => {
          temp = res.data;
        },
      })
    }
  }
  return temp;
}


// 从所有币种中筛选出用户持有币种的信息
function fliterArray (src, target) {
  let tempArr = [];
  if(JSON.stringify(target) !== '{}') {
    for(let key in target) {
      for(let i=0,len=src.length;i<len;i++) {
        if(src[i].coin_type === key){
          tempArr.push(src[i]);
        }
      }
    }
  }
  return tempArr;
}



// 根据排名显示不同的分享文案
function showShareTitle (rank,profit) {
  let str = '';
  if (Number(rank) === 1) {
    str = '我在炒币大咖中拿了冠军，不服来挑战!';
  } else if (Number(rank) <= 3) {
    str = '就差那么一点，快来帮我拿下炒币冠军!';
  } else if (Number(rank) < 15) {
    if (Number(profit) > 0) {
      str = '短短几分钟，我赚了这么多，你行么?';
    } else {
      str = '亏多少我都不怕，因为我在炒币大咖';
    }
  } else {
    str = "快来拉我一把，我觉得我还能赢！";
  }
  return str;
}

// 比赛结束后根据排名显示不同的背景
function showResultImg(rank, profit) {
  let temp = {};
  if (Number(rank) === 1) {
    temp = {
      bg_url: '../../image/gameover/one.png',
      title: '所向无敌'
    }
  } else if (Number(rank) <= 3){
    temp = {
      bg_url: '../../image/gameover/two_three.png',
      title: '为所欲为'
    }
  } else if(Number(rank) < 15) {
    if (Number(profit) > 0) {
      temp = {
        bg_url: '../../image/gameover/high_rate.png',
        title: '与巴菲特谈笑风生'
      }
    } else {
      temp = {
        bg_url: '../../image/gameover/low_rate.png',
        title: '统领丐帮'
      }
    }
  } else {
    temp = {
      bg_url: '../../image/gameover/jump.png',
      title: '顶楼排队'
    }
  }
  return temp;
}


module.exports = {
  formatTime: formatTime,
  getTheEndTime: getTheEndTime,
  getDataFromServer: getDataFromServer,
  completeTime: completeTime,
  DealMyOwn: DealMyOwn,
  dateFormat: dateFormat,
  ToDate:ToDate,
  checkParams: checkParams,
  fliterArray: fliterArray,
  showShareTitle: showShareTitle,
  showResultImg: showResultImg
}