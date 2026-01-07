import { execSync } from 'child_process'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { getAdbExePath } from './config'

export interface Device {
    id: string
    type: 'usb' | 'wifi'
    status: 'online' | 'offline' | 'unauthorized'
    model?: string
}

function getAdbPath(): string | null {
    // First try the configured path
    const configuredPath = getAdbExePath()
    if (configuredPath) return configuredPath

    // Fallback: check bundled binaries
    let basePath: string
    if (app.isPackaged) {
        basePath = path.join(process.resourcesPath, 'binaries')
    } else {
        basePath = path.join(app.getAppPath(), 'binaries')
    }

    const bundledPath = path.join(basePath, 'adb.exe')
    if (fs.existsSync(bundledPath)) return bundledPath

    return null
}

export async function getDevices(): Promise<Device[]> {
    return new Promise((resolve) => {
        try {
            const adbPath = getAdbPath()
            if (!adbPath) {
                console.log('ADB path not configured')
                resolve([])
                return
            }

            const output = execSync(`"${adbPath}" devices -l`, {
                encoding: 'utf-8',
                timeout: 10000
            })

            const devices: Device[] = []
            const lines = output.split('\n').slice(1) // Skip header

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith('*')) continue

                const parts = trimmed.split(/\s+/)
                if (parts.length < 2) continue

                const id = parts[0]
                const statusStr = parts[1]
                const isWifi = id.includes(':')

                let status: Device['status'] = 'offline'
                if (statusStr === 'device') status = 'online'
                else if (statusStr === 'unauthorized') status = 'unauthorized'

                // If a WiFi device is offline, it's likely the IP changed.
                // Disconnect it to keep the list fresh.
                if (isWifi && status === 'offline') {
                    try {
                        execSync(`"${adbPath}" disconnect ${id}`, { timeout: 2000 })
                    } catch (e) {
                        // ignore error
                    }
                    continue
                }

                // Try to get model name
                let model: string | undefined
                const modelMatch = trimmed.match(/model:(\S+)/)
                if (modelMatch) {
                    model = modelMatch[1].replace(/_/g, ' ')
                }

                devices.push({
                    id,
                    type: isWifi ? 'wifi' : 'usb',
                    status,
                    model
                })
            }

            resolve(devices)
        } catch (error) {
            console.error('Error getting devices:', error)
            resolve([])
        }
    })
}

export async function connectWifi(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
        const adbPath = getAdbPath()
        if (!adbPath) {
            return { success: false, message: 'ADB path not configured. Please select scrcpy folder in Settings.' }
        }

        // First, enable TCP/IP on the device
        execSync(`"${adbPath}" -s ${deviceId} tcpip 5555`, {
            encoding: 'utf-8',
            timeout: 10000
        })

        // Wait a moment for the device to restart ADB in TCP mode
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Get device IP address
        const ipOutput = execSync(`"${adbPath}" -s ${deviceId} shell ip route`, {
            encoding: 'utf-8',
            timeout: 10000
        })

        // Parse IP from route output
        const ipMatch = ipOutput.match(/src\s+(\d+\.\d+\.\d+\.\d+)/)
        if (!ipMatch) {
            return { success: false, message: 'Could not determine device IP address' }
        }

        const deviceIp = ipMatch[1]

        // Connect via Wi-Fi
        const connectOutput = execSync(`"${adbPath}" connect ${deviceIp}:5555`, {
            encoding: 'utf-8',
            timeout: 10000
        })

        if (connectOutput.includes('connected') || connectOutput.includes('already connected')) {
            return { success: true, message: `Connected to ${deviceIp}:5555` }
        }

        return { success: false, message: connectOutput.trim() }
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to connect via WiFi' }
    }
}

export async function disconnectDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
        const adbPath = getAdbPath()
        if (!adbPath) {
            return { success: false, message: 'ADB path not configured' }
        }

        if (deviceId.includes(':')) {
            // WiFi device - disconnect
            execSync(`"${adbPath}" disconnect ${deviceId}`, {
                encoding: 'utf-8',
                timeout: 10000
            })
            return { success: true, message: `Disconnected from ${deviceId}` }
        } else {
            // USB device - can't really disconnect, but we can kill server
            return { success: false, message: 'Cannot disconnect USB device' }
        }
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to disconnect' }
    }
}

