import { contextBridge, ipcRenderer } from 'electron'

export interface Device {
    id: string
    type: 'usb' | 'wifi'
    status: 'online' | 'offline' | 'unauthorized'
    model?: string
}

export interface ScrcpyOptions {
    // Video options
    videoEnabled: boolean
    useMaxResolution: boolean
    maxResolution: number
    bitrate: number
    fps: number
    videoCodec: 'h264' | 'h265'
    renderDriver: 'auto' | 'direct3d' | 'opengl' | 'software'
    borderless: boolean
    fullscreen: boolean

    // Audio options
    audioEnabled: boolean
    audioOnly: boolean
    audioCodec: 'opus' | 'aac' | 'raw'
    audioBitrate: number

    // Behavior options
    startMinimized: boolean
    hideScrcpyWindow: boolean
    noControl: boolean
    controlOnly: boolean
    keyboardMode: 'default' | 'uhid' | 'aoa' | 'disabled'
    mouseMode: 'default' | 'uhid' | 'aoa' | 'disabled'
    turnScreenOff: boolean
    stayAwake: boolean
    alwaysOnTop: boolean
}

const electronAPI = {
    // Device management
    getDevices: (): Promise<Device[]> => ipcRenderer.invoke('get-devices'),
    connectWifi: (deviceId: string): Promise<{ success: boolean; message: string }> =>
        ipcRenderer.invoke('connect-wifi', deviceId),
    disconnectDevice: (deviceId: string): Promise<{ success: boolean; message: string }> =>
        ipcRenderer.invoke('disconnect-device', deviceId),

    // Scrcpy control
    startScrcpy: (deviceId: string, options: ScrcpyOptions): Promise<{ success: boolean; message: string }> =>
        ipcRenderer.invoke('start-scrcpy', deviceId, options),
    stopScrcpy: (): Promise<{ success: boolean }> =>
        ipcRenderer.invoke('stop-scrcpy'),
    getScrcpyStatus: (): Promise<{ running: boolean }> =>
        ipcRenderer.invoke('get-scrcpy-status'),

    // Window control
    showWindow: (): Promise<void> => ipcRenderer.invoke('show-window'),
    hideWindow: (): Promise<void> => ipcRenderer.invoke('hide-window'),
    setWindowMode: (mode: 'normal' | 'hidden' | 'tray-only'): Promise<void> =>
        ipcRenderer.invoke('set-window-mode', mode),
    minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: (): Promise<void> => ipcRenderer.invoke('maximize-window'),
    unmaximizeWindow: (): Promise<void> => ipcRenderer.invoke('unmaximize-window'),
    isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('is-window-maximized'),
    closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),

    // Config management
    selectScrcpyFolder: (): Promise<{ success: boolean; path: string | null; message: string }> =>
        ipcRenderer.invoke('select-scrcpy-folder'),
    getScrcpyFolder: (): Promise<string | null> =>
        ipcRenderer.invoke('get-scrcpy-folder'),
    isConfigured: (): Promise<boolean> =>
        ipcRenderer.invoke('is-configured'),

    // Device specs & auto quality
    getDeviceSpecs: (deviceId: string): Promise<{
        specs: {
            screenWidth: number
            screenHeight: number
            density: number
            model: string
            androidVersion: string
            sdkVersion: number
        } | null
        suggested: {
            maxResolution: number
            bitrate: number
            fps: number
            videoCodec: 'h264' | 'h265'
            audioBitrate: number
        } | null
    }> => ipcRenderer.invoke('get-device-specs', deviceId),

    downloadScrcpy: (): Promise<{ success: boolean; message: string; path?: string }> =>
        ipcRenderer.invoke('download-scrcpy'),

    // Event listeners
    onRefreshDevices: (callback: () => void) => {
        ipcRenderer.on('refresh-devices', () => callback())
    }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for renderer
declare global {
    interface Window {
        electronAPI: typeof electronAPI
    }
}
