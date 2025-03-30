# ESP32配网助手项目学习指南

本文档旨在帮助程序员快速理解ESP32配网助手项目，即使你没有微信小程序开发经验。我们将从基础概念开始，逐步深入项目细节。

## 1. 微信小程序基础

### 1.1 什么是微信小程序？

微信小程序是一种无需下载安装即可使用的应用，用户可以通过微信扫一扫或搜索即可打开应用。小程序开发使用类似前端的技术栈（JavaScript、WXML、WXSS），但有其特定的框架和API。

### 1.2 小程序项目基本结构

一个典型的小程序项目包含以下文件类型：

- **app.js**: 小程序入口文件，包含全局配置和全局数据
- **app.json**: 全局配置文件，定义页面路径、窗口样式、权限等
- **app.wxss**: 全局样式文件，相当于CSS
- **pages/**: 存放所有页面的目录
  - 每个页面通常包含四个文件：
    - **.js**: 页面逻辑
    - **.wxml**: 页面结构，类似HTML
    - **.wxss**: 页面样式，类似CSS
    - **.json**: 页面配置

### 1.3 小程序特有概念

- **WXML**: 类似HTML，但有自己的标签和语法（如`<view>`代替`<div>`）
- **WXSS**: 类似CSS，但有特定的尺寸单位（如rpx）和选择器限制
- **Page对象**: 每个页面的JS文件导出一个Page对象
- **App对象**: app.js导出一个App对象，管理全局状态和生命周期
- **组件**: 小程序有自己的组件系统

## 2. 项目整体结构解析

### 2.1 项目文件结构

```
├── app.js                 # 小程序入口文件
├── app.json               # 小程序配置文件
├── app.wxss               # 小程序全局样式
├── assets/                # 静态资源
├── components/            # 公共组件（如需）
├── pages/                 # 页面文件
│   ├── index/             # 首页
│   ├── device-list/       # 设备列表页
│   └── wifi-config/       # WiFi配置页
├── services/              # 服务层
│   └── esp-service.js     # ESP设备通信服务
└── utils/                 # 工具函数
    ├── util.js            # 通用工具函数
    └── wifi.js            # WiFi相关工具函数
```

### 2.2 各目录说明

- **pages/**: 存放所有页面，每个页面有独立的目录
- **services/**: 服务层，处理与外部系统（如ESP32）的通信
- **utils/**: 工具函数，提供通用功能
- **assets/**: 存放图片等静态资源
- **components/**: 可复用组件（本项目中可能为空）

## 3. 项目核心流程分析

### 3.1 用户交互流程

1. 用户打开小程序，进入首页
2. 首页显示当前连接的WiFi信息，用户点击"扫描设备"
3. 进入设备列表页，显示附近的ESP32设备
4. 用户选择设备并连接
5. 进入WiFi配置页，发送WiFi信息给ESP32
6. ESP32接收配置并连接到指定WiFi

### 3.2 数据流分析

1. 首页获取当前WiFi信息 → 传递给WiFi配置页
2. 设备列表页扫描ESP设备 → 用户选择 → 连接ESP设备热点
3. WiFi配置页发送数据 → ESP32设备接收并保存

## 4. 代码详解

### 4.1 app.js 解析

```javascript
App({
  globalData: {
    userInfo: null,
    connectedDevice: null,
    wifiList: []
  },
  onLaunch() {
    console.log('App launched')
  }
})
```

- `App()`: 创建应用实例
- `globalData`: 全局数据，可在任何页面通过`getApp().globalData`访问
- `onLaunch()`: 应用启动时执行的生命周期函数

### 4.2 app.json 解析

```json
{
  "pages": [
    "pages/index/index",
    "pages/device-list/index",
    "pages/wifi-config/index"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff", 
    "navigationBarTitleText": "ESP32配网助手",
    "navigationBarTextStyle": "black"
  },
  "permission": {
    "scope.userLocation": {
      "desc": "获取位置信息用于搜索附近WiFi"
    }
  }
}
```

- `pages`: 定义小程序的所有页面路径，第一个是首页
- `window`: 定义窗口样式
- `permission`: 定义小程序需要的权限

### 4.3 页面代码解析

#### 4.3.1 页面结构（以index为例）

```
pages/index/
  ├── index.js   # 页面逻辑
  ├── index.wxml  # 页面结构（类似HTML）
  └── index.wxss  # 页面样式（类似CSS）
```

#### 4.3.2 页面JS文件解析

一个典型的页面JS文件：

```javascript
// 首页
const util = require('../../utils/util.js')
const wifiUtil = require('../../utils/wifi.js')

Page({
  // 页面数据，会自动映射到视图
  data: {
    deviceFound: false,
    searching: false,
    homeWifiInfo: null,
    canUseWifi: false,
    wifiErrorMsg: ''
  },

  // 页面加载时执行
  onLoad() {
    this.checkWifiPermission()
  },

  // 自定义函数
  async checkWifiPermission() {
    // 函数实现...
  },

  // 事件处理函数，如按钮点击
  gotoScanDevice() {
    wx.navigateTo({
      url: '/pages/device-list/index'
    })
  }
})
```

- `Page()`: 创建页面实例
- `data`: 页面的数据，会自动映射到视图
- `onLoad()`: 页面加载时执行的生命周期函数
- 自定义函数: 实现页面逻辑
- 事件处理函数: 响应用户交互

#### 4.3.3 WXML解析

WXML类似HTML，但使用特定标签：

```html
<view class="container">
  <view class="header">
    <image class="logo" src="/assets/logo.png" mode="aspectFit"></image>
    <view class="title">ESP32 配网助手</view>
  </view>

  <view wx:if="{{!canUseWifi}}" class="card">
    <!-- 内容 -->
  </view>

  <button class="btn btn-primary" bindtap="gotoScanDevice">扫描设备</button>
</view>
```

- `<view>`: 相当于HTML的`<div>`
- `wx:if`: 条件渲染
- `{{变量}}`: 数据绑定
- `bindtap`: 绑定点击事件

#### 4.3.4 WXSS解析

WXSS类似CSS：

```css
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 0;
}

.logo {
  width: 120rpx;
  height: 120rpx;
}
```

- rpx: 响应式单位，会根据屏幕宽度自动调整
- 支持Flex布局
- 选择器与CSS类似

### 4.4 工具函数解析

#### 4.4.1 utils/wifi.js

这个文件封装了与WiFi相关的操作：

```javascript
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
```

- `wx.getConnectedWifi()`: 微信小程序API，获取当前连接的WiFi
- 使用Promise封装API，便于异步调用

#### 4.4.2 services/esp-service.js

这个文件处理与ESP32设备的通信：

```javascript
// 发送WiFi配置给ESP设备
const sendWifiConfig = (ssid, password) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${ESP_SERVER_URL}/config`,
      method: 'POST',
      data: { ssid, password },
      success: (res) => {
        // 处理成功响应
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
```

- `wx.request()`: 微信小程序API，发送HTTP请求
- 向ESP32设备发送WiFi配置

## 5. 微信小程序API解析

### 5.1 网络API

- `wx.request()`: 发送网络请求
- `wx.connectSocket()`: WebSocket连接

### 5.2 导航API

- `wx.navigateTo()`: 导航到新页面
- `wx.redirectTo()`: 重定向到新页面
- `wx.navigateBack()`: 返回上一页

### 5.3 界面API

- `wx.showToast()`: 显示提示框
- `wx.showLoading()`: 显示加载提示
- `wx.showModal()`: 显示模态对话框

### 5.4 WiFi相关API

- `wx.startWifi()`: 初始化WiFi模块
- `wx.getConnectedWifi()`: 获取当前连接的WiFi信息
- `wx.getWifiList()`: 获取WiFi列表
- `wx.connectWifi()`: 连接WiFi

## 6. 如何阅读此项目

### 6.1 阅读顺序

1. 首先阅读`app.json`，了解页面配置和权限
2. 阅读`app.js`，了解全局数据
3. 顺着用户流程阅读各页面代码：
   - `pages/index/index.js`
   - `pages/device-list/index.js`
   - `pages/wifi-config/index.js`
4. 了解关键服务和工具：
   - `services/esp-service.js`
   - `utils/wifi.js`

### 6.2 关注点

1. **页面间数据传递**: 通过全局数据或页面参数
2. **与ESP32的通信**: 通过HTTP请求
3. **WiFi操作**: 使用微信提供的WiFi API
4. **用户界面**: WXML和WXSS

## 7. ESP32通信部分

ESP32作为硬件端，与小程序的通信是关键。

### 7.1 通信流程

1. 小程序扫描并连接ESP32的AP热点（SSID格式为"xiaozhi-xxxx"）
2. 连接成功后，小程序与ESP32建立HTTP通信
3. 小程序发送家庭WiFi信息到ESP32的`/config`接口
4. ESP32保存配置并尝试连接WiFi
5. 小程序查询ESP32状态

### 7.2 ESP32 HTTP接口

ESP32提供以下HTTP接口：

- `/ping`: 检查连接
- `/status`: 获取ESP32状态
- `/config`: 接收WiFi配置
- `/restart`: 重启ESP32

## 8. 实践操作

### 8.1 开发环境设置

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 在微信公众平台注册开发者账号并获取AppID
3. 导入项目到微信开发者工具

### 8.2 代码编辑

1. 使用微信开发者工具的编辑器
2. 修改文件后实时预览效果
3. 可以使用模拟器或真机调试

### 8.3 运行项目

1. 在微信开发者工具中点击"预览"
2. 使用手机微信扫描二维码
3. 在手机上体验小程序

### 8.4 调试技巧

1. 使用`console.log()`进行调试输出
2. 微信开发者工具提供调试器，可以查看网络请求、存储等
3. 真机调试模式可以在手机上看到控制台输出

## 9. 常见问题

### 9.1 小程序与Web开发的区别

1. 小程序使用WXML和WXSS，不是HTML和CSS
2. 小程序有自己的生命周期和组件
3. API限制，只能使用微信提供的API

### 9.2 WiFi API相关问题

1. WiFi API需要用户授权位置信息
2. 部分手机可能不支持某些WiFi操作
3. iOS和Android的WiFi API可能有差异

### 9.3 与ESP32通信问题

1. 确保ESP32 AP热点已开启
2. IP地址默认为192.168.4.1
3. 通信是基于HTTP协议

## 10. 代码修改指南

如果你想修改项目，以下是一些建议：

### 10.1 添加新页面

1. 在`pages`目录下创建新页面目录
2. 创建四个文件：index.js, index.wxml, index.wxss, index.json
3. 在app.json的`pages`数组中添加新页面路径

### 10.2 修改ESP32通信

1. 编辑`services/esp-service.js`
2. 添加或修改API接口函数
3. 确保ESP32端相应更新

### 10.3 改进用户界面

1. 修改`.wxml`和`.wxss`文件
2. 可以添加组件或改进布局
3. 注意微信小程序的UI设计规范

## 11. 总结

ESP32配网助手是一个典型的物联网应用，通过微信小程序实现设备配网。通过学习本项目，你可以了解：

1. 微信小程序的基本结构和开发方式
2. 如何在小程序中使用WiFi API
3. 小程序与硬件设备的通信方式
4. 一个完整应用的架构设计

希望本指南能帮助你快速理解项目，即使没有小程序开发经验也能上手！ 