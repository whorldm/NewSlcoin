var Utils = require('../../utils/util.js');
const app = getApp();
var rankTimer;

Page({
  data: {
    My: {},
    scrollHeight: 540,
    isEnterGame: false, //  是否参加比赛
    isStartGame: false  // 是否开赛
  },

  // 监听页面加载
  onLoad: function (options) {
    this.setData({
      scrollHeight: (app.globalData.screenHeight - 375) * 2
    })
  },

  // 监听页面显示
  onShow: function(){
    let enterFlag = wx.getStorageSync('isEnterGame');
    if (enterFlag) {
      let startFlag = wx.getStorageSync('isStartGame');
      if (startFlag) {
        this.setData({
          isEnterGame: true,
          isStartGame: true
        });
        
        this.getRankInfo();
      } else {
        this.setData({
          isEnterGame: true,
          isStartGame: false
        });
      }
    }
  },

  // 监听页面隐藏
  onHide: function() {
    if(rankTimer){
      clearTimeout(rankTimer);
    }
  },

  // 获取排名信息
  getRankInfo: function() {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');
    
    wx.showLoading({
      title: '正在加载中...',
    })
    wx.request({
      url: app.globalData.ROOTURL + '/rank_info',
      data: {
        user_id: temp_user,
        room_num: temp_room
      },
      success: res => {
        wx.hideLoading()
        if(res.statusCode === 200) {
          let myData = {};
          let len = res.data.length;
          for(let i=0; i<len; i++) {
            if(typeof res.data[i] === 'object'){
              res.data[i].nickname = res.data[i].nickname ? decodeURIComponent(res.data[i].nickname) : '匿名';
              res.data[i].wei_pic = res.data[i].wei_pic ? decodeURIComponent(res.data[i].wei_pic) : app.globalData.CommonLogo;
              if (res.data[i].user_id === Number(temp_user)){
                myData = res.data[i];
              }
            }
          }

          if (len > 3) {
            let _rank;
            if(typeof res.data[len-1] === 'object'){
              _rank = res.data.slice(3,len);
            } else {
              _rank = res.data.slice(3,len-1);
            }
            this.setData({
              HeadRank: res.data.slice(0, 3),
              RankList: _rank,
              My: myData
            })
          } else {
            this.setData({
              HeadRank: res.data,
              RankList: [],
              My: myData
            })
          }

        } else {
          wx.showToast({
            title: '获取排名信息失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('请求排名信息失败！');
      }
    })
  },

  // 用户点击右上角分享
  onShareAppMessage: function (res) {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');

    let str = '';
    let startFlag = wx.getStorageSync('isStartGame');

    if (!startFlag) {  // 没有开赛前
      str = '快来参加炒币大赛，20000本金免费领';
      return {
        title: str,
        imageUrl: '../../image/bg_share.png',
        path: '/pages/trade/trade',
      }
    }

    // 开赛后
    str = Utils.showShareTitle(this.data.My.rank, this.data.profit);
    return {
      title: str,
      path: '/pages/trade/trade?room_num=' + temp_user + '&user_id=' + temp_room
    }
  },

  // 立即参加比赛
  ToEnterGame:function () {
    wx.switchTab({
      url: '/pages/trade/trade',
    })
  },

  // 下拉刷新
  onPullDownRefresh: function(){
    if(this.data.isEnterGame){
      this.getRankInfo();
      setTimeout(function () {
        wx.stopPullDownRefresh();
      }, 1000)
    }
  }
})