<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5d55c72a-ea82-4121-96c3-a89183dc453d" /># Scrcpy Control Center 📱

A modern, professional, and high-performance GUI wrapper for **scrcpy**. Effortlessly control and mirror your Android devices from Windows with a sleek dark-themed interface.



## ✨ Features

- **🚀 One-Click Session**: Start mirroring instantly with optimized settings for your specific device.
- **🎨 Premium Dark UI**: Clean, professional interface built with Inter typography and Heroicons.
- **⚡ Quick Presets**: Choose from Low Latency, Audio Only, Mirror Only, or Full Control modes.
- **🛠️ Advanced Video/Audio Control**:
    - Support for **H.264** and **H.265 (HEVC)** codecs.
    - Native resolution toggle or custom resolution limiting.
    - Adjustable video/audio bitrates and FPS limits.
- **⌨️ Universal HID Interaction**: Emulate physical keyboard and mouse (UHID/AOA) for seamless control.
- **📡 WiFi Connection**: Connect and manage devices wirelessly over your local network.
- **📟 System Tray Integration**: Run in the background; minimize to tray to keep your taskbar clean.
- **🧹 Self-Cleaning Device List**: Automatically detects and removes stale WiFi connections.

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

The output will be available in the `dist` folder.

## 💡 Usage Tips

- **HID Mode**: When using HID Interaction, press `ALT` to unlock your mouse from the device window.
- **Background Mode**: Click the system tray icon to hide the app from the taskbar while keeping scrcpy running.
- **Auto-Optimization**: Use the "Best Settings" button in Settings to automatically tune bitrates and codecs based on your device's hardware specs.

## 📄 License

This project is licensed under the MIT License.

---
*Created with ❤️ for the Android community.*
