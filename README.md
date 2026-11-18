Matrix Ecosystem v5.0
Matrix Ecosystem v5.0 is a tactical mobile command center built with Apache Cordova and
designed to interface with a local Linux/Termux backend (bridge_daemon.py). It consolidates
proximity RF/Wi-Fi scanning, mobile APK auditing, HID payload injection, RFID/NFC emulation,
neural BCI telemetry, and real-time shell execution into a unified, mobile-friendly interface.
Core Modules
The application features six interactive tactical views accessible from the top navigation bar:
1. RADAR (25m Proximity Scanner):
○ Visualizes nearby Wi-Fi/RF nodes and local network neighbors in real time using
RSSI path-loss distance estimation (0.5m to 25m).
○ Includes automatic local fallback telemetry if the Termux bridge is offline.
2. APK/MOD (Mobile Auditing):
○ Interfaces with apk_automator.sh to list installed third-party packages, locate
base.apk paths, and assist with manifest inspection and signing workflows.
3. HID/ESP32 (DuckyScript & Microcontrollers):
○ Provides a DuckyScript editor and queue manager for preparing USB-OTG
keyboard injection payloads and flashing compatible ESP32 hardware (e.g., LilyGo
T-Dongle-S3).
4. RFID/NFC (Chameleon Ultra Control):
○ Manages HF (13.56 MHz) and LF (125 kHz) proximity operations, UID emulation
slots, and Mifare Classic key recovery routines.
5. BCI/CORE (Neural Decoder Pipeline):
○ Monitors configuration parameters (model.yaml) and decoding latency for local
neural-to-text inference models.
6. BRIDGE (Termux IPC Bridge):
○ Direct bidirectional shell bridge communicating with 127.0.0.1:8080.
○ Includes a one-tap Quick Macros grid (GIT STATUS, GIT PUSH, SYS INFO, LIST
APKS, ADB DEVICES, DAEMON PID) alongside a custom command input.
Architecture & Repository Structure
NewEcosystem/
├── www/
│ ├── index.html # Main 6-tab tactical UI and live terminal log
│ ├── css/index.css # Dark matrix theme, radar animations, and grid layouts
│ └── js/index.js # Tab routing, polar radar renderer, and CORS HTTP IPC client
├── bridge_daemon.py # Python HTTP server (port 8080) with CORS & Termux:API
scanner
├── apk_automator.sh # Shell utility for enumerating and extracting installed APKs
├── config.xml # Cordova configuration & Android network security overrides
└── .github/workflows/ # CI/CD pipeline for automated debug APK builds Setup & Installation
1. Termux Backend Setup
Ensure you have Python, Git, and the Termux:API package installed in your Termux
environment (with Location permissions granted to the Termux:API Android app for live RF
scanning):
pkg update && pkg upgrade -y
pkg install python git termux-api -y
Clone the repository and make the automation script executable:
git clone https://github.com/efren1995/x5App.git ~/NewEcosystem
cd ~/NewEcosystem
chmod +x apk_automator.sh
2. Starting the IPC Bridge Daemon
Before launching the Android app, start the local Python server in the background and acquire a
wake-lock so Android does not suspend it:
termux-wake-lock
cd ~/NewEcosystem
python3 bridge_daemon.py &
You can verify that the daemon is listening locally via:
curl http://127.0.0.1:8080/scan
3. Installing the Android APK
1. Navigate to the Actions tab in your GitHub repository (efren1995/x5App).
2. Download the latest compiled app-debug.apk artifact from the workflow run.
3. Uninstall any previous version of the app on your device (to prevent signature conflicts)
and install the newly downloaded APK.
Usage Notes & Troubleshooting
● Cleartext Traffic: The project includes a custom network_security_config.xml explicitly
allowing unencrypted HTTP requests to 127.0.0.1 and localhost so the Android WebView
can communicate with bridge_daemon.py.
● Fallback Mode: If bridge_daemon.py is not running when you press SCAN LIVE or
execute a Bridge command, the app will gracefully fall back to simulated local telemetry
so the UI remains responsive.
● Restarting the Daemon: If you update bridge_daemon.py, restart the background
process using: pkill -f bridge_daemon.py
python3 ~/NewEcosystem/bridge_daemon.py &
