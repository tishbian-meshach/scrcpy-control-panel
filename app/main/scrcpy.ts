import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { updateTrayMenu } from './tray'
import { getScrcpyExePath } from './config'

export interface ScrcpyOptions {
    // Video options
    videoEnabled: boolean
    useMaxResolution: boolean  // Use device's native resolution (no --max-size)
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
    controlOnly: boolean  // UHID keyboard/mouse mode
    keyboardMode: 'default' | 'uhid' | 'aoa' | 'disabled'
    mouseMode: 'default' | 'uhid' | 'aoa' | 'disabled'
    turnScreenOff: boolean
    stayAwake: boolean
    alwaysOnTop: boolean
}

export const DEFAULT_OPTIONS: ScrcpyOptions = {
    videoEnabled: true,
    useMaxResolution: false,
    maxResolution: 1920,
    bitrate: 8,
    fps: 60,
    videoCodec: 'h264',
    renderDriver: 'auto',
    borderless: false,
    fullscreen: false,

    audioEnabled: true,
    audioOnly: false,
    audioCodec: 'opus',
    audioBitrate: 128,

    startMinimized: false,
    hideScrcpyWindow: false,
    noControl: false,
    controlOnly: false,
    keyboardMode: 'default',
    mouseMode: 'default',
    turnScreenOff: false,
    stayAwake: true,
    alwaysOnTop: false
}

let scrcpyProcess: ChildProcess | null = null
let lastActiveDeviceId: string | null = null
let lastActiveOptions: ScrcpyOptions | null = null
let userInitiatedStop: boolean = false

function getScrcpyPath(): string | null {
    // First try the configured path
    const configuredPath = getScrcpyExePath()
    if (configuredPath) return configuredPath

    // Fallback: check bundled binaries
    let basePath: string
    if (app.isPackaged) {
        basePath = path.join(process.resourcesPath, 'binaries')
    } else {
        basePath = path.join(app.getAppPath(), 'binaries')
    }

    const bundledPath = path.join(basePath, 'scrcpy.exe')
    if (fs.existsSync(bundledPath)) return bundledPath

    return null
}

export function buildScrcpyArgs(deviceId: string, options: ScrcpyOptions): string[] {
    const args: string[] = []

    // Device selection
    args.push('-s', deviceId)

    // Video options
    if (!options.videoEnabled || options.audioOnly) {
        args.push('--no-video')
    } else {
        // Only add --max-size if not using native resolution
        if (!options.useMaxResolution) {
            args.push('--max-size', options.maxResolution.toString())
        }
        args.push('--video-bit-rate', `${options.bitrate}M`)
        args.push('--max-fps', options.fps.toString())
        args.push('--video-codec', options.videoCodec)

        if (options.renderDriver !== 'auto') {
            args.push('--render-driver', options.renderDriver)
        }

        if (options.borderless) {
            args.push('--window-borderless')
        }

        if (options.fullscreen) {
            args.push('--fullscreen')
        }
    }

    // Audio options
    if (!options.audioEnabled) {
        args.push('--no-audio')
    } else {
        args.push('--audio-codec', options.audioCodec)
        args.push('--audio-bit-rate', `${options.audioBitrate}K`)
    }

    // Keyboard/Mouse modes (for UHID/AOA control)
    if (options.keyboardMode && options.keyboardMode !== 'default') {
        args.push('--keyboard=' + options.keyboardMode)
    }
    if (options.mouseMode && options.mouseMode !== 'default') {
        args.push('--mouse=' + options.mouseMode)
    }

    // Behavior options
    if (options.noControl) {
        args.push('--no-control')
    }

    if (options.turnScreenOff) {
        args.push('--turn-screen-off')
    }

    if (options.stayAwake && !options.noControl) {
        args.push('--stay-awake')
    }

    if (options.alwaysOnTop) {
        args.push('--always-on-top')
    }

    if (options.hideScrcpyWindow) {
        args.push('--no-window')
    }

    return args
}

export function getCommandString(deviceId: string, options: ScrcpyOptions): string {
    const args = buildScrcpyArgs(deviceId, options)
    return `scrcpy ${args.join(' ')}`
}

