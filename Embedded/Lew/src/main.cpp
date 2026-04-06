#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include "esp_gap_ble_api.h"
#include "esp_bt.h"

BLEServer* pServer;
bool deviceConnected = false;

const char* ssid = "Internet";
const char* password = "qwerty1234";

esp_bd_addr_t remoteDeviceAddress;

String receivedData = "";
bool dataReceived = false;
bool isDeviceVerified = false;
bool isMoving = false;

int pins_op[6] = {27, 26, 25, 33, 32, 35};
int motor_pins[4] = {19, 21, 22, 23};
int en_pins[2] = {2, 4};

const int pwmChannel1 = 0;
const int pwmChannel2 = 1;
const int freq = 5000;
const int resolution = 8;

class ServerConnectionCallbacks : public BLEServerCallbacks {

  void onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t *param) {
    deviceConnected = true;

    memcpy(remoteDeviceAddress, param->connect.remote_bda, 6);
    Serial.println("Device connected via BLE");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    isDeviceVerified = false;

    Serial.println("Device disconnected");
    Serial.println("To Access the Lew Send retrying the Codes");
    isMoving = false;
    BLEDevice::startAdvertising();
    // digitalWrite(pins_op[4], HIGH);
  }
};

class ServerWriteCallbacks : public BLECharacteristicCallbacks {

  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();

    if (value.length() > 0) {
      receivedData = String(value.c_str());
      dataReceived = true;

      Serial.print("Received via BLE: ");
      Serial.println(receivedData);
    }
  }

};

class movingUserCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();

    if (value.length() > 0) {

      String data = String(value.c_str());

      Serial.print("Movement Command: ");
      Serial.println(data);

      if (data == "0") {
        isMoving = false;
      } 
      else{
        isMoving = true;
      }
    }
  }

  void onDisconnect(BLEServer* pServer){
    isMoving = false;
  }
};

void gapCallback(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {

  if (event == ESP_GAP_BLE_READ_RSSI_COMPLETE_EVT) {
    Serial.print("RSSI: ");
    Serial.println(param->read_rssi_cmpl.rssi);

    int rssi = param->read_rssi_cmpl.rssi;

    int speed = map(rssi, -90, -40, 200, 100);
    speed = constrain(speed, 0, 255);

    Serial.print("Speed: ");
    Serial.println(speed);

    // Apply speed
    if (isMoving) {
      ledcWrite(pwmChannel1, speed);
      ledcWrite(pwmChannel2, speed);
    } else {
      ledcWrite(pwmChannel1, 0);
      ledcWrite(pwmChannel2, 0);
    }
  }
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.printf("%s Wifi - Connecting..\n", ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  digitalWrite(pins_op[0], HIGH);
}

void setupBLE() {
  BLEDevice::init("Lew-1");
  BLEDevice::setCustomGapHandler(gapCallback);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerConnectionCallbacks());

  BLEService *pService = pServer->createService("1234");

  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
    "abcd",
    BLECharacteristic::PROPERTY_WRITE
  );
  
  pCharacteristic->setCallbacks(new ServerWriteCallbacks());
  
  BLECharacteristic *pCharacteristic2 = pService->createCharacteristic(
    "ef12",
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic2->setCallbacks(new movingUserCallbacks());
  
  pService->start();
  BLEDevice::startAdvertising();

  Serial.println("BLE Ready. Waiting for data...");
  digitalWrite(pins_op[1], HIGH);
}

void sendToServer(String jsonData) {

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin("http://10.16.34.176:5000/bots/verifyBot");
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonData);

    Serial.print("Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode > 0) {
      String payload = http.getString();

      Serial.println("Response:");
      Serial.println(payload);

      if (payload == "1") {
        isDeviceVerified = true;
        digitalWrite(pins_op[2], HIGH);
        // digitalWrite(pins_op[3], LOW);
      } else {
        digitalWrite(pins_op[3], HIGH);
        // digitalWrite(pins_op[2], LOW);
      }

    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);

      digitalWrite(pins_op[3], HIGH);
      // digitalWrite(pins_op[2], LOW);
    }

    http.end();
  }
}

// Wifi, BLE Server started, Verified, Verification Error, Disconnected, Ready to pair

void setup() {
  Serial.begin(115200);

  esp_bt_controller_mem_release(ESP_BT_MODE_CLASSIC_BT);

  for (int i = 0; i < 4; i++) {
    pinMode(motor_pins[i], OUTPUT);
  }

  for (int i = 0; i < 6; i++) {
    pinMode(pins_op[i], OUTPUT);
  }

    // Motor A
  digitalWrite(motor_pins[0], HIGH);
  digitalWrite(motor_pins[1], LOW);

  // Motor B
  digitalWrite(motor_pins[2], HIGH);
  digitalWrite(motor_pins[3], LOW);

  ledcSetup(pwmChannel1, freq, resolution);
  ledcSetup(pwmChannel2, freq, resolution);

  ledcAttachPin(en_pins[0], pwmChannel1);
  ledcAttachPin(en_pins[1], pwmChannel2);

  pinMode(13, OUTPUT);

  setupWiFi();
  setupBLE();
  digitalWrite(pins_op[4], HIGH);
}

void loop() {

  digitalWrite(13, HIGH);

  if (dataReceived) {
    Serial.println("Sending data to server...");
    sendToServer(receivedData);

    dataReceived = false;
  }

  if (isDeviceVerified) {
    delay(200);
    esp_ble_gap_read_rssi(remoteDeviceAddress);
  }

  delay(1000);
  digitalWrite(13, HIGH);
  delay(500);
}

// {"device_id":"Lew-e29b5802-f224-42f9-9a79-5a58c53747c4","user_id":"69d399da00bf726264a7512a","token":"12aa6df06d263b5b4a0019a8b1dc1f9f6494cc323db1ed08a5ff678e8307444b"}