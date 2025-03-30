# ESP32 Arduino程序

本文档提供ESP32设备端的Arduino程序完整代码，用于配合微信小程序实现AP配网功能。

## 依赖库

- WiFi.h（ESP32 Arduino核心库）
- WebServer.h（ESP32 Arduino核心库）
- ArduinoJson.h（需要安装，版本6.x）
- EEPROM.h（ESP32 Arduino核心库）

## 完整代码

```cpp
/**
 * ESP32 AP配网示例
 * 作为小程序ESP32配网助手的设备端程序
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// 定义常量
#define EEPROM_SIZE 512
#define SSID_ADDR 0
#define PASS_ADDR 32
#define SSID_MAX_LEN 32
#define PASS_MAX_LEN 64
#define LED_PIN 2  // 内置LED，用于状态指示

// AP热点配置 - 修改为你想要的名称
const char* AP_SSID = "xiaozhi-1234";  // 格式必须为xiaozhi-xxxx
const char* AP_PASS = "";  // 空密码，方便连接，实际应用中应设置密码

// 设置AP的IP
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// 创建WebServer实例
WebServer server(80);

// 存储WiFi信息的结构
struct {
  char ssid[SSID_MAX_LEN] = {0};
  char password[PASS_MAX_LEN] = {0};
  bool configured = false;
} wifiConfig;

// LED状态码
// - 快闪：ESP32处于AP模式，等待配网
// - 慢闪：尝试连接WiFi
// - 常亮：WiFi连接成功
// - 常灭：WiFi连接失败

void setup() {
  // 初始化串口
  Serial.begin(115200);
  Serial.println("\n\n");
  Serial.println("ESP32 AP配网程序启动");
  
  // 设置LED引脚为输出
  pinMode(LED_PIN, OUTPUT);
  
  // 初始化EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // 尝试从EEPROM读取保存的WiFi信息
  readWiFiConfig();
  
  // 如果有保存的WiFi配置，尝试连接
  if (wifiConfig.configured) {
    if (connectToWiFi()) {
      // 连接成功，LED常亮
      digitalWrite(LED_PIN, HIGH);
    } else {
      // 连接失败，LED常灭
      digitalWrite(LED_PIN, LOW);
    }
  }
  
  // 无论是否连接成功，都启动AP模式
  setupAP();
  
  // 设置Web服务
  setupWebServer();
  
  Serial.println("ESP32启动完成");
}

void loop() {
  // 处理HTTP请求
  server.handleClient();
  
  // 如果处于AP模式且未连接WiFi，LED快闪
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 300) {
      lastBlink = millis();
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  }
}

// 从EEPROM读取WiFi配置
void readWiFiConfig() {
  Serial.println("读取保存的WiFi配置...");
  
  // 读取SSID
  for (int i = 0; i < SSID_MAX_LEN; i++) {
    wifiConfig.ssid[i] = EEPROM.read(SSID_ADDR + i);
  }
  wifiConfig.ssid[SSID_MAX_LEN - 1] = '\0';
  
  // 读取密码
  for (int i = 0; i < PASS_MAX_LEN; i++) {
    wifiConfig.password[i] = EEPROM.read(PASS_ADDR + i);
  }
  wifiConfig.password[PASS_MAX_LEN - 1] = '\0';
  
  // 检查是否有有效的SSID
  wifiConfig.configured = (wifiConfig.ssid[0] != 0 && wifiConfig.ssid[0] != 255);
  
  if (wifiConfig.configured) {
    Serial.println("从EEPROM读取的WiFi配置：");
    Serial.print("SSID: ");
    Serial.println(wifiConfig.ssid);
    Serial.print("PASSWORD: ");
    Serial.println("********");
  } else {
    Serial.println("EEPROM中没有有效的WiFi配置");
  }
}

// 保存WiFi配置到EEPROM
void saveWiFiConfig() {
  Serial.println("保存WiFi配置到EEPROM...");
  
  // 保存SSID
  for (int i = 0; i < SSID_MAX_LEN; i++) {
    EEPROM.write(SSID_ADDR + i, wifiConfig.ssid[i]);
  }
  
  // 保存密码
  for (int i = 0; i < PASS_MAX_LEN; i++) {
    EEPROM.write(PASS_ADDR + i, wifiConfig.password[i]);
  }
  
  EEPROM.commit();
  Serial.println("WiFi配置已保存到EEPROM");
}

// 连接WiFi
bool connectToWiFi() {
  Serial.println("尝试连接WiFi...");
  Serial.print("SSID: ");
  Serial.println(wifiConfig.ssid);
  
  // 断开可能存在的连接
  WiFi.disconnect();
  
  // 配置为STA模式
  WiFi.mode(WIFI_AP_STA);
  
  // 开始连接
  WiFi.begin(wifiConfig.ssid, wifiConfig.password);
  
  // LED慢闪表示正在连接
  for (int i = 0; i < 20; i++) { // 10秒超时 (20 * 500ms)
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(500);
    Serial.print(".");
    if (WiFi.status() == WL_CONNECTED) {
      break;
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi连接成功");
    Serial.print("IP地址: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("");
    Serial.println("WiFi连接失败");
    return false;
  }
}

// 设置AP模式
void setupAP() {
  Serial.println("启动AP模式...");
  
  WiFi.softAPConfig(local_IP, gateway, subnet);
  WiFi.softAP(AP_SSID, AP_PASS);
  
  Serial.println("AP模式已启动");
  Serial.print("AP SSID: ");
  Serial.println(AP_SSID);
  Serial.print("AP IP地址: ");
  Serial.println(local_IP);
}

// 设置Web服务器
void setupWebServer() {
  Serial.println("设置Web服务器...");
  
  // Ping接口 - 用于检查连接
  server.on("/ping", HTTP_GET, []() {
    server.send(200, "text/plain", "pong");
  });
  
  // 状态接口 - 返回当前状态
  server.on("/status", HTTP_GET, []() {
    DynamicJsonDocument doc(256);
    doc["connected"] = (WiFi.status() == WL_CONNECTED);
    doc["ssid"] = WiFi.SSID();
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["mac"] = WiFi.macAddress();
    doc["ap_ssid"] = AP_SSID;
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  
  // 配置接口 - 接收WiFi配置
  server.on("/config", HTTP_POST, []() {
    String json = server.arg("plain");
    Serial.println("收到配置请求：");
    Serial.println(json);
    
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, json);
    
    if (error) {
      Serial.print("JSON解析失败: ");
      Serial.println(error.c_str());
      server.send(400, "application/json", "{\"success\":false,\"message\":\"解析JSON失败\"}");
      return;
    }
    
    // 获取SSID和密码
    const char* ssid = doc["ssid"];
    const char* password = doc["password"];
    
    if (!ssid || strlen(ssid) == 0) {
      server.send(400, "application/json", "{\"success\":false,\"message\":\"SSID不能为空\"}");
      return;
    }
    
    // 更新WiFi配置
    memset(wifiConfig.ssid, 0, SSID_MAX_LEN);
    memset(wifiConfig.password, 0, PASS_MAX_LEN);
    
    strncpy(wifiConfig.ssid, ssid, SSID_MAX_LEN - 1);
    if (password) {
      strncpy(wifiConfig.password, password, PASS_MAX_LEN - 1);
    }
    wifiConfig.configured = true;
    
    // 保存配置
    saveWiFiConfig();
    
    // 响应
    server.send(200, "application/json", "{\"success\":true,\"message\":\"WiFi配置已保存，设备将尝试连接\"}");
    
    // 尝试连接WiFi (在发送响应后)
    if (connectToWiFi()) {
      digitalWrite(LED_PIN, HIGH);  // 连接成功，LED常亮
    } else {
      digitalWrite(LED_PIN, LOW);   // 连接失败，LED常灭
    }
  });
  
  // 重启接口
  server.on("/restart", HTTP_POST, []() {
    server.send(200, "application/json", "{\"success\":true,\"message\":\"设备将在1秒后重启\"}");
    delay(1000);
    ESP.restart();
  });
  
  // 清除配置接口
  server.on("/clear", HTTP_POST, []() {
    memset(wifiConfig.ssid, 0, SSID_MAX_LEN);
    memset(wifiConfig.password, 0, PASS_MAX_LEN);
    wifiConfig.configured = false;
    saveWiFiConfig();
    server.send(200, "application/json", "{\"success\":true,\"message\":\"WiFi配置已清除\"}");
  });
  
  // 404处理
  server.onNotFound([]() {
    server.send(404, "text/plain", "Not Found");
  });
  
  // 启动服务器
  server.begin();
  Serial.println("HTTP服务器已启动");
}
```

## 使用说明

1. 将代码上传到ESP32开发板
2. ESP32启动后，如果EEPROM中有保存的WiFi配置，会尝试连接
3. 无论连接是否成功，ESP32都会启动AP热点（SSID格式为xiaozhi-xxxx）
4. 使用微信小程序连接到ESP32热点，发送家庭WiFi信息

## LED状态指示

- 快闪：ESP32处于AP模式，等待配网
- 慢闪：正在尝试连接WiFi
- 常亮：WiFi连接成功
- 常灭：WiFi连接失败

## 安全建议

1. 在实际使用中，建议为AP热点设置密码
2. 考虑对WiFi密码进行加密后再传输
3. 可以添加认证机制，防止未授权访问ESP32的API
4. 将保存在EEPROM中的WiFi信息进行加密 