export async function startScrcpy(
    deviceId: string,
    options: ScrcpyOptions
): Promise<{ success: boolean; message: string }> {
    // Stop any existing process first
    if (scrcpyProcess) {
        await stopScrcpy()
    }

    try {
        const scrcpyPath = getScrcpyPath()
        if (!scrcpyPath) {
            return { success: false, message: 'Scrcpy path not configured. Please select scrcpy folder in Settings.' }
        }

        const args = buildScrcpyArgs(deviceId, options)

        console.log('Starting scrcpy:', scrcpyPath, args.join(' '))

        scrcpyProcess = spawn(scrcpyPath, args, {
            cwd: path.dirname(scrcpyPath),
            windowsHide: options.startMinimized
        })

        scrcpyProcess.on('error', (error) => {
            console.error('Scrcpy error:', error)
            console.log('[AUTO-RECONNECT] Scrcpy error occurred. userInitiatedStop:', userInitiatedStop)
            scrcpyProcess = null
            if (userInitiatedStop) {
                console.log('[AUTO-RECONNECT] Clearing session (user initiated)')
                lastActiveDeviceId = null
                lastActiveOptions = null
            } else {
                console.log('[AUTO-RECONNECT] Preserving session for reconnect. Device:', lastActiveDeviceId)
            }
            updateTrayMenu()
        })

        scrcpyProcess.on('exit', (code) => {
            console.log('Scrcpy exited with code:', code)
            console.log('[AUTO-RECONNECT] Exit event. userInitiatedStop:', userInitiatedStop)
            scrcpyProcess = null
            if (userInitiatedStop) {
                console.log('[AUTO-RECONNECT] Clearing session (user initiated)')
                lastActiveDeviceId = null
                lastActiveOptions = null
                userInitiatedStop = false
            } else {
                console.log('[AUTO-RECONNECT] Preserving session for reconnect. Device:', lastActiveDeviceId)
            }
            updateTrayMenu()
        })

        scrcpyProcess.stdout?.on('data', (data) => {
            console.log('Scrcpy stdout:', data.toString())
        })

        scrcpyProcess.stderr?.on('data', (data) => {
            console.error('Scrcpy stderr:', data.toString())
        })

        // Wait a bit to check if process started successfully
        await new Promise(resolve => setTimeout(resolve, 500))

        if (scrcpyProcess && !scrcpyProcess.killed) {
            // Save session info for auto-reconnect
            lastActiveDeviceId = deviceId
            lastActiveOptions = options
            userInitiatedStop = false
            console.log('[AUTO-RECONNECT] Session started. Device:', deviceId, 'Options saved for auto-reconnect')
            updateTrayMenu()
            return { success: true, message: 'Scrcpy started successfully' }
        }

        return { success: false, message: 'Scrcpy failed to start' }
    } catch (error: any) {
        console.error('Failed to start scrcpy:', error)
        return { success: false, message: error.message || 'Failed to start scrcpy' }
    }
}

export async function stopScrcpy(userInitiated: boolean = true): Promise<{ success: boolean }> {
    console.log('[AUTO-RECONNECT] stopScrcpy called. userInitiated:', userInitiated)
    if (scrcpyProcess) {
        try {
            userInitiatedStop = userInitiated
            scrcpyProcess.kill('SIGTERM')

            // Force kill after timeout
            setTimeout(() => {
                if (scrcpyProcess && !scrcpyProcess.killed) {
                    scrcpyProcess.kill('SIGKILL')
                }
            }, 2000)

            scrcpyProcess = null
            updateTrayMenu()
            return { success: true }
        } catch (error) {
            console.error('Failed to stop scrcpy:', error)
            return { success: false }
        }
    }
    return { success: true }
}

export function getScrcpyStatus(): { running: boolean } {
    return { running: scrcpyProcess !== null && !scrcpyProcess.killed }
}

export function getScrcpyProcess(): ChildProcess | null {
    return scrcpyProcess
}

export function getLastActiveSession(): { deviceId: string; options: ScrcpyOptions } | null {
    if (lastActiveDeviceId && lastActiveOptions) {
        return { deviceId: lastActiveDeviceId, options: lastActiveOptions }
    }
    return null
}

export function clearLastActiveSession(): void {
    lastActiveDeviceId = null
    lastActiveOptions = null
    userInitiatedStop = false
}

// Preset configurations
export const PRESETS: Record<string, Partial<ScrcpyOptions>> = {
    'low-latency': {
        videoEnabled: true,
        maxResolution: 1280,
        bitrate: 4,
        fps: 60,
        videoCodec: 'h264',
        audioEnabled: false,
        stayAwake: true,
        turnScreenOff: false
    },
    'audio-only': {
        videoEnabled: false,
        audioEnabled: true,
        audioOnly: true
    },
    'mirror-only': {
        videoEnabled: true,
        audioEnabled: false,
        noControl: true,
        maxResolution: 1920,
        bitrate: 8,
        fps: 30
    },
    'full-control': {
        videoEnabled: true,
        audioEnabled: true,
        maxResolution: 1920,
        bitrate: 16,
        fps: 60,
        stayAwake: true,
        turnScreenOff: true
    }
}

export function applyPreset(presetName: string, currentOptions: ScrcpyOptions): ScrcpyOptions {
    const preset = PRESETS[presetName]
    if (!preset) return currentOptions

    return { ...currentOptions, ...preset }
}
