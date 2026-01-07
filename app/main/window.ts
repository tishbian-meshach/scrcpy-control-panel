import { BrowserWindow, screen } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let currentMode: 'normal' | 'hidden' | 'tray-only' = 'normal'

export function createWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        x: Math.floor((width - 1000) / 2),
        y: Math.floor((height - 700) / 2),
        frame: false,
        transparent: false,
        backgroundColor: '#0f0f0f',
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        icon: path.join(__dirname, '../../app/renderer/src/assets/scrcpy.png'),
        show: false
    })

    // Load the app
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    }

    mainWindow.once('ready-to-show', () => {
        if (currentMode !== 'hidden' && currentMode !== 'tray-only') {
            mainWindow?.show()
        }
    })

    mainWindow.on('close', (event) => {
        if (currentMode === 'tray-only') {
            event.preventDefault()
            hideWindow()
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
    return mainWindow
}

export function showWindow(): void {
    if (mainWindow) {
        mainWindow.show()
        mainWindow.setSkipTaskbar(false)
        mainWindow.focus()
    }
}

export function hideWindow(): void {
    if (mainWindow) {
        mainWindow.hide()
        mainWindow.setSkipTaskbar(true)
    }
}

export function setWindowMode(mode: 'normal' | 'hidden' | 'tray-only'): void {
    currentMode = mode

    switch (mode) {
        case 'normal':
            showWindow()
            break
        case 'hidden':
        case 'tray-only':
            hideWindow()
            break
    }
}

export function getWindowMode(): 'normal' | 'hidden' | 'tray-only' {
    return currentMode
}

export function toggleWindow(): void {
    if (mainWindow?.isVisible()) {
        hideWindow()
    } else {
        showWindow()
    }
}
