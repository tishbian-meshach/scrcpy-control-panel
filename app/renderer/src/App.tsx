import { useState, useEffect, useCallback } from 'react'
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
    HiHome,
    HiDeviceMobile,
    HiCog,
    HiMinus,
    HiX,
    HiPlay,
    HiDuplicate,
    HiStop
} from 'react-icons/hi'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Settings from './pages/Settings'

// Types
export interface Device {
    id: string
    type: 'usb' | 'wifi'
    status: 'online' | 'offline' | 'unauthorized'
    model?: string
}

export interface ScrcpyOptions {
    videoEnabled: boolean
    useMaxResolution: boolean
    maxResolution: number
    bitrate: number
    fps: number
    videoCodec: 'h264' | 'h265'
    renderDriver: 'auto' | 'direct3d' | 'opengl' | 'software'
    borderless: boolean
    fullscreen: boolean
    audioEnabled: boolean
    audioOnly: boolean
    audioCodec: 'opus' | 'aac' | 'raw'
    audioBitrate: number
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

const DEFAULT_OPTIONS: ScrcpyOptions = {
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

function App() {
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [options, setOptions] = useState<ScrcpyOptions>(DEFAULT_OPTIONS)
    const [isRunning, setIsRunning] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [isConfigured, setIsConfigured] = useState(false)
    const [scrcpyPath, setScrcpyPath] = useState<string | null>(null)
    const [isMaximized, setIsMaximized] = useState(false)

    // Check window maximized state
    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = await window.electronAPI.isWindowMaximized()
            setIsMaximized(maximized)
        }
        checkMaximized()

        // Refresh periodically or on focus
        const interval = setInterval(checkMaximized, 1000)
        return () => clearInterval(interval)
    }, [])

    const toggleMaximize = async () => {
        if (isMaximized) {
            await window.electronAPI.unmaximizeWindow()
        } else {
            await window.electronAPI.maximizeWindow()
        }
        const maximized = await window.electronAPI.isWindowMaximized()
        setIsMaximized(maximized)
    }

    // Check configuration status
    const checkConfiguration = useCallback(async () => {
        try {
            const configured = await window.electronAPI.isConfigured()
            const path = await window.electronAPI.getScrcpyFolder()
            setIsConfigured(configured)
            setScrcpyPath(path)
        } catch (error) {
            console.error('Failed to check configuration:', error)
        }
    }, [])

    useEffect(() => {
        checkConfiguration()
    }, [checkConfiguration])

    // Fetch devices
    const fetchDevices = useCallback(async () => {
        if (!isConfigured) {
            setDevices([])
            return
        }

        try {
            const deviceList = await window.electronAPI.getDevices()
            setDevices(deviceList)

            if (!selectedDevice && deviceList.length > 0) {
                const onlineDevice = deviceList.find(d => d.status === 'online')
                if (onlineDevice) {
                    setSelectedDevice(onlineDevice)
                    applyOptimalSettings(onlineDevice.id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error)
        }
    }, [selectedDevice, isConfigured])

    const applyOptimalSettings = async (deviceId: string) => {
        try {
            const result = await window.electronAPI.getDeviceSpecs(deviceId)
            if (result.specs && result.suggested) {
                setOptions(prev => ({
                    ...prev,
                    useMaxResolution: true,
                    bitrate: result.suggested!.bitrate,
                    fps: result.suggested!.fps,
                    videoCodec: result.suggested!.videoCodec,
                    audioBitrate: result.suggested!.audioBitrate
                }))
                setSelectedPreset('custom')
            }
        } catch (error) {
            console.error('Failed to get device specs:', error)
        }
    }

    useEffect(() => {
        fetchDevices()
        const interval = setInterval(fetchDevices, 3000)

        // Force refresh when window is shown/opened
        window.electronAPI.onRefreshDevices(() => {
            fetchDevices()
        })

        return () => clearInterval(interval)
    }, [fetchDevices])

    // Poll scrcpy status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await window.electronAPI.getScrcpyStatus()
                setIsRunning(status.running)
            } catch (error) {
                console.error('Failed to get scrcpy status:', error)
            }
        }

        checkStatus()
        const interval = setInterval(checkStatus, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleStart = async () => {
        if (!selectedDevice) return

        setIsLoading(true)
        try {
            const result = await window.electronAPI.startScrcpy(selectedDevice.id, options)
            if (result.success) {
                setIsRunning(true)
            } else {
                console.error('Failed to start scrcpy:', result.message)
            }
        } catch (error) {
            console.error('Error starting scrcpy:', error)
        }
        setIsLoading(false)
    }

    const handleStop = async () => {
        setIsLoading(true)
        try {
            await window.electronAPI.stopScrcpy()
            setIsRunning(false)
        } catch (error) {
            console.error('Error stopping scrcpy:', error)
        }
        setIsLoading(false)
    }

    const handleSelectFolder = async () => {
        const result = await window.electronAPI.selectScrcpyFolder()
        if (result.success) {
            setScrcpyPath(result.path)
            setIsConfigured(true)
            fetchDevices()
        }
        return result
    }

    const handleDownloadScrcpy = async () => {
        const result = await window.electronAPI.downloadScrcpy()
        if (result.success && result.path) {
            setScrcpyPath(result.path)
            setIsConfigured(true)
            fetchDevices()
        }
        return result
    }

    const applyPreset = (presetName: string) => {
        setSelectedPreset(presetName)

        const presets: Record<string, Partial<ScrcpyOptions>> = {
            'low-latency': {
                videoEnabled: true,
                maxResolution: 1280,
                bitrate: 4,
                fps: 60,
                videoCodec: 'h264',
                audioEnabled: false,
                audioOnly: false,
                noControl: false,
                controlOnly: false,
                hideScrcpyWindow: false,
                stayAwake: true,
                turnScreenOff: false
            },
            'audio-only': {
                videoEnabled: false,
                audioEnabled: true,
                audioOnly: true,
                noControl: true,
                controlOnly: false,
                hideScrcpyWindow: true
            },
            'mirror-only': {
                videoEnabled: true,
                audioEnabled: false,
                audioOnly: false,
                noControl: true,
                controlOnly: false,
                hideScrcpyWindow: false,
                maxResolution: 1920,
                bitrate: 8,
                fps: 30
            },
            'full-control': {
                videoEnabled: true,
                audioEnabled: true,
                audioOnly: false,
                noControl: false,
                controlOnly: false,
                hideScrcpyWindow: false,
                maxResolution: 1920,
                bitrate: 16,
                fps: 60,
                stayAwake: true,
                turnScreenOff: true
            }
        }

        const preset = presets[presetName]
        if (preset) {
            setOptions(prev => ({ ...prev, ...preset }))
        } else if (presetName === 'custom') {
            // Do nothing, just keep current options
        }
    }

    return (
        <Router>
            <AppContent
                devices={devices}
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
                options={options}
                setOptions={setOptions}
                isRunning={isRunning}
                isLoading={isLoading}
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                isConfigured={isConfigured}
                scrcpyPath={scrcpyPath}
                isMaximized={isMaximized}
                toggleMaximize={toggleMaximize}
                handleStart={handleStart}
                handleStop={handleStop}
                handleSelectFolder={handleSelectFolder}
                handleDownloadScrcpy={handleDownloadScrcpy}
                applyPreset={applyPreset}
                fetchDevices={fetchDevices}
            />
        </Router>
    )
}

