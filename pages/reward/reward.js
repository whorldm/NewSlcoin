var Utils = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    RewardList:[],
    scrollHeight: 750
  },

  // 监听页面加载
  onLoad: function (options) {
    this.setData({
      scrollHeight: app.globalData.windowHeight * 2 - app.globalData.windowWidth / 750 * 640
    })
  },

  // 监听页面显示
  onShow: function () {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');

    wx.showLoading({
      title: '正在加载中...',
    })
    wx.request({
      url: app.globalData.ROOTURL + '/rewardInfo',
      data: {
        user_id: temp_user
      },
      success: res => {
        wx.hideLoading();
        if(res.statusCode === 200){
          if(res.data.data && res.data.data === '') {
            
          } else {
            for (let i = 0, len = res.data.length; i < len; i++) {
              res.data[i].endTime = ChangeTheStyle(res.data[i].roomNum);
            }
            this.setData({
              RewardList: res.data
            })
          }
        } else {
          wx.showToast({
            title: '获取奖励信息失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error(err);
      }
    })
  }
})

function ChangeTheStyle(time) {
  if(time === '') {
    return time
  }
  let arr = time.split(" ");
  return arr[1];
}