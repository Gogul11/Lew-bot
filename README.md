# LEW - BLE Based User-Following Bot

LEW is a smart mobile robot that follows its assigned user using Bluetooth Low Energy signal strength. The project is split into three connected parts:

- `App/` - React Native mobile app built with Expo
- `backend/` - Node.js + Express + MongoDB backend
- `Embedded/Lew/` - ESP32 firmware for the bot

The bot is designed around an `ESP32`, `L298N motor driver`, and `two DC motors`. The app is used for user authentication, QR-based bot selection, booking, pairing, and control. The ESP32 receives access data over BLE, verifies it with the backend over Wi-Fi, and then drives the motors based on RSSI strength so the bot can follow the user.

## Project Flow

The intended product flow is:

1. User registers and logs in from the mobile app.
2. User scans the bot QR code.
3. Payment is supposed to happen here.
4. User books the bot and receives booking details from the backend.
5. The app pairs with the bot over BLE.
6. The app sends `device_id`, `user_id`, and `token` to the bot.
7. The bot calls the backend to verify those details.
8. After successful verification, the user can control the bot.
9. Bot speed is adjusted from BLE RSSI signal strength so the bot follows the user.

Note: payment is part of the intended flow but is not implemented in the current codebase.

## Architecture

### 1. Mobile App

The mobile app is inside `App/` and provides:

- User registration and login
- Local user session storage
- QR code scanning to identify a bot
- Bot booking and release flow
- BLE pairing with the ESP32 bot
- Sending verification payload to the bot
- Sending movement updates to the bot

Main mobile flow:

- `Register` -> create account
- `Login` -> store user details locally
- `Scan Bot QR` -> identify bot from QR data
- `Book Bot` -> request a bot token from backend
- `Pair Bot` -> connect to ESP32 over BLE
- `Verify Bot` -> send access payload over BLE
- `Release Bot` -> free the bot after use

Important mobile libraries used:

- `expo-camera` for QR scanning
- `expo-sensors` for accelerometer-based control
- `react-native-ble-plx` for BLE pairing and data transfer
- `axios` for backend API calls
- `@react-native-async-storage/async-storage` for local persistence

### 2. Backend

The backend is inside `backend/` and handles:

- User creation
- User login
- Bot registration
- Bot booking
- Bot release
- Bot verification

Available routes:

- `POST /user/create`
- `POST /user/login`
- `POST /bots/createBot`
- `POST /bots/bookBot`
- `POST /bots/releaseBot`
- `POST /bots/verifyBot`

Backend responsibilities:

- Store users in MongoDB
- Store bot records with `device_id`, `mac_address`, `token`, and `is_active`
- Assign an available bot to a user during booking
- Generate a secure token for bot access
- Verify bot access requests sent by the ESP32

### 3. Embedded Bot

The embedded firmware is inside `Embedded/Lew/` and runs on the ESP32.

Hardware used:

- ESP32 microcontroller
- L298N motor driver
- 2 DC motors
- BLE
- Wi-Fi

Firmware responsibilities:

- Start Wi-Fi connection
- Start BLE server advertising as `Lew-1`
- Receive verification payload from the app over BLE
- Forward verification request to backend over HTTP
- Enable bot motion only after backend verification succeeds
- Read BLE RSSI from the paired phone
- Map RSSI to motor speed
- Start or stop movement based on app control mode

BLE setup used in firmware:

- Service UUID: `1234`
- Verification characteristic: `abcd`
- Movement characteristic: `ef12`

## Control Modes

This project includes two separate implementations for bot movement control, each maintained in a different branch:

- `start-stop` branch
  Provides manual movement control from the app using `Start` and `Stop` buttons.

- `Accelometer-sensor` branch
  Provides motion-driven control using the phone accelerometer. The app continuously detects device movement and sends movement updates to the bot.

The current repository state should be checked against the branch you are using before demoing or deploying. If you want the manual mode, use `start-stop`. If you want sensor-based mode, use `Accelometer-sensor`.

## RSSI Based Following Logic

The following behavior is based on BLE RSSI:

- The ESP32 reads RSSI from the connected mobile device
- RSSI is mapped to motor PWM speed
- Stronger BLE signal means the user is nearer
- Weaker BLE signal means the user is farther away
- Speed is adjusted dynamically so the bot follows the user

In firmware, RSSI is mapped roughly from:

- `-90` to `-40` RSSI
- motor speed range `200` to `100`

This allows the bot to maintain distance from the user while moving.

## Folder Structure

```text
LEW/
├── App/            # Expo mobile application
├── backend/        # Express + MongoDB backend
├── Embedded/Lew/   # ESP32 PlatformIO project
└── README.md
```

## Setup

### Mobile App

```bash
cd App
npm install
npm start
```

Set the backend URL in `App/lib/api.ts`:

```ts
const API_BASE_URL = "<Backend-Url>";
```

### Backend

```bash
cd backend
npm install
npm start
```

Current backend setup:

- Runs with Express
- Connects to MongoDB at `mongodb://127.0.0.1:27017/lew`
- Listens on port `5000`

### Embedded Firmware

Open `Embedded/Lew/` in PlatformIO and configure:

- Wi-Fi SSID
- Wi-Fi password
- backend server IP in the verification request URL

Important values in firmware:

- `ssid = "Wifi-Name"`
- `password = "Password"`
- `http://<Your-IP>:5000/bots/verifyBot`

Then build and upload the firmware to the ESP32.

## Current Implemented Features

- User registration
- User login
- QR code scanning for bot identification
- Bot booking
- BLE pairing
- Sending bot access data from app to ESP32
- Backend verification of booking details
- Bot release flow
- RSSI based speed control
- Separate control mode branches for button control and accelerometer control

## Planned / Not Yet Implemented

- Payment integration after QR scan
- More production-ready bot assignment logic
- Better deployment configuration for backend URLs and secrets
- Polished media/demo assets in the repository

## Demo Media

### Mobile App Images

![Mobile Screen 1](/images/img1.png)
![Mobile Screen 2](/images/img2.png)
![Mobile Screen 3](/images/img3.png)

### Bot Images

![Bot Image 1](/images/bot1.png)
![Bot Image 2](/images/bot2.png)
![Bot Image 3](/images/bot3.png)

### Demo Video

[Watch Demo Video](/videos/demo.mp4)

## Example Verification Payload

The ESP32 expects data in this format:

```json
{
  "device_id": "Lew-e29b5802-f224-42f9-9a79-5a58c53747c4",
  "user_id": "69d399da00bf726264a7512a",
  "token": "12aa6df06d263b5b4a0019a8b1dc1f9f6494cc323db1ed08a5ff678e8307444b"
}
```

## Tech Stack

- React Native
- Expo
- TypeScript
- Express
- MongoDB
- Mongoose
- ESP32 Arduino Framework
- BLE
- Wi-Fi
- PlatformIO

## Summary

LEW is a full-stack BLE based smart follower bot project that combines mobile app control, backend verification, and embedded motor control. The app books and pairs the bot, the backend validates access, and the ESP32 uses RSSI to keep the bot following its assigned user.