interface AppContentProps {
    devices: Device[]
    selectedDevice: Device | null
    setSelectedDevice: (device: Device | null) => void
    options: ScrcpyOptions
    setOptions: React.Dispatch<React.SetStateAction<ScrcpyOptions>>
    isRunning: boolean
    isLoading: boolean
    selectedPreset: string | null
    setSelectedPreset: (preset: string | null) => void
    isConfigured: boolean
    scrcpyPath: string | null
    isMaximized: boolean
    toggleMaximize: () => Promise<void>
    handleStart: () => Promise<void>
    handleStop: () => Promise<void>
    handleSelectFolder: () => Promise<{ success: boolean; path: string | null; message: string }>
    handleDownloadScrcpy: () => Promise<{ success: boolean; message: string; path?: string }>
    applyPreset: (preset: string) => void
    fetchDevices: () => void
}

function AppContent({
    devices,
    selectedDevice,
    setSelectedDevice,
    options,
    setOptions,
    isRunning,
    isLoading,
    selectedPreset,
    setSelectedPreset,
    isConfigured,
    scrcpyPath,
    isMaximized,
    toggleMaximize,
    handleStart,
    handleStop,
    handleSelectFolder,
    handleDownloadScrcpy,
    applyPreset,
    fetchDevices
}: AppContentProps) {
    const location = useLocation()
    const isDashboard = location.pathname === '/'

    return (
        <div className="app-container">
            {/* Title Bar */}
            <div className="title-bar">
                <div className="title-bar__logo">
                    <HiPlay className="title-bar__logo-icon" />
                    Scrcpy Control
                </div>
                <div className="title-bar__controls">
                    <button
                        className="title-bar__btn"
                        onClick={() => window.electronAPI.minimizeWindow()}
                        title="Minimize"
                    >
                        <HiMinus size={14} />
                    </button>
                    <button
                        className="title-bar__btn"
                        onClick={toggleMaximize}
                        title={isMaximized ? "Restore" : "Maximize"}
                    >
                        {isMaximized ? <HiDuplicate size={12} /> : <HiStop size={12} />}
                    </button>
                    <button
                        className="title-bar__btn title-bar__btn--close"
                        onClick={() => window.electronAPI.hideWindow()}
                        title="Hide to Tray"
                    >
                        <HiX size={14} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Sidebar */}
                <nav className="sidebar">
                    <div className="sidebar__nav">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                            end
                        >
                            <HiHome className="sidebar__link-icon" />
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink
                            to="/devices"
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                        >
                            <HiDeviceMobile className="sidebar__link-icon" />
                            <span>Devices</span>
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                        >
                            <HiCog className="sidebar__link-icon" />
                            <span>Settings</span>
                        </NavLink>
                    </div>

                    <div className="sidebar__footer">
                        {!isDashboard && isConfigured && (
                            <div className="sidebar__action mb-md">
                                {isRunning ? (
                                    <button
                                        className="btn btn--danger btn--md"
                                        style={{ width: '100%', gap: '8px' }}
                                        onClick={handleStop}
                                        disabled={isLoading}
                                    >
                                        <HiStop /> Stop Session
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn--primary btn--md"
                                        style={{ width: '100%', gap: '8px' }}
                                        onClick={handleStart}
                                        disabled={isLoading || !selectedDevice}
                                    >
                                        <HiPlay /> Start Session
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="sidebar__status">
                            <div className={`status-dot ${isRunning ? 'status-dot--running' : 'status-dot--offline'}`}></div>
                            <span>{isRunning ? 'Running' : 'Stopped'}</span>
                        </div>
                    </div>
                </nav>

                {/* Page Content */}
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Dashboard
                                devices={devices}
                                selectedDevice={selectedDevice}
                                setSelectedDevice={setSelectedDevice}
                                options={options}
                                isRunning={isRunning}
                                isLoading={isLoading}
                                selectedPreset={selectedPreset}
                                isConfigured={isConfigured}
                                onStart={handleStart}
                                onStop={handleStop}
                                onApplyPreset={applyPreset}
                                onSelectFolder={handleSelectFolder}
                                onDownloadScrcpy={handleDownloadScrcpy}
                            />
                        }
                    />
                    <Route
                        path="/devices"
                        element={
                            <Devices
                                devices={devices}
                                selectedDevice={selectedDevice}
                                setSelectedDevice={setSelectedDevice}
                                isConfigured={isConfigured}
                                onRefresh={fetchDevices}
                                onSelectFolder={handleSelectFolder}
                            />
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <Settings
                                options={options}
                                setOptions={setOptions}
                                selectedPreset={selectedPreset}
                                setSelectedPreset={setSelectedPreset}
                                scrcpyPath={scrcpyPath}
                                isConfigured={isConfigured}
                                onSelectFolder={handleSelectFolder}
                                selectedDevice={selectedDevice}
                            />
                        }
                    />
                </Routes>
            </div>
        </div>
    )
}

export default App
