var Utils = require('../../../utils/util.js');

Number.prototype.toFloor = function (num) {
  return Math.floor(this * Math.pow(10, num)) / Math.pow(10, num);
};

Component({
  properties: {
    // 当前选择币种的信息
    coinItem: {
      type: Object
    },
    // 当前用户持有的币种
    AvailableMoney: {
      type: Object
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
    AvailableCoin: '', // 当前可用余额 
    TradeMoney: 0, // 交易金额
    isEnough: false, // 卖出金币是否够用
    isShowDialog: false, // 是否显示Dialog
    DialogUrl: '../../../image/tradegame/sale_dialog.png'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 初始化组件数据
    init(){
      if (this.data.coinItem === undefined || this.data.coinItem === null) {
        return;
      }
      
      let coinNum = this.data.AvailableMoney[this.data.coinItem.coin_type];
      if (coinNum === undefined || coinNum === null){ //  选择币种的时候，用户没有该币种
        this.setData({
          allStore: 1,
          halfStore: 3,
          isEnough: false,
          TradeMoney: 0,    // 交易金额
          sale_coin_amount: '',   // 买入数量
        })
        return ;
      } 

      let amount = 0, money = 0;
      if (this.data.allStore === 0) {
        amount = coinNum;
        money = coinNum * this.data.coinItem.coin_money;
      }
      if (this.data.halfStore === 2) {
        amount = coinNum * 0.5;
        money = coinNum * 0.5 * this.data.coinItem.coin_money;
      }
     
      this.setData({
        isEnough: true,       
        AvailableCoin: coinNum,
        TradeMoney: money.toFloor(2),    // 交易金额
        sale_coin_amount: Number(amount) === 0 ? '' : Number(amount).toFloor(2),   // 卖出数量
      })
    },

    updateMoney: function (data) {
      if (JSON.stringify(data) !== '{}') {   // 表示将所有的持仓都卖掉了
        this.setData({
          isEnough: true,
          AvailableCoin: data[this.data.coinItem.coin_type]
        })
      } else {
        this.setData({
          isEnough: false,
          AvailableCoin: ''
        })
      }
    },

    // 选择全仓或者半仓
    ChooseStore(e) {
      if(!this.data.isEnough) {
        return;
      }
      let storeName = e.target.id;
      if (storeName === 'all') {
        this.setData({
          allStore: 0,
          halfStore: 3,
          TradeMoney: (this.data.AvailableCoin * this.data.coinItem.coin_money).toFloor(2),
          sale_coin_amount: Number(this.data.AvailableCoin)
        })
      } else if (storeName === 'half') {
        this.setData({
          allStore: 1,
          halfStore: 2,
          TradeMoney: (this.data.AvailableCoin * 0.5 * this.data.coinItem.coin_money).toFloor(2),
          sale_coin_amount: (this.data.AvailableCoin * 0.5).toFloor(2)
        })
      }
    },

    // 改变输入框的买入数量
    ChangNumer(e) {
      let value = e.detail.value;

      if (isNaN(Number(value))) {
        wx.showToast({
          title: '输入的数量不合法',
          icon: 'none'
        })
        this.setData({
          TradeMoney: 0,
          sale_coin_amount: '',
        })
        return;
      }
      if (Number(value) === 0) {
        wx.showToast({
          title: '卖出数量不能为0',
          icon: 'none'
        })
        this.setData({
          TradeMoney: 0,
        })
        return;
      }

      let money = value * Number(this.data.coinItem.coin_money);

      if (money < 0.01) {
        wx.showToast({
          title: '卖出数量过小',
          icon: 'none'
        })
        this.setData({
          TradeMoney: 0,
          sale_coin_amount: ''
        })
        return;
      }

      if (Number(value) > Number(this.data.AvailableCoin)) {
        this.setData({
          isEnough: false,
          TradeMoney: 0,
          sale_coin_amount: ''
        })
      } else {
        this.setData({
          isEnough: true,
          allStore: 1,
          halfStore: 3,
          TradeMoney: money > 0 ? money.toFloor(2) : money,
          sale_coin_amount: value
        })
      }
    },

    // 模拟卖出
    ModifySale() {
      if (Number(this.data.sale_coin_amount) === 0) {
        wx.showToast({
          title: '输入不能为空',
          icon: 'none'
        })
        return;
      }

      let app = getApp();
      let params = {
        trade_type: 1,
        user_id: app.globalData.user_id,
        room_num: app.globalData.room_num,
        coin_money: this.data.coinItem.coin_money,
        coin_type: this.data.coinItem.coin_type,
        amount: this.data.sale_coin_amount,
        time: Utils.formatTime(new Date())
      }
      
      wx.request({
        url: getApp().globalData.ROOTURL + '/transaction',
        data: params,
        success: res => {
          if(res.statusCode === 200 && res.data.errno !== -1) {
            // 提示卖出成功
            this.setData({
              isShowDialog: true
            })
            let reback = {
              possess: res.data[0].possess,
              money: res.data[0].money,
              base_price: res.data[1] ? res.data[1].coin_cost : '--',
              coin_type: this.data.coinItem.coin_type,
              type: 'sale'
            }
            this.triggerEvent('SaleSuccess', reback);
            setTimeout(() => {
              this.setData({
                isShowDialog: false,
                allStore: 1,
                halfStore: 3,
                TradeMoney: 0,
                sale_coin_amount: ''
              })
            }, 1000)
          } else {
            wx.showToast({
              title: '卖出失败，请稍后重试',
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