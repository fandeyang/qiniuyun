
//没用的 之前一个项目片段大神绕过




// const Bmob = require("../../utils/bmob.js");
// const query = new Bmob.Query('adv')
const token = require('../utils/qiniu/qntoken.js')
const qiniuUploader = require("../utils/qiniu/qiniuUploader.js");
const qiniudelete = require('../utils/qiniu/qianniudelete.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    save:true,
    indicatorDots: true, //是否出现焦点
    autoplay: true, //是否自动播放轮播图
    interval: 4000, //时间间隔
    duration: 1000, //延时时间
    adv:'',
    copyindex:'',
    copyid:'',
    copyback:false,
    uptoken:'',
    imageupindex:0,
    tokendata:[],
    domain: '',//自己的域名空间
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
    this.chickavd()
  },
  chickavd() {
    let that = this
    let advarr = []
    query.find().then(result => {
      for (let object of result) {
        advarr.push({
          id: object.objectId,
          good_id: object.good_id,
          url: object.adv,
          is_show: object.is_show,
        })
      }
      that.setData({
        adv: advarr,
      })
      console.log(that.data.adv)
      wx.hideLoading()
    })
  },
//获取云端tokendata
  query_qiniudata(cb) {
    var that = this
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      // 查询当前用户所有的 counters
      db.collection('admi').get({
        success: res => {
          console.log(' 返回数据admi')
          if (res.data.length != 0) {
            var tokendata = {
              ak: res.data[0].qnak,
              sk: res.data[0].qnsk,
              bkt: res.data[0].qnbkt,
              cdn: res.data[0].qncdn,
            }
            console.log('[数据库] admi[查询记录] 成功:')
          } else {
            wx.showToast({
              icon: 'none',
              title: '需要管理员权限'
            })
            console.log(' 错误 ')
          }
          that.setData({
            tokendata: tokendata
          })
          resolve("ok")

        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '需要管理员权限'
          })
          console.error('[数据库] admi[查询记录] 失败：', err)
          that.setData({
            tokendata: []
          })
          resolve("ok")
        }
      })
    })
},
//生成token
  async gettoken() {
    var nowtime = Date.parse(new Date()) //当前时间截
    var mistime = nowtime - wx.getStorageSync('tokentime')
    console.log('mistime', mistime)
    if (mistime > 3500000){
     await this.query_qiniudata()
      var sendtokendata = this.data.tokendata
      var uptoken = token.token(sendtokendata)
      wx.setStorageSync('uptoken')
    }else{
      var uptoken = wx.getStorageSync('uptoken')
      console.log('本地储存的token')
    }
  return new Promise((resolve, reject) => {
    this.setData({
      uptoken: uptoken
    })
    resolve('ok')
    console.log('uptoken', uptoken)
    })
  },
 async upload(e) {
  await this.gettoken()
    //上传图片
    console.log(e)
    wx.showLoading({
      title: '上传中',
    })
    var that = this
    qiniuUploader.upload(
      e, //上传的图片
      (res) => {  //回调 success
        console.log(res, that.data.imageupindex);
        let url = 'http://' + res.imageURL;
        that.data.adv[that.data.imageupindex].url=url
        that.setData({
          adv: that.data.adv,
          save:false,
        })
      },
      (error) => { //回调 fail
        console.log('error: ' + error);
      },
      {
        // 参数设置  地区代码 token domain 和直传的链接 注意七牛四个不同地域的链接不一样，我使用的是华南地区
        region: 'SCN',
        // ECN, SCN, NCN, NA, ASG，分别对应七牛的：华东，华南，华北，北美，新加坡 5 个区域
        uptoken: that.data.uptoken,   //调接口
        uploadURL: 'https://upload-z2.qiniup.com',
        domain: that.data.domain,    //域名
      },
      (progress) => {
        if (progress.progress==100){
          wx.hideLoading()
        }
        console.log('上传进度', progress.progress)
        console.log('已经上传的数据长度', progress.totalBytesSent)
        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend)
      },
    )
  },
//更换图片
 async changeimage(e){
    let that=this
    var index = e.currentTarget.dataset.index;
    this.setData({
      imageupindex: parseInt(index) 
    })
   await this.query_qiniudata()
   var sendtokendata = this.data.tokendata
   sendtokendata.filename = that.data.adv[index].url;
   console.log('sendtokendata')
   qiniudelete.delet(sendtokendata)
    var tempimageurl=''
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (photo) {
        tempimageurl= photo.tempFilePaths[0];
        console.log(tempimageurl)
        that.upload(tempimageurl)
    }})
  },
  
  switchChange(e){
    var index = e.currentTarget.dataset.index;
    console.log('显示开关', e.detail.value,e)
    if (e.detail.value){
      this.data.adv[index].is_show=1
    }else{
      this.data.adv[index].is_show = 0
    }
    this.setData({
      adv: this.data.adv,
      save: false,
    })
    console.log(this.data.adv[index])
  },
  submit() {
    console.log(this.data.adv)
    wx.showLoading({
      title: '保存中',
    })
    let that=this
    var count=0
    for (var i=0; i<that.data.adv.length;i++) {
      query.set('id', that.data.adv[i].id) //需要修改的objectId
      query.set('is_show', that.data.adv[i].is_show)
      query.set('adv', that.data.adv[i].url)
      query.set('good_id', that.data.adv[i].good_id)
      query.save().then(res => {
        count=count+1
        if (count == that.data.adv.length){
          wx.hideLoading()
          that.data.save=true
        }
        console.log(res)
      }).catch(err => {
        console.log(err)
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log(this.data.copyindex, this.data.copyid)
if(this.data.copyback){
  this.data.adv[this.data.copyindex].good_id=this.data.copyid
  this.setData({
    adv:this.data.adv,
    copyback:false,
    save: false,
  })
  console.log(this.data.adv)
}
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (!this.data.save) { this.submit()}
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})