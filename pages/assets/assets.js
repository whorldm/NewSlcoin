var Utils = require('../../utils/util.js');
let app = getApp();

Page({
  data: {
    userName: '匿名',
    userLogo: '../../image/logo.png',
    myRank: '',
    total: {
      assets: '0.00',
      profit: '0.00',
      yield: '+0.00%'
    },
    coinList: [],
    actionSheetHidden: true, //点击分享，弹出底部菜单
    pos: {}, // 悬浮按钮的样式
    coinAreaHeight: 440, //币种区域的高度
    scrollHeight: 370 // 滑动区域
  },

  // 监听页面加载
  onLoad: function (options) {
    if(app.globalData.windowWidth < 350) {
      this.setData({
        coinAreaHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 850 * 670) * 2,
        scrollHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 850 * 740) * 2
      })
    } else if (app.globalData.windowWidth <= 375) {
      this.setData({
        coinAreaHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 750 * 650) * 2,
        scrollHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 750 * 730) * 2
      })
    } else {
      this.setData({
        coinAreaHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 700 * 670) * 2,
        scrollHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 700 * 730) * 2
      })
    }
  },

  // 监听页面显示
  onShow: function(){
    wx.getStorage({
      key: 'userInfo',
      success: res => {
        this.setData({
          userLogo: res.data.avatarUrl,
          userName: res.data.nickName
        })
      }
    })
    
    wx.getStorage({
      key: 'isEnterGame',
      success: res => {
        if(res.data){
          this.setData({
            isEnterGame: true
          })
          this.getUserAsset();      
        }
      },
    })
  },

  // 获取个人资产信息
  getUserAsset: function (){
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');
    wx.showLoading({
      title: '正在加载中...',
    })
    wx.request({
      url: app.globalData.ROOTURL + '/homePage',
      data: {
        user_id: temp_user,
        room_num: temp_room
      },
      success: res => {
        wx.hideLoading();
        if(res.statusCode === 200) {
          if(res.data.msg === "比赛尚未开始") {
            this.setData({
              myRank: '',
              coinList:[],
              total: {
                assets: res.data.asset,
                profit: '0.00',
                yield: '+0.00%'
              }
            })
          } else {
            let tempArr = []
            if(res.data.coins) {
              for(let i=0,len=res.data.coins.length; i<len; i++){
                if(res.data.coins[i].amount > 0){
                  tempArr.push(res.data.coins[i]);
                }
              }
            }
            this.setData({
              myRank: res.data.userRank,
              coinList: tempArr,
              total: {
                assets: res.data.asset,
                profit: res.data.income || res.data.earnMoney,
                yield: res.data.yield || res.data.earnRate
              }
            })
          }
        } else {
          wx.showToast({
            title: '获取资产信息失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('请求资产信息失败！');
      }
    })
  },

  // 用户点击右上角分享
  onShareAppMessage: function (res) {
    this.actionSheetChange();
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');
   
    let str = '';
    let enterFlag = wx.getStorageSync('isEnterGame');
    let startFlag = wx.getStorageSync('isStartGame');

    if(!enterFlag || this.data.userName === '匿名') { // 未参赛的情况
      str = '快来参加炒币大赛，20000本金免费领';
      return {
        title: str,
        imageUrl: '../../image/bg_share.png',
        path: '/pages/trade/trade',
      }
    }

    if(enterFlag && !startFlag) {  // 已参赛，未开赛
      str = this.data.userName + '邀请你参加炒币大赛，20000本金免费领';
      return {
        title: str,
        path: '/pages/trade/trade?room_num=' + temp_room + '&user_id=' + temp_user,
      }
    }
    
    // 开赛后
    str = Utils.showShareTitle(this.data.myRank, this.data.total.profit);
    return {
      title: str,
      path: '/pages/trade/trade?room_num=' + temp_room + '&user_id=' + temp_user,
    }
  },

  // 悬浮按钮移动样式
  menuMainMove: function (e) {
    let windowWidth = app.globalData.windowWidth
    let windowHeight = app.globalData.windowHeight
    let touches = e.touches[0]
    let clientX = touches.clientX
    let clientY = touches.clientY
    // 边界判断
    if (clientX > windowWidth - 40) {
      clientX = windowWidth - 40
    }
    if (clientX <= 20) {
      clientX = 20
    }
    if (clientY > windowHeight - 60) {
      clientY = windowHeight - 60
    }
    if (clientY <= 60) {
      clientY = 60
    }
    let pos = {
      left: clientX,
      top: clientY,
    }
    this.setData({
      pos,
    })
  },

  // 分享弹出底部菜单
  actionSheetTap: function (e) {
    wx.hideTabBar();
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
  },

  // 点击按钮后关闭菜单
  actionSheetChange: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    });
    wx.showTabBar();
  },

  // 点击生成图片的按钮
  SaveToPicture: function () {
    let startFlag = wx.getStorageSync('isStartGame');
    this.actionSheetChange();
    if(startFlag) {
      wx.navigateTo({
        url: '/pages/priview/priview?rank=' + this.data.myRank + "&income=" + this.data.total.profit,
      })
    } else {
      wx.navigateTo({
        url: '/pages/priview/priview',
      })
    }
  },

  //查看奖励页
  ToMyReward:function () {
    wx.navigateTo({
      url: '/pages/reward/reward',
    })
  },

  //查看我的规则
  ToGameRegular:function () {
    wx.navigateTo({
      url: '/pages/regular/regular',
    })
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    if(this.data.isEnterGame) {
      this.getUserAsset();
      setTimeout(function () {
        wx.stopPullDownRefresh();
      }, 1500)
    }
  }
  
})
