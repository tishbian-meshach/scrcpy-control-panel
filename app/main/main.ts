import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { createTray, destroyTray } from './tray'
import { createWindow, getMainWindow, showWindow, hideWindow, setWindowMode } from './window'
import { getDevices, connectWifi, disconnectDevice, getDeviceSpecs, suggestQualitySettings, Device, DeviceSpecs, SuggestedSettings } from './adb'
import { startScrcpy, stopScrcpy, getScrcpyStatus, ScrcpyOptions, DEFAULT_OPTIONS, getLastActiveSession } from './scrcpy'
import { loadConfig, selectScrcpyFolder, getScrcpyPath, isConfigured, getAutoConnectEnabled, setAutoConnectEnabled, getAutoConnectOptions, setAutoConnectOptions, getAutoStartEnabled, setAutoStartEnabled, getAutoReconnectEnabled, setAutoReconnectEnabled } from './config'
import { getDeviceMonitor } from './device-monitor'

const isDev = !app.isPackaged

app.whenReady().then(() => {
    // Load config on startup
    loadConfig()

    createWindow()
    createTray()

    // Start device monitor
    const monitor = getDeviceMonitor()
    monitor.start()

    // Debounce mechanism for auto-reconnect
    let reconnectTimeout: NodeJS.Timeout | null = null

    // Listen for new device connections
    monitor.on('device-connected', async (device: Device) => {
        console.log('Device connected:', device)

        // PRIORITY 1: Check if auto-reconnect should trigger (for existing sessions)
        const lastSession = getLastActiveSession()
        console.log('[AUTO-RECONNECT] Device connected. Checking for auto-reconnect...')
        console.log('[AUTO-RECONNECT] Last session:', lastSession)
        console.log('[AUTO-RECONNECT] Auto-reconnect enabled:', getAutoReconnectEnabled())
        console.log('[AUTO-RECONNECT] Is configured:', isConfigured())

        if (lastSession && getAutoReconnectEnabled() && isConfigured() && lastSession.deviceId === device.id) {
            // Same device reconnected - use auto-reconnect
            console.log('[AUTO-RECONNECT] MATCH! Triggering auto-reconnect for device:', device.id)

            // Clear any pending reconnection attempt (debounce)
            if (reconnectTimeout) {
                console.log('[AUTO-RECONNECT] Canceling previous reconnection attempt (device reconnected again)')
                clearTimeout(reconnectTimeout)
                reconnectTimeout = null
            }


            // Wait longer for device to stabilize after USB mode change
            reconnectTimeout = setTimeout(async () => {
                console.log('[AUTO-RECONNECT] Starting reconnection after 2 second delay...')
                reconnectTimeout = null
                const result = await startScrcpy(device.id, lastSession.options)

                // Notify renderer
                const win = getMainWindow()
                if (win) {
                    win.webContents.send('auto-reconnect-triggered', {
                        device,
                        success: result.success,
                        message: result.message
                    })
                }

                if (result.success) {
                    console.log('[AUTO-RECONNECT] Reconnection successful:', result.message)
                } else {
                    console.error('[AUTO-RECONNECT] Reconnection failed:', result.message)
                }
            }, 2000) // 2 second delay for device stabilization
        } else {
            // PRIORITY 2: No previous session or different device - check auto-connect
            console.log('[AUTO-RECONNECT] Not a reconnect scenario - checking auto-connect')
            if (getAutoConnectEnabled() && isConfigured()) {
                console.log('Auto-connect is enabled, launching scrcpy...')

                // Get saved options or use defaults
                const options = getAutoConnectOptions() || DEFAULT_OPTIONS

                // Start scrcpy
                const result = await startScrcpy(device.id, options)

                // Notify renderer
                const win = getMainWindow()
                if (win) {
                    win.webContents.send('auto-connect-triggered', {
                        device,
                        success: result.success,
                        message: result.message
                    })
                }

                if (result.success) {
                    console.log('Auto-connect successful:', result.message)
                } else {
                    console.error('Auto-connect failed:', result.message)
                }
            }
        }
    })

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

    // IPC Handler - Automated Setup
    ipcMain.handle('download-scrcpy', async (): Promise<{ success: boolean; message: string; path?: string }> => {
        const { downloadAndSetupScrcpy } = await import('./downloader')
        return await downloadAndSetupScrcpy()
    })

    // IPC Handlers - Auto-Connect
    ipcMain.handle('get-auto-connect-enabled', (): boolean => {
        return getAutoConnectEnabled()
    })

    ipcMain.handle('set-auto-connect-enabled', (_, enabled: boolean): void => {
        setAutoConnectEnabled(enabled)
    })

    ipcMain.handle('get-auto-connect-options', (): ScrcpyOptions | null => {
        return getAutoConnectOptions()
    })

    ipcMain.handle('set-auto-connect-options', (_, options: ScrcpyOptions): void => {
        setAutoConnectOptions(options)
    })

    // IPC Handlers - Auto-Start
    ipcMain.handle('get-auto-start-enabled', (): boolean => {
        return getAutoStartEnabled()
    })

    ipcMain.handle('set-auto-start-enabled', (_, enabled: boolean): void => {
        setAutoStartEnabled(enabled)
    })

    // IPC Handlers - Auto-Reconnect
    ipcMain.handle('get-auto-reconnect-enabled', (): boolean => {
        return getAutoReconnectEnabled()
    })

    ipcMain.handle('set-auto-reconnect-enabled', (_, enabled: boolean): void => {
        setAutoReconnectEnabled(enabled)
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
    // Stop device monitor
    const monitor = getDeviceMonitor()
    monitor.stop()

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
