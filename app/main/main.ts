import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { createTray, destroyTray } from './tray'
import { createWindow, getMainWindow, showWindow, hideWindow, setWindowMode } from './window'
import { getDevices, connectWifi, disconnectDevice, getDeviceSpecs, suggestQualitySettings, Device, DeviceSpecs, SuggestedSettings } from './adb'
import { startScrcpy, stopScrcpy, getScrcpyStatus, ScrcpyOptions } from './scrcpy'
import { loadConfig, selectScrcpyFolder, getScrcpyPath, isConfigured } from './config'

const isDev = !app.isPackaged

app.whenReady().then(() => {
    // Load config on startup
    loadConfig()

    createWindow()
    createTray()

    // IPC Handlers - Device Management
    ipcMain.handle('get-devices', async (): Promise<Device[]> => {
        return await getDevices()
    })

    ipcMain.handle('connect-wifi', async (_, deviceId: string): Promise<{ success: boolean; message: string }> => {
        return await connectWifi(deviceId)
    })

    ipcMain.handle('disconnect-device', async (_, deviceId: string): Promise<{ success: boolean; message: string }> => {
        return await disconnectDevice(deviceId)
    })

    // IPC Handlers - Scrcpy Control
    ipcMain.handle('start-scrcpy', async (_, deviceId: string, options: ScrcpyOptions): Promise<{ success: boolean; message: string }> => {
        return await startScrcpy(deviceId, options)
    })

    ipcMain.handle('stop-scrcpy', async (): Promise<{ success: boolean }> => {
        return await stopScrcpy()
    })

    ipcMain.handle('get-scrcpy-status', (): { running: boolean } => {
        return getScrcpyStatus()
    })

    // IPC Handlers - Window Control
    ipcMain.handle('show-window', () => {
        showWindow()
        const win = getMainWindow()
        if (win) win.webContents.send('refresh-devices')
    })

    ipcMain.handle('hide-window', () => {
        hideWindow()
    })

    ipcMain.handle('set-window-mode', (_, mode: 'normal' | 'hidden' | 'tray-only') => {
        setWindowMode(mode)
    })

    ipcMain.handle('minimize-window', () => {
        const win = getMainWindow()
        if (win) win.minimize()
    })

    ipcMain.handle('maximize-window', () => {
        const win = getMainWindow()
        if (win) win.maximize()
    })

    ipcMain.handle('unmaximize-window', () => {
        const win = getMainWindow()
        if (win) win.unmaximize()
    })

    ipcMain.handle('is-window-maximized', (): boolean => {
        const win = getMainWindow()
        return win ? win.isMaximized() : false
    })

    ipcMain.handle('close-window', () => {
        const win = getMainWindow()
        if (win) win.close()
    })

    // IPC Handlers - Config Management
    ipcMain.handle('select-scrcpy-folder', async (): Promise<{ success: boolean; path: string | null; message: string }> => {
        return await selectScrcpyFolder()
    })

    ipcMain.handle('get-scrcpy-folder', (): string | null => {
        return getScrcpyPath()
    })

    ipcMain.handle('is-configured', (): boolean => {
        return isConfigured()
    })

    // IPC Handler - Device Specs & Auto Quality
    ipcMain.handle('get-device-specs', async (_, deviceId: string): Promise<{ specs: DeviceSpecs | null; suggested: SuggestedSettings | null }> => {
        const specs = await getDeviceSpecs(deviceId)
        if (!specs) return { specs: null, suggested: null }
        const suggested = suggestQualitySettings(specs)
        return { specs, suggested }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    // Keep running in tray on Windows
    if (process.platform !== 'darwin') {
        // Don't quit, stay in tray
    }
})

app.on('before-quit', () => {
    stopScrcpy()
    destroyTray()
})

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        const win = getMainWindow()
        if (win) {
            if (win.isMinimized()) win.restore()
            showWindow()
            win.focus()
            win.webContents.send('refresh-devices')
        }
    })
}

export { isDev }
