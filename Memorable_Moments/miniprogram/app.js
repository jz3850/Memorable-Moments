App({
  globalData: {
    openid: ''
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上基础库')
      return
    }

    wx.cloud.init({
      env: 'cloud1-d6gxqaextf1756819',
      traceUser: true
    })
    wx.cloud.callFunction({
      name: 'login',
      config: {
        env: 'cloud1-d6gxqaextf1756819'
      },
      success: res => {
        this.globalData.openid = res.result.openid
        wx.setStorageSync('openid', res.result.openid)
        console.log('openid 获取成功', res.result.openid)
      },
      fail: err => {
        console.error('获取 openid 失败', err)
      }
    })
  }
})