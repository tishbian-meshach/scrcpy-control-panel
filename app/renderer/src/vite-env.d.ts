/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        // Device management
        getDevices: () => Promise<{
            id: string
            type: 'usb' | 'wifi'
            status: 'online' | 'offline' | 'unauthorized'
            model?: string
        }[]>
        connectWifi: (deviceId: string) => Promise<{ success: boolean; message: string }>
        disconnectDevice: (deviceId: string) => Promise<{ success: boolean; message: string }>

        // Scrcpy control
        startScrcpy: (deviceId: string, options: any) => Promise<{ success: boolean; message: string }>
        stopScrcpy: () => Promise<{ success: boolean }>
        getScrcpyStatus: () => Promise<{ running: boolean }>

        // Window control
        showWindow: () => Promise<void>
        hideWindow: () => Promise<void>
        setWindowMode: (mode: 'normal' | 'hidden' | 'tray-only') => Promise<void>
        minimizeWindow: () => Promise<void>
        maximizeWindow: () => Promise<void>
        unmaximizeWindow: () => Promise<void>
        isWindowMaximized: () => Promise<boolean>
        closeWindow: () => Promise<void>

        // Config management
        selectScrcpyFolder: () => Promise<{ success: boolean; path: string | null; message: string }>
        getScrcpyFolder: () => Promise<string | null>
        isConfigured: () => Promise<boolean>

        // Device specs & auto quality
        getDeviceSpecs: (deviceId: string) => Promise<{
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
        }>
        downloadScrcpy: () => Promise<{ success: boolean; message: string; path?: string }>
        onRefreshDevices: (callback: () => void) => void
    }
}
