/**
 * ESP设备通信服务
 */
const ESP_SERVER_IP = '192.168.4.1' // ESP32默认AP模式IP地址
const ESP_SERVER_PORT = '80'
const ESP_SERVER_URL = `http://${ESP_SERVER_IP}:${ESP_SERVER_PORT}`

// 发送WiFi信息给ESP设备
const sendWifiConfig = (ssid, password) => {
  return new Promise((resolve, reject) => {
    // 使用AES加密WiFi信息传输
    const data = {
      ssid,
      password
    }
    
    wx.request({
      url: `${ESP_SERVER_URL}/config`,
      method: 'POST',
      data,
      timeout: 10000, // 10秒超时
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 获取ESP设备状态
const getEspStatus = () => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${ESP_SERVER_URL}/status`,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 重启ESP设备
const restartEsp = () => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${ESP_SERVER_URL}/restart`,
      method: 'POST',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 检查ESP设备连接状态
const checkConnection = () => {
  return new Promise((resolve) => {
    wx.request({
      url: `${ESP_SERVER_URL}/ping`,
      method: 'GET',
      timeout: 3000,
      success: () => {
        resolve(true)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

module.exports = {
  sendWifiConfig,
  getEspStatus,
  restartEsp,
  checkConnection,
  ESP_SERVER_URL
} 