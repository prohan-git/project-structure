// 首页
const util = require('../../utils/util.js')
const wifiUtil = require('../../utils/wifi.js')
const app = getApp()

Page({
  data: {
    homeWifiInfo: null,
    canUseWifi: false,
    wifiErrorMsg: ''
  },

  onLoad() {
    this.checkWifiPermission()
  },

  onShow() {
    // 每次页面显示都检查WiFi
    if (this.data.canUseWifi) {
      this.refreshWifi()
    }
  },

  // 检查WiFi权限
  async checkWifiPermission() {
    try {
      const res = await new Promise((resolve) => {
        wx.getSetting({
          success: resolve
        })
      })
      
      // 检查是否有WiFi权限
      if (!res.authSetting['scope.userLocation']) {
        const auth = await new Promise((resolve) => {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => resolve(true),
            fail: () => resolve(false)
          })
        })
        
        if (!auth) {
          this.setData({
            canUseWifi: false,
            wifiErrorMsg: '请授权获取位置信息以使用WiFi功能'
          })
          return
        }
      }
      
      await wx.startWifi()
      this.setData({ canUseWifi: true })
      
      // 获取当前连接的WiFi信息
      try {
        const wifiInfo = await wifiUtil.getCurrentWifi()
        this.setData({ homeWifiInfo: wifiInfo })
      } catch (error) {
        console.log('获取当前WiFi失败:', error)
      }
    } catch (error) {
      console.error('WiFi初始化失败:', error)
      this.setData({
        canUseWifi: false,
        wifiErrorMsg: '初始化WiFi模块失败，请确保设备支持WiFi功能'
      })
    }
  },

  // 前往配网准备页面
  gotoPreConfig() {
    if (!this.data.canUseWifi) {
      util.showToast('请先授权WiFi功能')
      return
    }
    
    wx.navigateTo({
      url: '/pages/pre-wifi-config/index'
    })
  },

  // 刷新WiFi信息
  async refreshWifi() {
    try {
      util.showLoading('刷新中')
      const wifiInfo = await wifiUtil.getCurrentWifi()
      this.setData({ homeWifiInfo: wifiInfo })
      util.showToast('刷新成功', 'success')
    } catch (error) {
      console.error('刷新WiFi失败:', error)
      util.showToast('刷新失败')
    } finally {
      util.hideLoading()
    }
  },

  // 打开设置页
  openSettings() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.checkWifiPermission()
        }
      }
    })
  }
}) 