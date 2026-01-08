# Scrcpy Control Center 📱

A modern, professional, and high-performance GUI wrapper for **scrcpy**. Effortlessly control and mirror your Android devices from Windows with a sleek dark-themed interface.



<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5d55c72a-ea82-4121-96c3-a89183dc453d" />




## ✨ Features

### Core Features
- **🔌 Auto-Connect**: Automatically start scrcpy when you plug in your USB device - no manual clicks needed!
- **🚀 One-Click Session**: Start mirroring instantly with optimized settings for your specific device.
- **🎨 Premium Dark UI**: Clean, professional interface built with Inter typography and Heroicons.
- **⚡ Quick Presets**: Choose from Low Latency, Audio Only, Mirror Only, or Full Control modes.
- **📟 System Tray Integration**: Run in the background; minimize to tray to keep your taskbar clean.

### Advanced Controls
- **🛠️ Video/Audio Control**:
    - Support for **H.264** and **H.265 (HEVC)** codecs.
    - Native resolution toggle or custom resolution limiting (480p to 4K).
    - Adjustable video bitrate (1-64 Mbps) and FPS limits (30-120).
    - Audio codec selection (Opus, AAC, Raw).
    - Customizable audio bitrate (16-512 kbps).
- **⌨️ Universal HID Interaction**: Emulate physical keyboard and mouse (UHID/AOA) for seamless control.
- **🎯 Smart Auto-Optimization**: Automatically detect device specs and apply optimal settings.
- **📡 WiFi Connection**: Connect and manage devices wirelessly over your local network.
- **🧹 Self-Cleaning Device List**: Automatically detects and removes stale WiFi connections.

### Additional Options
- **Turn Screen Off**: Mirror with device screen off to save battery.
- **Keep Awake**: Prevent device from sleeping during sessions.
- **Always On Top**: Keep scrcpy window above all other windows.
- **Borderless/Fullscreen**: Customize window appearance.
- **No Control Mode**: Mirror-only mode without input forwarding.
- **Audio Only Mode**: Stream audio without video for music/calls.

## 🛠️ Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Design System)
- **Icons**: [React Icons / Heroicons](https://react-icons.github.io/react-icons/)
- **Core Engine**: [scrcpy](https://github.com/Genymobile/scrcpy)

## 📥 Installation

1.  **Prerequisites**:
    -   Ensure you have [Node.js](https://nodejs.org/) installed.
    -   Download the latest [scrcpy](https://github.com/Genymobile/scrcpy/releases) and remember the folder path.
2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/tishbian-meshach/scrcpy-control-panel.git
    cd scrcpy-control-panel
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Configure Scrcpy**:
    -   Launch the app.
    -   Go to **Settings** and select your `scrcpy` folder.

## 🚀 Development

Run the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

## 🏗️ Build

To generate a production-ready `.exe` installer:

```bash
npm run build
```

The output will be available in the `release` folder.

## 💡 Usage Tips

### Auto-Connect Setup
1. Navigate to **Settings** → **Auto-Connect**
2. Toggle **"Auto-Connect on USB Detection"** ON
3. (Optional) Configure your preferred scrcpy options and click **"Save Current Settings"**
4. Plug in your USB device - scrcpy will launch automatically! 🎉

### Other Tips
- **HID Mode**: When using HID Interaction, press `ALT` to unlock your mouse from the device window.
- **Background Mode**: Click the system tray icon to hide the app from the taskbar while keeping scrcpy running.
- **Auto-Optimization**: Use the "Apply Best Settings" button in Settings to automatically tune bitrates and codecs based on your device's hardware specs.
- **WiFi Connection**: Connect via USB first, then use the "Connect WiFi" button to switch to wireless mode.

## 🎯 Key Improvements in Latest Version

- ✨ **Auto-Connect Feature**: Instantly connect when USB device is plugged in
- 🔧 Device monitoring service with 2-second polling
- ⚙️ Configurable auto-connect settings in Settings page
- 🎛️ Save custom scrcpy options as auto-connect defaults
- 🛡️ Smart filtering (only authorized USB devices trigger auto-connect)

## 📄 License

This project is licensed under the MIT License.

---
*Created with ❤️ for the Android community.*
