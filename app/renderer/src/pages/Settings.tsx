import { useState, useEffect } from 'react'
import { ScrcpyOptions, Device } from '../App'
import OptionToggle from '../components/OptionToggle'
import CustomSelect from '../components/CustomSelect'
import {
    HiVideoCamera,
    HiVolumeUp,
    HiAdjustments,
    HiCursorClick,
    HiFolderOpen,
    HiLightningBolt,
    HiRefresh,
    HiLink
} from 'react-icons/hi'

interface SettingsProps {
    options: ScrcpyOptions
    setOptions: React.Dispatch<React.SetStateAction<ScrcpyOptions>>
    selectedPreset: string | null
    setSelectedPreset: (preset: string | null) => void
    scrcpyPath: string | null
    isConfigured: boolean
    onSelectFolder: () => Promise<{ success: boolean; path: string | null; message: string }>
    selectedDevice: Device | null
}

function Settings({
    options,
    setOptions,

    setSelectedPreset,
    scrcpyPath,
    isConfigured,
    onSelectFolder,
    selectedDevice
}: SettingsProps) {
    const [folderMessage, setFolderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [optimizing, setOptimizing] = useState(false)
    const [autoConnectEnabled, setAutoConnectEnabledState] = useState(false)
    const [autoConnectMessage, setAutoConnectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const updateOption = <K extends keyof ScrcpyOptions>(key: K, value: ScrcpyOptions[K]) => {
        setOptions(prev => ({ ...prev, [key]: value }))
        setSelectedPreset('custom')
    }

    const handleVideoEnabledChange = (enabled: boolean) => {
        setOptions(prev => ({
            ...prev,
            videoEnabled: enabled,
            audioOnly: enabled ? false : prev.audioOnly
        }))
        setSelectedPreset('custom')
    }

    const handleAudioOnlyChange = (enabled: boolean) => {
        setOptions(prev => ({
            ...prev,
            audioOnly: enabled,
            videoEnabled: enabled ? false : prev.videoEnabled,
            hideScrcpyWindow: enabled ? true : prev.hideScrcpyWindow,
            audioEnabled: enabled ? true : prev.audioEnabled,
            noControl: enabled ? true : prev.noControl
        }))
        setSelectedPreset('custom')
    }

    const handleControlsChange = (enabled: boolean) => {
        setOptions(prev => ({
            ...prev,
            noControl: !enabled,
            hideScrcpyWindow: enabled ? false : prev.hideScrcpyWindow
        }))
        setSelectedPreset('custom')
    }

    const handleApplyBestSettings = async () => {
        if (!selectedDevice) return

        setOptimizing(true)
        try {
            const result = await window.electronAPI.getDeviceSpecs(selectedDevice.id)
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
                setFolderMessage({
                    type: 'success',
                    text: `Optimized for ${result.specs.model} (${result.specs.screenWidth}x${result.specs.screenHeight})`
                })
            } else {
                setFolderMessage({ type: 'error', text: 'Could not detect device specs' })
            }
        } catch (error) {
            setFolderMessage({ type: 'error', text: 'Failed to detect device specs' })
        }
        setOptimizing(false)
        setTimeout(() => setFolderMessage(null), 5000)
    }

    const handleSelectFolder = async () => {
        const result = await onSelectFolder()
        if (result.success) {
            setFolderMessage({ type: 'success', text: result.message })
        } else {
            setFolderMessage({ type: 'error', text: result.message })
        }
        setTimeout(() => setFolderMessage(null), 5000)
    }

    // Load auto-connect status on mount
    useEffect(() => {
        const loadAutoConnectStatus = async () => {
            const enabled = await window.electronAPI.getAutoConnectEnabled()
            setAutoConnectEnabledState(enabled)
        }
        loadAutoConnectStatus()
    }, [])

    const handleAutoConnectToggle = async (enabled: boolean) => {
        await window.electronAPI.setAutoConnectEnabled(enabled)
        setAutoConnectEnabledState(enabled)
        setAutoConnectMessage({
            type: 'success',
            text: enabled ? 'Auto-connect enabled' : 'Auto-connect disabled'
        })
        setTimeout(() => setAutoConnectMessage(null), 3000)
    }

    const handleSaveAutoConnectOptions = async () => {
        await window.electronAPI.setAutoConnectOptions(options)
        setAutoConnectMessage({
            type: 'success',
            text: 'Current settings saved for auto-connect'
        })
        setTimeout(() => setAutoConnectMessage(null), 3000)
    }





    const audioCodecOptions = [
        { value: 'opus', label: 'Opus (Recommended)' },
        { value: 'aac', label: 'AAC' },
        { value: 'raw', label: 'Raw' }
    ]

    const renderOptions = [
        { value: 'auto', label: 'Auto Detect' },
        { value: 'direct3d', label: 'Direct3D' },
        { value: 'opengl', label: 'OpenGL' },
        { value: 'software', label: 'Software' }
    ]

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Settings</h1>
                <p className="page__subtitle">Configure projection and audio parameters</p>
            </div>

            {/* Config & Auto-Optimize */}
            <div className="settings-2col">
                <div className="settings-section">
                    <div className="settings-section__title">
                        <HiFolderOpen className="settings-section__icon" /> Scrcpy Location
                    </div>
                    <div className="card">
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: isConfigured ? 'var(--accent-success)' : 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {isConfigured ? 'System ready' : 'Not configured'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                                {scrcpyPath || 'Select path to scrcpy.exe'}
                            </div>
                        </div>
                        <button className="btn btn--secondary btn--md" style={{ width: '100%' }} onClick={handleSelectFolder}>
                            Change Installation Folder
                        </button>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="settings-section__title">
                        <HiLightningBolt className="settings-section__icon" /> Auto Optimization
                    </div>
                    <div className="card">
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>Smart Detection</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {selectedDevice ? `Current: ${selectedDevice.model || selectedDevice.id}` : 'Select a device to optimize'}
                            </div>
                        </div>
                        <button
                            className="btn btn--primary btn--md"
                            style={{ width: '100%' }}
                            onClick={handleApplyBestSettings}
                            disabled={!selectedDevice || optimizing}
                        >
                            {optimizing ? 'Analyzing...' : 'Apply Best Settings'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Auto-Connect Section */}
            <div className="settings-section">
                <div className="settings-section__title">
                    <HiLink className="settings-section__icon" /> Auto-Connect
                </div>
                <div className="settings-grid">
                    <OptionToggle
                        label="Auto-Connect on USB Detection"
                        description="Automatically start scrcpy when USB device is plugged in"
                        enabled={autoConnectEnabled}
                        onChange={handleAutoConnectToggle}
                    />

                    {autoConnectEnabled && (
                        <div className="card">
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>Default Settings</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Save your current settings to use for auto-connect
                                </div>
                            </div>
                            <button
                                className="btn btn--secondary btn--md"
                                style={{ width: '100%' }}
                                onClick={handleSaveAutoConnectOptions}
                                disabled={!isConfigured}
                            >
                                Save Current Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {autoConnectMessage && (
                <div className={`card mb-lg`} style={{
                    background: autoConnectMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: autoConnectMessage.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
                    padding: '12px'
                }}>
                    <div style={{ color: autoConnectMessage.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)', fontSize: '13px' }}>
                        {autoConnectMessage.text}
                    </div>
                </div>
            )}

            {folderMessage && (
                <div className={`card mb-lg`} style={{
                    background: folderMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: folderMessage.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
                    padding: '12px'
                }}>
                    <div style={{ color: folderMessage.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)', fontSize: '13px' }}>
                        {folderMessage.text}
                    </div>
                </div>
            )}

            <div className="settings-2col">
                {/* Video & Audio Column */}
                <div>
                    <div className="settings-section">
                        <div className="settings-section__title">
                            <HiVideoCamera className="settings-section__icon" /> Video
                        </div>
                        <div className="settings-grid">
                            <OptionToggle
                                label="Enable Video Stream"
                                description="Stream device screen to window"
                                enabled={options.videoEnabled}
                                onChange={handleVideoEnabledChange}
                            />

                            {options.videoEnabled && (
                                <div className="card" style={{ padding: 'var(--space-md)' }}>
                                    <div className="settings-grid">
                                        <OptionToggle
                                            label="Native Resolution"
                                            description="Use device's original scale"
                                            enabled={options.useMaxResolution}
                                            onChange={(v) => updateOption('useMaxResolution', v)}
                                        />

                                        {!options.useMaxResolution && (
                                            <div className="toggle" style={{ cursor: 'default', display: 'block' }}>
                                                <div className="slider-group">
                                                    <div className="slider-group__header">
                                                        <span className="form-group__label">Resolution Limit</span>
                                                        <span className="slider-group__value">{options.maxResolution}p</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        className="slider"
                                                        min="480"
                                                        max="2160"
                                                        step="240"
                                                        value={options.maxResolution}
                                                        onChange={(e) => updateOption('maxResolution', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="toggle" style={{ cursor: 'default', display: 'block' }}>
                                            <div className="slider-group">
                                                <div className="slider-group__header">
                                                    <span className="form-group__label">Video Bitrate</span>
                                                    <span className="slider-group__value">{options.bitrate} Mbps</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="slider"
                                                    min="1"
                                                    max="64"
                                                    step="1"
                                                    value={options.bitrate}
                                                    onChange={(e) => updateOption('bitrate', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>


                                    </div>

                                    <div className="settings-grid mt-sm" >
                                        <OptionToggle
                                            label="Window Borderless"
                                            description="Remove window frame and title bar"
                                            enabled={options.borderless}
                                            onChange={(v) => updateOption('borderless', v)}
                                        />
                                        <OptionToggle
                                            label="Fullscreen"
                                            description="Start scrcpy in fullscreen mode"
                                            enabled={options.fullscreen}
                                            onChange={(v) => updateOption('fullscreen', v)}
                                        />


                                        <div className="form-group mt-sm">
                                            <label className="form-group__label">Render Driver</label>
                                            <CustomSelect
                                                options={renderOptions}
                                                value={options.renderDriver}
                                                onChange={(v) => updateOption('renderDriver', v)}
                                            />
                                        </div>
                                    </div>
                                </div>

                            )}
                        </div>
                    </div>

                    <div className="settings-section">
                        <div className="settings-section__title">
                            <HiVolumeUp className="settings-section__icon" /> Audio
                        </div>
                        <div className="settings-grid">
                            <OptionToggle
                                label="Forward Device Audio"
                                description="Forward sound (Android 11+)"
                                enabled={options.audioEnabled}
                                onChange={(v) => updateOption('audioEnabled', v)}
                            />

                            {options.audioEnabled && (
                                <div className="card" style={{ padding: 'var(--space-md)' }}>
                                    <div className="settings-grid">
                                        <OptionToggle
                                            label="Audio Only Mode"
                                            description="PROJECT SCREEN OFF"
                                            enabled={options.audioOnly}
                                            onChange={handleAudioOnlyChange}
                                        />

                                        <div className="toggle" style={{ cursor: 'default', display: 'block' }}>
                                            <div className="slider-group">
                                                <div className="slider-group__header">
                                                    <span className="form-group__label">Audio Bitrate</span>
                                                    <span className="slider-group__value">{options.audioBitrate} kbps</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="slider"
                                                    min="16"
                                                    max="512"
                                                    step="16"
                                                    value={options.audioBitrate}
                                                    onChange={(e) => updateOption('audioBitrate', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group mt-sm">
                                            <label className="form-group__label">Audio Codec</label>
                                            <CustomSelect
                                                options={audioCodecOptions}
                                                value={options.audioCodec}
                                                onChange={(v) => updateOption('audioCodec', v)}
                                            />
                                        </div>


                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls & Behavior Column */}
                <div>
                    <div className="settings-section">
                        <div className="settings-section__title">
                            <HiCursorClick className="settings-section__icon" /> Control
                        </div>
                        <div className="settings-grid">
                            <OptionToggle
                                label="Keyboard & Mouse"
                                description="Enable input forwarding"
                                enabled={!options.noControl && !options.audioOnly}
                                onChange={(v) => {
                                    handleControlsChange(v);
                                    if (!v) {
                                        setOptions(prev => ({ ...prev, stayAwake: false }));
                                    }
                                }}
                                disabled={options.audioOnly}
                            />

                            {!options.noControl && !options.audioOnly && (
                                <div className="card" style={{ padding: 'var(--space-md)' }}>
                                    <OptionToggle
                                        label="HID Interaction (UHID)"
                                        description="Emulate physical HID periferials (Press ALT to unlock mouse)"
                                        enabled={options.controlOnly}
                                        onChange={(v) => {
                                            setOptions(prev => ({
                                                ...prev,
                                                controlOnly: v,
                                                keyboardMode: v ? 'uhid' : 'default',
                                                mouseMode: v ? 'uhid' : 'default'
                                            }))
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="settings-section">
                        <div className="settings-section__title">
                            <HiAdjustments className="settings-section__icon" /> Project Behavior
                        </div>
                        <div className="settings-grid">
                            <div className="card">
                                <div className="settings-grid">
                                    <OptionToggle
                                        label="Turn Screen Off"
                                        description="Mirror with device screen off"
                                        enabled={options.turnScreenOff}
                                        onChange={(v) => updateOption('turnScreenOff', v)}
                                    />
                                    <OptionToggle
                                        label="Keep Awake"
                                        description="Prevent device from sleeping"
                                        enabled={options.stayAwake && !options.noControl}
                                        onChange={(v) => updateOption('stayAwake', v)}
                                        disabled={options.noControl}
                                    />
                                    <OptionToggle
                                        label="Always On Top"
                                        description="Keep window above others"
                                        enabled={options.alwaysOnTop}
                                        onChange={(v) => updateOption('alwaysOnTop', v)}
                                    />
                                    <OptionToggle
                                        label="Hide Projection Window"
                                        description="Run scrcpy without showing its window"
                                        enabled={options.hideScrcpyWindow && !options.videoEnabled && options.noControl}
                                        onChange={(v) => {
                                            if (v) {
                                                setOptions(prev => ({
                                                    ...prev,
                                                    hideScrcpyWindow: true,
                                                    videoEnabled: false,
                                                    noControl: true
                                                }));
                                            } else {
                                                updateOption('hideScrcpyWindow', false);
                                            }
                                        }}
                                        disabled={options.videoEnabled || !options.noControl}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn--secondary mt-lg"
                                style={{ width: '100%', gap: '8px' }}
                                onClick={() => {
                                    setOptions({
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
                                    })
                                    setSelectedPreset('custom')
                                }}
                            >
                                <HiRefresh /> Reset All Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
