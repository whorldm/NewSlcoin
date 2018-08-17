var Utils = require('utils/util.js');

//app.js
App({
  onLaunch: function (options) {
    // 获取设备的屏幕宽高
    wx.getSystemInfo({
      success: res => {
        this.globalData.windowWidth = res.windowWidth;
        this.globalData.windowHeight = res.windowHeight;
        this.globalData.screenWidth = res.screenWidth;
        this.globalData.screenHeight = res.screenHeight;
      }
    })

    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      let updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启？',
              success: res => {
                updateManager.applyUpdate();
              }
            })
          })
          updateManager.onUpdateFailed(function () {
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
            })
          })
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用小程序的更新功能，请升级到最新微信版本后重试。'
      })
    }

    wx.checkSession({
      success: () => {
        // 当前的session_key未过期
        wx.getStorage({
          key: 'user_id',
          success: res => {
            this.globalData.user_id = res.data;
          }
        })
        
        wx.getStorage({
          key: 'room_num',
          success: res => {
            if (res.data !== '') {
              this.globalData.room_num = res.data;
            }
          }
        })
       
        wx.getStorage({
          key: 'endTime',
          success: res => {
            if (res.data !== '') {
              if(new Date(res.data).getTime() > new Date().getTime()){ // 表示比赛尚未结束
                this.globalData.endTime = res.data;
              } else {
                wx.setStorage({
                  key: 'endTime',
                  data: '',
                })
                wx.setStorage({
                  key: "step",
                  data: 4
                });
              }
            }
          }
        })
        
      },
      fail: () => {
        // 当前用户已过期
      }
    })

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.setStorage({
            key: "isAuthorize", // 缓存用户是否授权
            data: true
          })
        } else {
          wx.setStorage({
            key: "isAuthorize",
            data: false
          })
          if(!wx.getStorageSync('isEnterGame') && wx.getStorageSync('step') !== 1){
            wx.setStorage({
              key: "isEnterGame",  //  记录用户是否参加比赛或者比赛是否结束
              data: false
            })
            wx.setStorage({
              key: "isStartGame",  //  记录用户是否参加比赛或者比赛是否结束
              data: false
            })
            wx.setStorage({
              key: "step",  // 记录当前的进行步骤
              data: 1
            })
          }
        }
      }
    })
  },

  //  当用户通过分享进入页面不存在时，页面进入首页
  onPageNotFound(res) {
    wx.switchTab({
      url: 'pages/trade/trade'
    }) 
  },

  // 全局的变量对象
  globalData: {
    REFRESH_TIME: 6,  // 刷新的间隔
    TOTAL_NUM: 15,  //人满开赛的条件
    GAME_TIME: 1,  //比赛的时长(h)
    REWARD_RANK: '前10名', //获取奖励的条件
    CommonLogo: '../../image/logo.png', //默认的头像
    code:'',   // 登录后获取的零时凭证
    user_id: '',  // 用户的唯一标识
    room_num: '',  // 用户参赛的房间号
    endTime: '', //用户当前比赛的结束时间
    ROOTURL: "https://www.luoyunyu.com",  // 云服务器的地址
    // ROOTURL: "http://120.79.64.223:8088",  // 后台服务器的地址
    // ROOTURL: "http://172.20.120.190:8088"  // 本地张的IP地址
    // ROOTURL: "http://172.20.120.201:8088"  // 本地周的IP地址
  }
})