export async function getDeviceIp(deviceId: string): Promise<string | null> {
    try {
        const adbPath = getAdbPath()
        if (!adbPath) return null

        const output = execSync(`"${adbPath}" -s ${deviceId} shell ip route`, {
            encoding: 'utf-8',
            timeout: 10000
        })

        const ipMatch = output.match(/src\s+(\d+\.\d+\.\d+\.\d+)/)
        return ipMatch ? ipMatch[1] : null
    } catch {
        return null
    }
}

export async function startAdbServer(): Promise<void> {
    try {
        const adbPath = getAdbPath()
        if (!adbPath) return
        execSync(`"${adbPath}" start-server`, { timeout: 10000 })
    } catch (error) {
        console.error('Failed to start ADB server:', error)
    }
}

export async function killAdbServer(): Promise<void> {
    try {
        const adbPath = getAdbPath()
        if (!adbPath) return
        execSync(`"${adbPath}" kill-server`, { timeout: 10000 })
    } catch (error) {
        console.error('Failed to kill ADB server:', error)
    }
}

export interface DeviceSpecs {
    screenWidth: number
    screenHeight: number
    density: number
    model: string
    androidVersion: string
    sdkVersion: number
}

export async function getDeviceSpecs(deviceId: string): Promise<DeviceSpecs | null> {
    try {
        const adbPath = getAdbPath()
        if (!adbPath) return null

        // Get screen size
        const sizeOutput = execSync(`"${adbPath}" -s ${deviceId} shell wm size`, {
            encoding: 'utf-8',
            timeout: 10000
        })
        const sizeMatch = sizeOutput.match(/Physical size:\s*(\d+)x(\d+)/)
        let screenWidth = 1080, screenHeight = 1920
        if (sizeMatch) {
            screenWidth = parseInt(sizeMatch[1])
            screenHeight = parseInt(sizeMatch[2])
        }

        // Get density
        const densityOutput = execSync(`"${adbPath}" -s ${deviceId} shell wm density`, {
            encoding: 'utf-8',
            timeout: 10000
        })
        const densityMatch = densityOutput.match(/Physical density:\s*(\d+)/)
        const density = densityMatch ? parseInt(densityMatch[1]) : 420

        // Get model
        const modelOutput = execSync(`"${adbPath}" -s ${deviceId} shell getprop ro.product.model`, {
            encoding: 'utf-8',
            timeout: 10000
        }).trim()

        // Get Android version
        const versionOutput = execSync(`"${adbPath}" -s ${deviceId} shell getprop ro.build.version.release`, {
            encoding: 'utf-8',
            timeout: 10000
        }).trim()

        // Get SDK version
        const sdkOutput = execSync(`"${adbPath}" -s ${deviceId} shell getprop ro.build.version.sdk`, {
            encoding: 'utf-8',
            timeout: 10000
        }).trim()

        return {
            screenWidth,
            screenHeight,
            density,
            model: modelOutput || 'Unknown',
            androidVersion: versionOutput || 'Unknown',
            sdkVersion: parseInt(sdkOutput) || 30
        }
    } catch (error) {
        console.error('Error getting device specs:', error)
        return null
    }
}

export interface SuggestedSettings {
    maxResolution: number
    bitrate: number
    fps: number
    videoCodec: 'h264' | 'h265'
    audioBitrate: number
}

export function suggestQualitySettings(specs: DeviceSpecs): SuggestedSettings {
    // Get the maximum dimension (height in portrait)
    const maxDimension = Math.max(specs.screenWidth, specs.screenHeight)

    // Suggest resolution based on device screen
    let maxResolution: number
    let bitrate: number
    let fps: number

    if (maxDimension >= 2560) {
        // QHD+ devices
        maxResolution = 1920
        bitrate = 16
        fps = 60
    } else if (maxDimension >= 1920) {
        // FHD devices
        maxResolution = 1920
        bitrate = 12
        fps = 60
    } else if (maxDimension >= 1280) {
        // HD devices
        maxResolution = maxDimension
        bitrate = 8
        fps = 60
    } else {
        // Lower resolution devices
        maxResolution = maxDimension
        bitrate = 4
        fps = 30
    }

    // H265 for newer devices (SDK 24+), H264 for older
    const videoCodec: 'h264' | 'h265' = specs.sdkVersion >= 24 ? 'h265' : 'h264'

    // Audio bitrate
    const audioBitrate = 128

    return {
        maxResolution,
        bitrate,
        fps,
        videoCodec,
        audioBitrate
    }
}
