var Utils = require('../../utils/util.js');
const app =getApp();

Page({
  data: {
    windowWidth: 634,
    windowHeight: 1064,
    qrPath: '../../image/qr.jpg',    
    userInfo: {   // 用户的个人基本信息
      avatarUrl: '../../image/logo.png',
      nickName: '用户名',
    },
    resultDetail: {
      rank: '2',
      income: '1234.56'
    },
    bgObj: {
      bg_url: '../../image/share/two_three.png',
      title: '为所欲为'
    }
  },

  onLoad: function (options) {

    // 获取设备的屏幕宽度
    wx.getSystemInfo({
      success: res => {
        this.setData({
          windowWidth: res.screenWidth,
          windowHeight: res.windowHeight
        })
      },
    });

    // 决定显示的背景图片
    let temp = {};
    if(!options.rank) {
      this.setData({
        bgObj: {
          bg_url: '../../image/share/no.png'
        }
      })
    } else {
      temp = judgeImg(options.rank, options.income);
      this.setData({
        bgObj: temp,
        resultDetail: {
          rank: options.rank,
          income: options.income
        }
      })
    }
  },

  onShow: function () {
    let startFlag = wx.getStorageSync('isStartGame');
    let enterFlag = wx.getStorageSync('isEnterGame');
    wx.showLoading({
      title: '正在生成图片...',
    })
    if (startFlag && enterFlag) {
      let userData = wx.getStorageSync('userInfo');
      // 下载用户头像
      if(userData) {
        wx.getImageInfo({
          src: userData.avatarUrl,
          success: response => {
            wx.setStorage({
              key: 'logoUrl',
              data: response.path,
            })
            wx.hideLoading();
            this.showImageOne();
            this.drawBtn();
          }
        })
      } else {
        wx.hideLoading();
        this.showImageOne();
        this.drawBtn();
      }
    } else {
      wx.hideLoading();
      this.showImageTwo();
      this.drawBtn();
    }
  },

  // 开赛后绘制分享图片
  showImageOne: function () {
    let that = this;
    const ctx = wx.createCanvasContext('myCanvas');
    let bgImgPath = this.data.bgObj.bg_url;
    let imgPath = wx.getStorageSync("logoUrl") || '../../image/logo.png';
    let userName = wx.getStorageSync("userInfo").nickName || '匿名';
    let qrPath = this.data.qrPath;
    
    // 绘制背景图
    ctx.setFillStyle('#0A102D');
    ctx.fillRect(0, 0, convert(674, that), convert(1104, that))
    ctx.drawImage(bgImgPath, convert(20,that), convert(20,that), convert(634,that), convert(1064,that));
    
    // 绘制头像
    ctx.save()
    ctx.beginPath()
    ctx.arc(convert(330,that), convert(340,that), convert(60,that), 0, 2 * Math.PI)
    ctx.setFillStyle('#222741')
    ctx.fill()
    ctx.clip()
    ctx.drawImage(imgPath, convert(270, that), convert(280, that), convert(120, that), convert(120, that))
    ctx.restore()

    // 绘制用户名
    ctx.setFontSize(15)
    ctx.fillStyle = '#fff';
    ctx.setTextAlign('center');
    ctx.fillText(userName, convert(330, that), convert(450, that), 300)


    ctx.setFontSize(12)
    ctx.fillStyle = '#fff';
    ctx.setTextAlign('center');
    ctx.fillText("本次炒币大赛中", convert(330, that), convert(510, that), 300)


    ctx.setFillStyle('#fff')
    ctx.setFontSize(12)
    ctx.fillText('我排名第', convert(306, that), convert(560, that))
    ctx.setFillStyle('#FBB10E')
    ctx.setFontSize(18)
    ctx.setTextAlign('left')
    ctx.fillText(this.data.resultDetail.rank, convert(370, that), convert(560, that))

    let len = this.data.resultDetail.income.length;
    let offset = 45;
    for(let i=0;i<len;i++) {
      offset -= 7
    }
    ctx.setFillStyle('#fff')
    ctx.setFontSize(12)
    ctx.fillText('共获得收益', convert(210 + offset, that), convert(620, that))
    ctx.setFillStyle('#FBB10E')
    ctx.setFontSize(18)
    ctx.setTextAlign('left')
    ctx.fillText(this.data.resultDetail.income, convert(345 + offset, that), convert(620, that))


    ctx.setFontSize(12)
    ctx.fillStyle = '#fff';
    ctx.setTextAlign('center');
    ctx.fillText("保持一年，我将：", convert(346, that), convert(670, that), 300)


    ctx.setFontSize(18)
    ctx.setFillStyle('#FBB10E')
    ctx.fillText(this.data.bgObj.title, convert(340, that), convert(730, that),300)


    ctx.drawImage(qrPath, convert(272, that), convert(820, that), convert(130, that), convert(148, that));
    ctx.setFontSize(12)
    ctx.fillStyle = '#fff';
    ctx.setTextAlign('center');
    ctx.fillText("长按识别小程序", convert(340, that), convert(1020, that), 300)
    ctx.fillText("看看我能排多少", convert(340, that), convert(1060, that), 300)
                                
    ctx.draw()
  },

  // 开赛前绘制分享图片
  showImageTwo: function () {
    let that = this;
    const ctx = wx.createCanvasContext('myCanvas');
    let bgImgPath = this.data.bgObj.bg_url;
    let qrPath = this.data.qrPath;

    // 绘制背景图
    ctx.setFillStyle('#0A102D');
    ctx.fillRect(0, 0, convert(674, that), convert(1104, that))
    ctx.drawImage(bgImgPath, convert(20, that), convert(20, that), convert(634, that), convert(1064, that));

    ctx.drawImage(qrPath, convert(272, that), convert(820, that), convert(130, that), convert(148, that));
    ctx.setFontSize(12)
    ctx.setFillStyle('#FFF')
    ctx.fillText("长按识别小程序", convert(256, that), convert(1020, that), 300)
    ctx.fillText("看看我能排多少", convert(256, that), convert(1060, that), 300)

    ctx.draw()
  },

  // 绘制保存按钮
  drawBtn: function () {
    let that = this;
    const ctx = wx.createCanvasContext('btnCanvas');

    // 绘制背景图
    ctx.setFillStyle('#008BBA');
    ctx.fillRect(0, 0, that.data.windowWidth, convert(100, that))
    
    ctx.setFontSize(15)
    ctx.fillStyle = '#fff';
    ctx.setTextAlign('center');
    ctx.fillText("保存到相册", convert(376, that), convert(60, that), 300)

    ctx.draw();
  },

  // 当用户点击分享到朋友圈时，将图片保存到相册
  SaveImg: function () {
    wx.canvasToTempFilePath({
      canvasId: 'myCanvas',
      success: res => {
        this.setData({
          shareImgSrc: res.tempFilePath
        },test)
      },
      fail: res => {
        console.error(res);
      }
    })

    let test = () => {
      wx.saveImageToPhotosAlbum({
        filePath: this.data.shareImgSrc,
        success(res) {
          wx.showModal({
            title: '存图成功',
            content: '图片成功保存到相册了，去发圈噻~',
            showCancel: false,
            confirmText: '好哒',
            confirmColor: '#72B9C3',
            success: (res) => {
              if (res.confirm) {
                console.log('用户点击确定');
              }
            }
          })
        }
      })
    }
   
  }
})

function convert (num,that) {
  return (that.data.windowWidth / 750) * num;
}

function judgeImg (rank,profit) {
  let temp = {};
  if (Number(rank) === 1) {
    temp = {
      bg_url: '../../image/share/one.png',
      title: '所向无敌'
    }
  } else if (Number(rank) <= 3) {
    temp = {
      bg_url: '../../image/share/two_three.png',
      title: '为所欲为'
    }
  } else if (Number(rank) < 15) {
    if (Number(profit) > 0) {
      temp = {
        bg_url: '../../image/share/high_rate.png',
        title: '与巴菲特谈笑风生'
      }
    } else {
      temp = {
        bg_url: '../../image/share/low_rate.png',
        title: '统领丐帮'
      }
    }
  } else {
    temp = {
      bg_url: '../../image/share/jump.png',
      title: '顶楼排队'
    }
  }
  return temp;
}
