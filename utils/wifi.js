/**
 * WiFi工具函数
 */

// 获取当前连接的WiFi信息
const getCurrentWifi = () => {
  return new Promise((resolve, reject) => {
    wx.getConnectedWifi({
      success: (res) => {
        resolve(res.wifi)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 获取WiFi列表
const getWifiList = () => {
  return new Promise((resolve, reject) => {
    wx.startWifi({
      success: () => {
        wx.getWifiList({
          success: () => {
            wx.onGetWifiList((res) => {
              const wifiList = res.wifiList
                .filter(wifi => wifi.SSID) // 过滤掉没有SSID的WiFi
              resolve(wifiList)
            })
          },
          fail: (err) => {
            reject(err)
          }
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 连接到指定WiFi
const connectToWifi = (SSID, password = '', bssid = '') => {
  return new Promise((resolve, reject) => {
    wx.connectWifi({
      SSID,
      password,
      bssid,
      success: () => {
        resolve()
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 检测是否为ESP设备的AP热点（命名规则为xiaozhi-xxxx）
const isEspDeviceAP = (SSID) => {
  return SSID && SSID.startsWith('xiaozhi-')
}

// 获取所有ESP设备AP热点
const getEspDeviceList = async () => {
  try {
    const wifiList = await getWifiList()
    return wifiList.filter(wifi => isEspDeviceAP(wifi.SSID))
  } catch (error) {
    console.error('获取ESP设备列表失败:', error)
    return []
  }
}

module.exports = {
  getCurrentWifi,
  getWifiList,
  connectToWifi,
  isEspDeviceAP,
  getEspDeviceList
} 