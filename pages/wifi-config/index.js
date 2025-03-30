// WiFi配置页面
const util = require('../../utils/util.js')
const wifiUtil = require('../../utils/wifi.js')
const espService = require('../../services/esp-service.js')
const app = getApp()

Page({
  data: {
    ssid: '',
    password: '',
    isConnected: false,
    configuring: false,
    configResult: null,
    // 状态: 'searching', 'connecting', 'connected', 'failed', 'config_sent', 'config_success', 'config_failed'
    configStatus: 'searching',
    statusMsg: '正在搜索ESP32设备...',
    errorMsg: '',
    // 进度步骤状态: '', 'active', 'completed'
    stepStatus: ['active', '', '', '']
  },

  onLoad() {
    // 获取全局保存的家庭WiFi信息
    if (app.globalData.homeWifiInfo) {
      this.setData({
        ssid: app.globalData.homeWifiInfo.SSID
      })
    }
    
    // 开始搜索并连接ESP32设备
    this.searchAndConnectEspDevice()
  },

  // 搜索并连接ESP设备
  async searchAndConnectEspDevice() {
    this.setData({
      configStatus: 'searching',
      statusMsg: '正在搜索ESP32设备...',
      stepStatus: ['active', '', '', '']
    })

    try {
      // 获取ESP设备列表
      const espDevices = await wifiUtil.getEspDeviceList()
      
      if (!espDevices || espDevices.length === 0) {
        this.setData({
          configStatus: 'failed',
          statusMsg: '未找到ESP32设备',
          errorMsg: '请确保ESP32设备已开启并处于配网模式'
        })
        return
      }

      // 选择第一个设备
      const targetDevice = espDevices[0]
      
      this.setData({
        configStatus: 'connecting',
        statusMsg: `正在连接到设备 ${targetDevice.SSID}...`,
        stepStatus: ['completed', 'active', '', '']
      })
      
      // 连接到ESP设备的WiFi
      try {
        await wifiUtil.connectToWifi(targetDevice.SSID)
        
        // 保存设备信息到全局
        app.globalData.connectedDevice = targetDevice
        
        // 检查是否连接成功
        const isConnected = await espService.checkConnection()
        if (!isConnected) {
          throw new Error('连接设备失败，无法与ESP32通信')
        }
        
        this.setData({
          isConnected: true,
          configStatus: 'connected',
          statusMsg: '已连接到ESP32设备，请输入WiFi密码',
          stepStatus: ['completed', 'completed', '', '']
        })
      } catch (error) {
        console.error('连接ESP32失败:', error)
        this.setData({
          configStatus: 'failed',
          statusMsg: '连接设备失败',
          errorMsg: error.message || '请确保ESP32设备已开启',
          stepStatus: ['completed', '', '', '']
        })
      }
    } catch (error) {
      console.error('获取ESP设备列表失败:', error)
      this.setData({
        configStatus: 'failed',
        statusMsg: '搜索设备失败',
        errorMsg: '请检查WiFi权限是否正常开启',
        stepStatus: ['', '', '', '']
      })
    }
  },

  // 监听输入变化
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 发送WiFi配置到ESP32
  async sendConfig() {
    const { ssid, password } = this.data
    
    if (!ssid) {
      util.showToast('请输入WiFi名称')
      return
    }
    
    try {
      this.setData({
        configuring: true,
        configStatus: 'config_sent',
        statusMsg: '正在发送WiFi配置...',
        errorMsg: '',
        stepStatus: ['completed', 'completed', 'active', '']
      })
      
      // 发送WiFi配置到ESP设备
      const result = await espService.sendWifiConfig(ssid, password)
      
      this.setData({
        configuring: false,
        configResult: result,
        statusMsg: 'WiFi配置已发送，ESP32正在连接WiFi',
        stepStatus: ['completed', 'completed', 'active', '']
      })
      
      // 显示成功消息
      util.showToast('配置已发送', 'success')
      
      // 延迟后检查ESP状态
      setTimeout(() => {
        this.checkEspStatus()
      }, 5000)
    } catch (error) {
      console.error('发送配置失败:', error)
      
      this.setData({
        configuring: false,
        configStatus: 'config_failed',
        statusMsg: '发送配置失败',
        errorMsg: error.message || '请检查设备连接',
        stepStatus: ['completed', 'completed', '', '']
      })
      
      util.showToast('配置失败')
    }
  },

  // 检查ESP连接状态
  async checkEspStatus() {
    try {
      const status = await espService.getEspStatus()
      
      if (status && status.connected) {
        this.setData({
          configStatus: 'config_success',
          statusMsg: `ESP32已成功连接到WiFi: ${status.ssid}`,
          stepStatus: ['completed', 'completed', 'completed', 'completed']
        })
        
        // 显示成功消息
        util.showModal('配置成功', '设备已成功连接到WiFi，请重新连接到家庭WiFi继续使用', false)
      } else {
        this.setData({
          configStatus: 'config_failed',
          statusMsg: 'ESP32连接WiFi失败，请检查WiFi密码是否正确',
          stepStatus: ['completed', 'completed', '', '']
        })
      }
    } catch (error) {
      console.error('检查ESP状态失败:', error)
      this.setData({
        statusMsg: '无法获取ESP32状态，设备可能已重启'
      })
      
      // 再次尝试获取状态
      setTimeout(() => {
        this.checkEspStatus()
      }, 2000)
    }
  },

  // 重试搜索设备
  retrySearch() {
    this.searchAndConnectEspDevice()
  },

  // 返回首页
  goBack() {
    wx.navigateBack()
  }
}) 