var Utils = require('../../../utils/util.js');

Number.prototype.toFloor = function (num) {
  return Math.floor(this * Math.pow(10, num)) / Math.pow(10, num);
};

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前选择币种的信息
    coinItem: {
      type: Object
    },
    // 当前可用余额
    AvailableMoney: {
      type: Number
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    allStore: 1,  // 半仓的图片样式
    halfStore: 3,  // 全仓的图片样式
    StoreImgList: ['../../../image/tradegame/all_store_active.png', 
    '../../../image/tradegame/all_store.png', 
    '../../../image/tradegame/half_store_active.png', 
    '../../../image/tradegame/half_store.png'],
    isEnough: true, //余额是否充足
    TradeMoney: 0,    // 交易金额
    buy_coin_amount: '',   // 买入数量
    isShowDialog: false,   // 是否显示Dialog
    DialogUrl: '../../../image/tradegame/buy_dialog.png'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 初始化组件数据
    init() {
      let amount = 0,money = 0;
      if (this.data.AvailableMoney < 0.01){
        this.setData({
          isEnough: false,
          TradeMoney: 0,
          buy_coin_amount: ''
        })
        return ;
      }
      
      if (this.data.coinItem && (this.data.AvailableMoney < this.data.coinItem.coin_money * 0.01)) {
        this.setData({
          isEnough: false,
          TradeMoney: 0,
          buy_coin_amount: ''
        })
        return;
      }
      if(this.data.allStore === 0){
        amount = this.data.AvailableMoney / this.data.coinItem.coin_money;
        money = (amount * this.data.coinItem.coin_money).toFloor(2);
      }
      if (this.data.halfStore === 2){
        amount = this.data.AvailableMoney * 0.5 / this.data.coinItem.coin_money;
        money = (amount * this.data.coinItem.coin_money).toFloor(2);
      }
      this.setData({
        isEnough: true,
        TradeMoney: money,    // 交易金额
        buy_coin_amount: amount === 0 ? '' : amount.toFloor(2),   // 买入数量
      })
    },

    updateMoney: function(data){
      if (this.data.coinItem && Number(data) < this.data.coinItem.coin_money * 0.01){
        this.setData({
          isEnough: false,
          TradeMoney: 0,
          buy_coin_amount: ''
        })
      } else {
        this.setData({
          isEnough: true,
          AvailableMoney: Number(data)
        })
      }
    },

    // 选择全仓或者半仓
    ChooseStore(e) {
      if(!this.data.isEnough) {
        return ;
      }

      let storeName = e.target.id;
      if (storeName === 'all') {
        let all_amount = (this.data.AvailableMoney / this.data.coinItem.coin_money).toFloor(2);
        this.setData({
          allStore:0,
          halfStore: 3,
          TradeMoney: (all_amount * this.data.coinItem.coin_money).toFloor(2),
          buy_coin_amount: all_amount
        })
      } else if (storeName === 'half') {
        let half_amount = (this.data.AvailableMoney * 0.5 / this.data.coinItem.coin_money).toFloor(2);
        this.setData({
          allStore: 1,
          halfStore: 2,
          TradeMoney: (half_amount * this.data.coinItem.coin_money).toFloor(2),
          buy_coin_amount: half_amount
        })
      }
    },

    // 改变输入框的买入数量
    ChangNumer(e){
      let value = e.detail.value;

      if (isNaN(Number(value))) {
        wx.showToast({
          title: '输入的数量不合法',
          icon: 'none'
        })
        this.setData({
          TradeMoney: 0,
          buy_coin_amount: ''
        })
        return;
      }
      if (Number(value) === 0) {
        wx.showToast({
          title: '买入数量不能为0',
          icon: 'none'
        })
        this.setData({
          TradeMoney: 0,
        })
        return;
      }

      let money = value * Number(this.data.coinItem.coin_money);
      
      if(money < 0.01) {
        wx.showToast({
          title: '买入数量过小',
          icon: 'none'
        })
        this.setData({
          TradeMoney: 0,
          buy_coin_amount: ''
        })
        return;
      }

      if (money > Number(this.data.AvailableMoney)) {
        this.setData({
          isEnough: false,
          TradeMoney: 0,
          buy_coin_amount: ''
        })
      } else {
        this.setData({
          isEnough: true,
          allStore: 1,
          halfStore: 3,
          TradeMoney: money > 0 ? money.toFloor(2) : money,
          buy_coin_amount: value
        })
      }
    },
      
    // 模拟买入
    ModifyBuy(){
      if (Number(this.data.buy_coin_amount) === 0){
        wx.showToast({
          title: '输入不能为空',
          icon: 'none'
        })
        return ;
      }
      let app = getApp();
      let params = {
        trade_type: 0,
        user_id: app.globalData.user_id,
        room_num: app.globalData.room_num,
        coin_money: this.data.coinItem.coin_money,
        coin_type: this.data.coinItem.coin_type,
        amount: this.data.buy_coin_amount,
        time: Utils.formatTime(new Date())
      }

      wx.request({
        url: getApp().globalData.ROOTURL + '/transaction',
        data: params,
        success: res => {
          if (res.statusCode === 200 && res.data.errno !== -1) {
            // 提示买入成功
            this.setData({
              isShowDialog: true
            })

            let reback = {
              possess: res.data[0].possess,
              money: res.data[0].money,
              base_price: res.data[1] ? res.data[1].coin_cost : '--',
              coin_type: this.data.coinItem.coin_type,
              type: 'buy'
            }
            this.triggerEvent('BuySuccess', reback);
            setTimeout(() => {
              this.setData({
                isShowDialog: false,
                allStore: 1,
                halfStore: 3,
                TradeMoney: 0,
                buy_coin_amount: ''
              })
            }, 1000)

          } else {
            wx.showToast({
              title: '买入失败，请稍后重试',
              icon: 'none',
              duration: 1500
            })
          }
        },
        fail: err => {
          console.error('服务器内部错误')
        }
      })
    },

    // 余额不足时可以邀请好友
    ToDetailShare() {
      wx.navigateTo({
        url: '/pages/share/share',
      });
    }, 
  }
})