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

const char* ssid = "Coconut Biscuit"; 
const char* password = "headphones"; 

esp_bd_addr_t remoteDeviceAddress; 

String receivedData = ""; 
bool dataReceived = false; 
bool isDeviceVerified = false; 

int pins_op[6] = {13, 14, 15, 16, 17, 18}; 

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
        BLEDevice::startAdvertising(); 
        digitalWrite(pins_op[4], HIGH); 
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

void gapCallback(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) { 
    if (event == ESP_GAP_BLE_READ_RSSI_COMPLETE_EVT) { 
        Serial.print("RSSI: "); 
        Serial.println(param->read_rssi_cmpl.rssi); 
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

    pService->start(); 
    BLEDevice::startAdvertising(); 

    Serial.println("BLE Ready. Waiting for data..."); 
    digitalWrite(pins_op[1], HIGH); 
} 

void sendToServer(String jsonData) { 
    if (WiFi.status() == WL_CONNECTED) { 
        HTTPClient http; 

        http.begin("http://10.16.32.194:5000/bots/verifyBot"); 
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
                digitalWrite(pins_op[3], LOW); 
            } else { 
                digitalWrite(pins_op[3], HIGH); 
                digitalWrite(pins_op[2], LOW); 
            } 
        } else { 
            Serial.print("HTTP Error: "); 
            Serial.println(httpResponseCode); 
            digitalWrite(pins_op[3], HIGH); 
            digitalWrite(pins_op[2], LOW); 
        } 

        http.end(); 
    } 
} 

// Wifi, BLE Server started, Verified, Verification Error, Disconnected, Ready to pair

void setup() { 
    Serial.begin(115200); 

    for (int i = 0; i < 6; i++) { 
        pinMode(pins_op[i], OUTPUT); 
    } 

    esp_bt_controller_mem_release(ESP_BT_MODE_CLASSIC_BT); 

    setupWiFi(); 
    setupBLE(); 
} 

void loop() { 
    if (dataReceived) { 
        Serial.println("Sending data to server..."); 
        sendToServer(receivedData); 
        dataReceived = false; 
    } 

    if (isDeviceVerified) { 
        esp_ble_gap_read_rssi(remoteDeviceAddress); 
    } 

    delay(1000); 
}