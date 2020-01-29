const app = getApp()
const token = require('../utils/qiniu/qntoken.js')
const qiniuUploader = require("../utils/qiniu/qiniuUploader.js");
const qiniudelete = require('../utils/qiniu/qianniudelete.js')
Page({
  data: {
    url:'http://q3hsi9s02.bkt.clouddn.com/tmp/touristappid.o6zAJs9PGSG4t0J-RnpDxkuKxbWw.8xVI1cVSSOmD9a7323c4f2e3b204e02d6aede131281a.png',
    tokendata: [],//建议云函数获取处理、、测试时可直接写
    uptoken: '',//上传凭证
    time: Date.parse(new Date()) //时间截
  },
  onLoad: function () {
    //this.query_qiniudata()////获取云端tokendata
    
  },

//测试获取token按钮
  testgettoken(){
    var tokendata=[]
    tokendata.ak ='你的ak'
    tokendata.sk = '你的'
    tokendata.bkt = '你的空间名'
    tokendata.cdn = '你的测试cdn'
    this.data.tokendata = tokendata
    var uptoken = token.token(tokendata)  
this.setData({
  uptoken: uptoken
})
    console.log('uptoken', uptoken,this.data.tokendata)
  },

//测试删除按钮
dele(){
  var sendtokendata = this.data.tokendata //提前配置
  sendtokendata.filename = this.data.url;//删除用的
  console.log('sendtokendata')

  qiniudelete.delet(sendtokendata)//调用删除
  this.setData({
    url: this.data.url,
    time: Date.parse(new Date())
  })
},

//测试批量删除
batchdele(){
  var file_Name = ['http://s02.bkt.clouddn.com/tmp/wx9eakuKxbWw.85Ic4XUa06103e01320.jpg', 'http://02.bkt.clouddn.com/tmp/wx9ea6e64enpDxkuKxbWw.8BwWCdMtm6hj4d8d0e47ff1de050c814f7.jpg']//数据删除了写填你的

  this.data.tokendata.fileName = file_Name
  console.log('传输tokendata', this.data.tokendata)

  batchdelete.delet(this.data.tokendata)//调用批量删除
},















//上传图片
   upload(e) {
   // await this.gettoken()//获取token需要用到 不用await记得吧async取消
    
    console.log(e)//传入的地址
    wx.showLoading({
      title: '上传中',
    })
    var that = this
    qiniuUploader.upload(
      e, //上传的图片
      (res) => {  //回调 success
        let url = 'http://' + res.imageURL;
        that.setData({
          url: url,
        })
        console.log(res,url);
      },
      (error) => { //回调 fail
        console.log('error: ' + error);
      },
      {
        // 参数设置  地区代码 token domain 和直传的链接 注意七牛四个不同地域的链接不一样，我使用的是华南地区
        region: 'SCN',
        // ECN, SCN, NCN, NA, ASG，分别对应七牛的：华东，华南，华北，北美，新加坡 5 个区域
        uptoken: that.data.uptoken,   //上传凭证自己生成
        uploadURL: 'https://upload-z2.qiniup.com',//下面选你的区z2是华南的
        // case 'ECN': uploadURL = 'https://up.qiniup.com'; break;
        // case 'NCN': uploadURL = 'https://up-z1.qiniup.com'; break;
        // case 'SCN': uploadURL = 'https://up-z2.qiniup.com'; break;
        // case 'NA': uploadURL = 'https://up-na0.qiniup.com'; break;
        // case 'ASG': uploadURL = 'https://up-as0.qiniup.com'; break;
        domain: that.data.tokendata.cdn,    //cdn域名建议直接写出来不然容易出异步问题如domain:‘你的cdn’
      },
      (progress) => {
        if (progress.progress == 100) {
          wx.hideLoading()
        }
        console.log('上传进度', progress.progress)
        console.log('已经上传的数据长度', progress.totalBytesSent)
        console.log('预期需要上传的数据总长度', progress.totalBytesExpectedToSend)
      },
    )
  },



  //生成token
  async gettoken() {
    var nowtime = Date.parse(new Date()) //当前时间截
    var mistime = nowtime - wx.getStorageSync('tokentime')
    console.log('mistime', mistime)//一个小时时间问题
    if (mistime > 3500000) {
      await this.query_qiniudata() //云端获取云端数据库记得加_openid,权限仅创建者可读 、测试时把这个数据注释掉在data里面放入你的ak、sk、btk、cdn啥的
      var sendtokendata = this.data.tokendata
      var uptoken = token.token(sendtokendata)   //获取tonken核心代码这一句就够了
      wx.setStorageSync('uptoken')//存到本地建议云端
    } else {
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


  //获取云端tokendata
  query_qiniudata(cb) {
    var that = this
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      // 查询admi表
      db.collection('admi').get({
        success: res => {
          console.log(' 返回数据admi')
          if (res.data.length != 0) {
            var tokendata = {
              ak: res.data[0].qnak,      //你自己的云数据结构
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


  //更换图片
   changeimage(e) {
    let that = this
     if (this.data.uptoken==''){
      wx.showToast({
        title: '先获取token',
      })
      return
    }
    var sendtokendata = this.data.tokendata
    sendtokendata.filename = that.data.url;//删除用
    console.log('sendtokendata')

    qiniudelete.delet(sendtokendata)//调用删除

    var tempimageurl = ''
    wx.chooseImage({
      count: 1,//选一个图
      sizeType: ['original', 'compressed'],//原图压缩图
      sourceType: ['album', 'camera'],//相机相册
      success: function (photo) {
        tempimageurl = photo.tempFilePaths[0];
        console.log(tempimageurl)


        that.upload(tempimageurl)//调用上传


      }
    })
  },




  










})
