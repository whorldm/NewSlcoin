var Utils = require('../../utils/util.js');
const app = getApp();
var coinTimer;  //获取币种信息的定时器
var waitTime; // 等待比赛开始的定时器
var timer;  //比赛倒计时的定时器
var total_second = 1 * 60 * 60 * 1000; // 比赛的倒计时

Page({
  data: {
    user_id: '',
    room_num: '',
    newPerson: {   // 比赛规则的详情信息
      total_num: 30,
      game_time: 2,
      reward_rank: '前10名'
    },
    tabHeight: 650,
    step: 1, // 表示进行的步骤：1-未参赛，2-邀请好友，3-开赛进行交易，4-比赛结束
    isEnterGame: false, // 是否参加比赛
    isStartGame: false, // 是否开赛
    unFullNum: 1, // 当前房间人数
    countURL: '',  // 开赛前倒计时的数字图标 
    clockURL: '../../image/countdown/1.png', // 条形倒计时的图片
    clock: "00:00:00 0",  // 开赛后的倒计时

    coinList: [], // 当前所有币种信息数组
    coinCost: '--', // 买入时的成本价
    coinIndex: 0,  // 买入时选择的币种（coinList数组中所在的序号）

    ownCoinList: [], // 自己所持币种的所有信息
    ownCoinCost: '--', //卖出时的成本价
    ownCoinIndex: 0,  // 卖出时选择的币种（ownCoinList数组中所在的序号）

    currentTab: 0, // 当前所在的tab：0-买入，1-卖出，2-交易记录 
    msgList:['目前暂无交易记录'],  // 滚动消息的数组
    recordList:[],  // 交易记录的数组
    our: {
      rank: '', // 当前用户的排名
      assets: '20000',  // 目前的资产
      possess: [], // 目前持有的币种
      income: '',  // 目前的持仓盈亏
      yield: ''  // 目前的收益率
    },
    userInfo: {   // 用户的个人基本信息
      avatarUrl: '../../image/logo.png',
      nickName: '用户名',
    },
    gameResult: {  // 比赛结束后的样式
      bg_url: '',
      title: ''
    },
    actionSheetHidden: true, //比赛结束后点击分享，弹出底部菜单
    query: {}  //保存分享而来的参数信息
  },

  // 监听页面加载
  onLoad: function (options) {
    // 如果是从分享中进入，获取分享人的ID和房间号
    if(options.user_id) {
      this.setData({
        query: {
          from: options.user_id,
          room_num: options.room_num
        }
      })
    }
    // 获取比赛的基本参数
    this.setData({
      newPerson: {
        total_num: app.globalData.TOTAL_NUM,
        game_time: app.globalData.GAME_TIME,
        reward_rank: app.globalData.REWARD_RANK
      },
    })
    // 如果用户退出后再次进入小程序，获取缓存的user_id和room_num
    wx.getStorage({
      key: 'room_num',
      success: res => {
        this.setData({
          room_num: res.data
        })
      }
    })
    wx.getStorage({
      key: 'user_id',
      success: res => {
        this.setData({
          user_id: res.data
        })
      }
    })

    // 获取用户的基本信息
    wx.getStorage({
      key: 'userInfo', 
      success: res => {
        this.setData({
          userInfo: res.data,
        })
      }
    })

    // 计算TabContent的自适应高度
    if (app.globalData.windowWidth < 350) {
      this.setData({
        tabHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 850 * 430) * 2
      })
    } else if (app.globalData.windowWidth <= 375) {
      if(app.globalData.windowHeight <= 500) {
        this.setData({
          tabHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 750 * 380) * 2
        })
      } else {
        this.setData({
          tabHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 750 * 450) * 2
        })
      }
    } else if (app.globalData.windowWidth <= 500){
      this.setData({
        tabHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 700 * 450) * 2
      })
    } else {
      this.setData({
        tabHeight: (app.globalData.windowHeight - app.globalData.windowWidth / 700 * 400) * 2
      })
    }
  },

  // 监听页面显示
  onShow: function(){
    wx.getStorage({
      key: 'step',
      success: res => {
        this.setData({
          step: res.data
        })
        this.JugeTheStatus(res.data);
      }
    })
  },

  // 监听页面隐藏
  onHide: function () {
    if(coinTimer) {
      clearTimeout(coinTimer);
    }
    if(waitTime) {
      clearTimeout(waitTime);
    }
    if (timer) {
      clearTimeout(timer);
    }
  },

  // 判断用户的状态，并初始化数据
  JugeTheStatus: function (step) {
    if (step === 2) {
      this.getRoomInfo();
    }

    if (step === 3) {
      if (timer) {
        clearTimeout(timer);
      }
      if(waitTime){
        clearTimeout(waitTime);
      }

      if (this.data.currentTab === 0) {
        this.Buy = this.selectComponent("#buy");
        this.Buy.init();
      } else if (this.data.currentTab === 1) {
        this.Sale = this.selectComponent("#sale");
        this.Sale.init();
      }

      this.getCoinInfo();
      this.getRollingInfor();
      this.getMyAssets();

      wx.getStorage({
        key: 'endTime',
        success: (res) => {
          total_second = Utils.completeTime(res.data);
          if (total_second > 0) {
            CountOneDay(this);
          } else {
            this.JugeTheStatus(4);
            wx.setStorage({
              key: "step",
              data: 4
            });
          }
        },
      })
    }

    if(step === 4) {
      if(coinTimer) {
        clearTimeout(coinTimer);
      }
      this.getLastReward();
      wx.getStorage({
        key: 'userInfo',
        success: res => {
          this.setData({
            userInfo: res.data,
          })
        }
      })
    } 
  },

  // 获取FormId
  getFormId: function (e) {
    if(this.data.formId) {
      this.setData({
        formIdEnd: e.detail.formId
      });
    } else {
      this.setData({
        formId: e.detail.formId
      });
    }
  },

  // 点击立即参赛，获取用户信息权限
  getUserInfo: function (e) {
    let userData = {};
    if (e.detail.userInfo) { // 用户点击了授权,并将用户的信息缓存
      wx.setStorage({
        key: "isAuthorize",
        data: true
      })
      wx.setStorage({
        key: "userInfo",
        data: e.detail.userInfo
      })
      app.globalData.userInfo = e.detail.userInfo;

      userData = {
        nickname: encodeURIComponent(e.detail.userInfo.nickName),
        wei_pic: encodeURIComponent(e.detail.userInfo.avatarUrl),
        time: Utils.formatTime(new Date())
      };
      this.userLogin(userData);

    } else {  // 用户拒绝了授权
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，可能没办法更好的体验炒币大咖!',
        showCancel: false,
        success: res => {
          userData = {
            nickname: encodeURIComponent('匿名'),
            wei_pic: encodeURIComponent('../../image/logo.png'),
            time: Utils.formatTime(new Date())
          };
          this.userLogin(userData);
        }
      })
    }
  },

  // 用户登录，并获取user_id
  userLogin: function (userData) {
    wx.showLoading({
      title: '正在分配房间中...',
    })
    wx.login({
      success: res => {
        if (res.code) {
          app.globalData.code = res.code;
          let params = userData;
          params.code = res.code;
          params.time = Utils.formatTime(new Date());

          wx.request({
            url: app.globalData.ROOTURL + '/authorization',
            data: params,
            success: res => {
              if (res.statusCode === 200) {
                app.globalData.user_id = res.data.user_id;
                this.setData({
                  user_id: res.data.user_id
                })
                wx.setStorage({
                  key: 'user_id',
                  data: res.data.user_id
                })
          
                this.joinGame(res.data.user_id);
              }
            },
            fail: err => {
              wx.showToast({
                title: '获取user_id失败',
                icon: 'none'
              });
            }
          })
        } else {
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
      }
    })
  },
  
  // 立即参赛
  joinGame: function (temp) {
    let params = {
      user_id: temp,
      formId: this.data.formId,
      formIdEnd: this.data.formIdEnd,
      time: Utils.formatTime(new Date())
    }
    if (this.data.query.from) {
      params.from = this.data.query.from;
      params.room_num = this.data.query.room_num;
    }
    
    wx.request({
      url: app.globalData.ROOTURL + '/game/join',
      data: params,
      success: res => {
        if (res.statusCode === 200) {
          wx.hideLoading(); //关闭分配房间的提示
      
          let currenStep = 2;
          app.globalData.room_num = res.data.roomNum || res.data.room_num;

          if (res.data.isStartGame && res.data.end_time) { //  异地登陆后，该用户以及参见过比赛，且该比赛尚未结束
            currenStep = 3;
            wx.setStorage({
              key: "isStartGame",
              data: true
            })
            wx.setStorage({
              key: "endTime",
              data: Utils.ToDate(res.data.end_time)
            })
          }

          this.setData({
            step: currenStep,
            room_num: res.data.roomNum || res.data.room_num,
            isEnterGame: true,
            isStartGame: currenStep === 3,
            unFullNum: res.data.number || 14
          })

          this.JugeTheStatus(currenStep);  //登录后变更状态，需要重新初始化数据

          wx.setStorage({
            key: "step",
            data: currenStep
          })
          wx.setStorage({
            key: "room_num",
            data: res.data.roomNum || res.data.room_num
          })
          wx.setStorage({
            key: "isEnterGame",
            data: true
          })
        } else {
          wx.showToast({
            title: '参赛失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '参赛失败',
          icon: 'none'
        })
      }
    })
  },

  // 在等待开赛时，轮询获取房间的信息
  getRoomInfo: function () {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');

    clearTimeout(waitTime);

    wx.request({
      url: app.globalData.ROOTURL + '/room_info',
      data: {
        user_id: temp_user,
        room_num: temp_room,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({
            unFullNum: res.data.number
          })

          if (res.data.number >= app.globalData.TOTAL_NUM && res.data.endTime) {
            let temp_time;
            if(res.data.endTime === null || res.data.endTime === 'null'){
              temp_time = getTheEndTime(new Date(new Date().getTime() + app.globalData.GAME_TIME * 60 * 60 * 1000))
            } else {
              temp_time = Utils.ToDate(res.data.endTime);
            }

            clearTimeout(waitTime);
            this.StartGame(temp_time);
            return ;
          }
        } else {
          wx.showToast({
            title: '获取房间信息失败',
            icon: 'none'
          })
        }
        
        waitTime = setTimeout(() => {
          this.getRoomInfo();
        }, 1000);
      },
      fail: err => {
        console.error('获取房间信息失败！');
      }
    })
  },

  // 请求虚拟货币的基本信息
  getCoinInfo: function() {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');

    clearTimeout(coinTimer);

    wx.request({
      url: app.globalData.ROOTURL + '/coin_info',
      data: {
        user_id: temp_user,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          let temp_arr = Utils.fliterArray(res.data, this.data.our.possess);
          this.setData({
            coinList: res.data,
            coinCost: res.data[this.data.coinIndex].coin_cost,
            ownCoinList: temp_arr,
            ownCoinCost: temp_arr.length > 0 ? temp_arr[this.data.ownCoinIndex].coin_cost : '--'
          })

          coinTimer = setTimeout(() => {
            this.getCoinInfo();
          }, app.globalData.REFRESH_TIME * 1000);

        } else {
          wx.showToast({
            title: '获取币种信息失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('获取币种信息失败！');
      }
    })
  },

  // 获取比赛时的用户交易信息
  getRollingInfor: function () {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');

    wx.request({
      url: app.globalData.ROOTURL + '/rolling',
      data: {
        user_id: temp_user,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          if(res.data.length > 0) {
            this.setData({
              msgList: res.data
            });
          }
        } else {
          wx.showToast({
            title: '获取交易信息失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('获取交易信息失败！');
      }
    })
  },

  //请求当前用户的个人资产
  getMyAssets: function () {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');

    wx.request({
      url: app.globalData.ROOTURL + '/personAsset',
      data: {
        user_id: temp_user,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({
            our: {
              assets: res.data.money,
              possess: Utils.DealMyOwn(res.data.possess)
            }
          })
        } else {
          wx.showToast({
            title: '获取个人资产信息失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('请求当前用户的个人资产失败！');
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
    if(this.data.step !== 4) {  // 比赛未结束
      let userData = wx.getStorageSync('userInfo');
      if(userData) {
        str = userData.nickName + '邀请你参加炒币大赛，20000本金免费领';
      } else {
        str = '快来参加炒币大赛，20000本金免费领';
      }
      return {
        title: str,
        imageUrl: '../../image/bg_share.png',
        path: '/pages/trade/trade?room_num=' + temp_room + '&user_id=' + temp_user,
      }
    }
    // 比赛结束，使用截图分享
    str = Utils.showShareTitle(this.data.our.rank, this.data.our.assets);
    if(Number(this.data.our.rank) === 15) {
      str = '亏多少我都不怕，因为我在炒币大咖';
    }
    return {
      title: str,
      path: '/pages/trade/trade?room_num=' + temp_room + '&user_id=' + temp_user,
    }
  },

  // 开始比赛(目前是点击金币图片，实现开赛)
  StartGame: function (endTime){
    this.setData({
      isStartGame:true,
      endTime: endTime
    });
    wx.setStorage({
      key: 'isStartGame',
      data: true,
    })
    wx.setStorage({
      key: 'endTime',
      data: endTime,
    })
    count_down(this);
  },

  // 买入时选择币种事件 
  bindPickerChange: function(e) {
    let item = this.data.coinList[e.detail.value];
    this.setData({
      coinIndex: Number(e.detail.value),
      coinCost: item.coin_cost
    })

    if(this.data.currentTab === 0) {
      this.Buy = this.selectComponent('#buy');
      this.Buy.init();
    }
  },

  // 个人所持有币的下拉选择框
  ownCoinPickerChange: function (e){
    let item = this.data.ownCoinList[e.detail.value];
    this.setData({
      ownCoinIndex: Number(e.detail.value),
      ownCoinCost: item.coin_cost
    })

    if (this.data.currentTab === 1) {
      this.Sale = this.selectComponent("#sale");
      this.Sale.init();
    }
  },

  // 选择买入/卖出/交易记录的Tab
  switchTab: function (e) {
    let tab = e.currentTarget.id;
    switch(tab) {
      case 'tabbuy':
        this.setData({ currentTab: 0 });
        this.Buy = this.selectComponent('#buy');
        this.Buy.init();
        break;
      case 'tabsale':
        this.setData({ currentTab: 1 });
        this.initOwnCoinList(); // 选择了卖出，初始化用户目前的持有币种
        this.Sale = this.selectComponent("#sale");
        this.Sale.init();
        break;
      case 'tabrecord':
        this.setData({ currentTab: 2 });
        this.getUserRecords();
        break;
    }
  },

  // 初始化个人目前所持有的币
  initOwnCoinList: function () {
    let tempList = Utils.fliterArray(this.data.coinList, this.data.our.possess);
    this.setData({
      ownCoinList: tempList,
      ownCoinCost: tempList.length > 0 ? tempList[this.data.ownCoinIndex].coin_cost : '--'
    });
  },

  // 查看本人的当场比赛的交易记录
  getUserRecords: function (){
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');

    wx.request({
      url: app.globalData.ROOTURL + '/transactionRecord',
      data: {
        user_id: temp_user,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          this.setData({
            recordList: res.data
          })
        } else {
          wx.showToast({
            title: '获取个人交易记录失败',
            icon: 'none'
          })
        }
      },
      fail: err => {
        console.error('获取个人交易记录失败！');
      }
    })
  },

  // 买入卖出成功后，更新个人资产
  ChangeMyAssets: function(obj) {
    let refresh;

    if(obj.detail.type === 'buy'){
      refresh = () => {
        this.selectComponent("#buy").updateMoney(this.data.our.assets);
        this.changeCoinCost(obj.detail.base_price, obj.detail.coin_type,'buy');
        this.getRollingInfor();
      }
    } else {
      refresh = () => {
        this.changeCoinCost(obj.detail.base_price, obj.detail.coin_type,'sale');
        this.selectComponent("#sale").updateMoney(this.data.our.possess);
        this.getRollingInfor();
      }
    }

    this.setData({
      our: {
        assets: obj.detail.money,
        possess: Utils.DealMyOwn(obj.detail.possess)
      }
    }, refresh);
  },

  // 进行买卖交易后，更新币种的成本价
  changeCoinCost: function (base_price,coin_type,flag) {
    let str, ownStr ,tempList = [];

    // 只要交易成功，就需要更新coinList的成本价
    for (let i = 0, len = this.data.coinList; i < len; i++) {
      if (this.data.coinList[i].coin_type === coin_type) {
        str = "coinList[" + i + "].coin_cost";
        break;
      }
    }

    if(flag === 'buy') {
      tempList = Utils.fliterArray(this.data.coinList, this.data.our.possess);
      for(let i=0;i<tempList.length;i++){
        if(tempList[i].coin_type === coin_type) {
          tempList[i].coin_cost = base_price;
        }
      }
      this.setData({
        [str]: base_price,
        coinCost: base_price,
        ownCoinList: tempList,
        ownCoinCost: tempList.length > 0 ? tempList[this.data.ownCoinIndex].coin_cost : '--',
      })
    }

    if(flag === 'sale') {
      if (base_price === '--') {  // 表示卖空了
        tempList = Utils.fliterArray(this.data.coinList, this.data.our.possess);
        this.setData({
          [str]: base_price,
          coinCost: base_price,
          ownCoinIndex: 0,
          ownCoinList: tempList,
          ownCoinCost: tempList.length > 0 ? tempList[0].coin_cost : '--'
        })

      } else {  // 表示未卖完
        for (let i = 0, len = this.data.ownCoinList; i < len; i++) {
          if (this.data.ownCoinList[i].coin_type === coin_type) {
            ownStr = "ownCoinList[" + i + "].coin_cost";
            break;
          }
        }
        this.setData({
          [str]: base_price,
          [ownStr]: base_price,
          ownCoinCost: base_price
        })
      }
    }
  },

  // 比赛结束
  GameOver: function(){
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');
    wx.showLoading({
      title: '结算个人资产...',
    })
    wx.request({
      url: app.globalData.ROOTURL + '/game/room/end',
      data: {
        user_id: temp_user,
        room_num: temp_room,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        wx.hideLoading();
        if(res.statusCode === 200) {
          let temp = Utils.showResultImg(res.data.userRank, res.data.earnMoney);
          this.setData({
            step: 4,
            gameResult: temp,
            our:{
              rank: res.data.userRank,
              assets: res.data.asset,
              income: res.data.earnMoney,
              yield: res.data.earnRate
            }
          })
          this.JugeTheStatus(4);
          wx.setStorage({
            key: "step",
            data: 4
          });
        } else {
          wx.showToast({
            title: '本场比赛资产结算失败,2秒后跳回首页',
            icon: 'none'
          })
          setTimeout(() => {
            this.AgainGame();
          }, 2000)
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '本场比赛资产结算失败',
          icon: 'none'
        })
      }
    })
  },

  // 获取上次奖励的情况
  getLastReward: function () {
    let that = this;
    let temp_user = Utils.checkParams(that, app, 'user_id');
    let temp_room = Utils.checkParams(that, app, 'room_num');

    wx.request({
      url: app.globalData.ROOTURL + '/endInfo',
      data: {
        user_id: temp_user,
        room_num: temp_room,
        time: Utils.formatTime(new Date())
      },
      success: res => {
        if (res.statusCode === 200) {
          if(res.data.data !== '') {
            let temp = Utils.showResultImg(res.data.userRank, res.data.earnMoney);
            this.setData({
              gameResult: temp,
              our: {
                rank: res.data.userRank,
                assets: res.data.asset,
                income: res.data.earnMoney,
                yield: res.data.earnRate
              }
            })
          } else {
            wx.showToast({
              title: '获取结算资产信息失败,2秒后跳回首页',
              icon: 'none'
            })
            setTimeout(() => {
              this.AgainGame();
            }, 2000)
          }
        } else {
          wx.showToast({
            title: '获取结算资产信息失败', 
            icon: 'none'
          })
        }
      },
      fail: err => {
        wx.showToast({
          title: '获取结算资产信息失败',
          icon: 'none'
        })
      }
    })
  },

  // 比赛结束后，再来一局
  AgainGame: function () {
    this.setData({
      isEnterGame: false,
      isStartGame: false,
      step: 1
    })
    wx.setStorage({
      key: "step",
      data: 1
    })
    wx.setStorage({
      key: "isEnterGame",
      data: false
    })
    wx.setStorage({
      key: "isStartGame",
      data: false
    })
    wx.setStorage({
      key: "endTime",
      data: ''
    })
  },

  // 分享战绩弹出底部菜单
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
    wx.navigateTo({
      url: '/pages/priview/priview?rank='+this.data.our.rank+"&income="+this.data.our.income,
    })
  },
})




/*** 开赛前的倒计时 ***/
var count_second = 3,
urlList = [
  '../../image/waitgame/count_one.png',
  '../../image/waitgame/count_two.png', 
  '../../image/waitgame/count_three.png'
];

function count_down(that) {
  if (count_second <= 0) {
    that.setData({
      step: 3
    })
    wx.setStorage({
      key: "step",
      data: 3
    })
    that.JugeTheStatus(3);
    return;
  }

  that.setData({
    countURL: urlList[count_second-1],
  });

  setTimeout(function () {
    count_second -= 1;
    count_down(that);
  }, 1000)
}

var countUrlList = [
  '../../image/countdown/6.png', '../../image/countdown/5.png', '../../image/countdown/4.png',
  '../../image/countdown/3.png', '../../image/countdown/2.png', '../../image/countdown/1.png'
]
/*** 比赛结束的倒计时 ***/
function CountOneDay(that) {
  clearTimeout(timer);
  let countIndex = parseInt(total_second / (app.globalData.GAME_TIME * 60 * 10000));
  // 渲染倒计时时钟
  that.setData({
    clockURL: countUrlList[countIndex],
    clock: Utils.dateFormat(total_second)
  });

  if (total_second <= 0) {
    that.setData({
      clock: "00:00:00 0"
    });
    clearTimeout(coinTimer);
    clearTimeout(timer);
    that.GameOver();
    return;
  }

  timer = setTimeout(function () {
    total_second -= 100;
    CountOneDay(that);
  }, 100)
}