var Utils = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    userLogo: '../../image/logo.png',
    isInvited: true,
    inviteList:[],  // 已邀请好友列表
  },

  // 监听页面加载
  onLoad: function (options) {
   
  },

  // 监听页面显示
  onShow: function () {
    wx.getStorage({
      key: 'userInfo',
      success: res => {
        this.setData({
          userLogo: res.data.avatarUrl
        });
      },
    })
    this.getInvitedInfo();
  },

  // 获取邀请列表的信息
  getInvitedInfo: function () {
    let that = this;
    let temp_user = Utils.checkParams(that,app,'user_id');

    wx.request({
      url: app.globalData.ROOTURL + '/invitation',
      data: {
        user_id: temp_user,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          if (res.data.data === '') {
            this.setData({
              isInvited: false
            })
          } else {
            for(let i=0,len=res.data.length; i<len; i++){
              res.data[i].nickname = res.data[i].nickname ? decodeURIComponent(res.data[i].nickname) : '匿名';
              if (res.data[i].wei_pic || res.data[i].weiPic) {
                res.data[i].wei_pic = decodeURIComponent(res.data[i].wei_pic || res.data[i].weiPic);
              } else {
                res.data[i].wei_pic = '../../image/logo.png';
              }
            }
            this.setData({
              inviteList: res.data
            })
          }
        } else {
          wx.showToast({
            title: '获取邀请列表失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('获取邀请列表失败！');
      }
    })
  },


  // 用户点击右上角分享
  onShareAppMessage: function () {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');

    return {
      title: '快来助我一臂之力，一举拿下炒币大咖',
      path: '/pages/trade/trade?room_num=' + temp_room + '&user_id=' + temp_user,
    }
  }

})