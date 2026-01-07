import { app, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

interface AppConfig {
    scrcpyPath: string | null
    lastDevice: string | null
    windowMode: 'normal' | 'hidden' | 'tray-only'
}

const DEFAULT_CONFIG: AppConfig = {
    scrcpyPath: null,
    lastDevice: null,
    windowMode: 'normal'
}

let config: AppConfig = { ...DEFAULT_CONFIG }

function getConfigPath(): string {
    return path.join(app.getPath('userData'), 'config.json')
}

export function loadConfig(): AppConfig {
    try {
        const configPath = getConfigPath()
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8')
            config = { ...DEFAULT_CONFIG, ...JSON.parse(data) }
        }
    } catch (error) {
        console.error('Failed to load config:', error)
        config = { ...DEFAULT_CONFIG }
    }
    return config
}

export function saveConfig(): void {
    try {
        const configPath = getConfigPath()
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    } catch (error) {
        console.error('Failed to save config:', error)
    }
}

export function getConfig(): AppConfig {
    return config
}

export function setScrcpyPath(scrcpyPath: string | null): void {
    config.scrcpyPath = scrcpyPath
    saveConfig()
}

export function getScrcpyPath(): string | null {
    return config.scrcpyPath
}

export function setLastDevice(deviceId: string | null): void {
    config.lastDevice = deviceId
    saveConfig()
}

export function getLastDevice(): string | null {
    return config.lastDevice
}

export function setWindowMode(mode: 'normal' | 'hidden' | 'tray-only'): void {
    config.windowMode = mode
    saveConfig()
}

export function getWindowModeConfig(): 'normal' | 'hidden' | 'tray-only' {
    return config.windowMode
}

export async function selectScrcpyFolder(): Promise<{ success: boolean; path: string | null; message: string }> {
    const result = await dialog.showOpenDialog({
        title: 'Select Scrcpy Folder',
        properties: ['openDirectory'],
        buttonLabel: 'Select Folder'
    })

    if (result.canceled || result.filePaths.length === 0) {
        return { success: false, path: null, message: 'Selection cancelled' }
    }

    const selectedPath = result.filePaths[0]

    // Verify the folder contains scrcpy.exe and adb.exe
    const scrcpyExe = path.join(selectedPath, 'scrcpy.exe')
    const adbExe = path.join(selectedPath, 'adb.exe')

    const hasScrcpy = fs.existsSync(scrcpyExe)
    const hasAdb = fs.existsSync(adbExe)

    if (!hasScrcpy && !hasAdb) {
        return {
            success: false,
            path: null,
            message: 'Selected folder does not contain scrcpy.exe or adb.exe'
        }
    }

    if (!hasScrcpy) {
        return {
            success: false,
            path: null,
            message: 'Selected folder does not contain scrcpy.exe'
        }
    }

    if (!hasAdb) {
        return {
            success: false,
            path: null,
            message: 'Selected folder does not contain adb.exe. Some features may not work.'
        }
    }

    // Save the path
    setScrcpyPath(selectedPath)

    return {
        success: true,
        path: selectedPath,
        message: 'Scrcpy folder configured successfully'
    }
}

export function getAdbExePath(): string | null {
    if (!config.scrcpyPath) return null
    const adbPath = path.join(config.scrcpyPath, 'adb.exe')
    return fs.existsSync(adbPath) ? adbPath : null
}

export function getScrcpyExePath(): string | null {
    if (!config.scrcpyPath) return null
    const scrcpyPath = path.join(config.scrcpyPath, 'scrcpy.exe')
    return fs.existsSync(scrcpyPath) ? scrcpyPath : null
}

export function isConfigured(): boolean {
    return config.scrcpyPath !== null && getScrcpyExePath() !== null
}
