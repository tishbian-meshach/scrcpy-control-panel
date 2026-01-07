import { Device, ScrcpyOptions } from '../App'
import PresetSelector from '../components/PresetSelector'
import StartButton from '../components/StartButton'
import CustomSelect from '../components/CustomSelect'
import { HiDeviceMobile, HiStatusOnline, HiPlay, HiInformationCircle } from 'react-icons/hi'

interface DashboardProps {
    devices: Device[]
    selectedDevice: Device | null
    setSelectedDevice: (device: Device | null) => void
    options: ScrcpyOptions
    isRunning: boolean
    isLoading: boolean
    selectedPreset: string | null
    isConfigured: boolean
    onStart: () => void
    onStop: () => void
    onApplyPreset: (preset: string) => void
    onSelectFolder: () => Promise<{ success: boolean; path: string | null; message: string }>
}

function Dashboard({
    devices,
    selectedDevice,
    setSelectedDevice,
    options,
    isRunning,
    isLoading,
    selectedPreset,
    isConfigured,
    onStart,
    onStop,
    onApplyPreset,
    onSelectFolder
}: DashboardProps) {
    const onlineDevices = devices.filter(d => d.status === 'online')

    // Generate command string for preview
    const generateCommandString = () => {
        const args: string[] = ['scrcpy']

        if (selectedDevice) {
            args.push('-s', selectedDevice.id)
        }

        if (!options.videoEnabled || options.audioOnly) {
            args.push('--no-video')
        } else {
            if (!options.useMaxResolution) {
                args.push('--max-size', options.maxResolution.toString())
            }
            args.push('--video-bit-rate', `${options.bitrate}M`)
            args.push('--max-fps', options.fps.toString())
            args.push('--video-codec', options.videoCodec)

            if (options.renderDriver !== 'auto') args.push('--render-driver', options.renderDriver)
            if (options.borderless) args.push('--window-borderless')
            if (options.fullscreen) args.push('--fullscreen')
        }

        if (!options.audioEnabled) {
            args.push('--no-audio')
        } else {
            args.push('--audio-codec', options.audioCodec)
            args.push('--audio-bit-rate', `${options.audioBitrate}K`)
            if (options.audioOnly) args.push('--no-video')
        }

        if (options.keyboardMode && options.keyboardMode !== 'default') args.push(`--keyboard=${options.keyboardMode}`)
        if (options.mouseMode && options.mouseMode !== 'default') args.push(`--mouse=${options.mouseMode}`)

        if (options.noControl) args.push('--no-control')
        if (options.turnScreenOff) args.push('--turn-screen-off')
        if (options.stayAwake && !options.noControl) args.push('--stay-awake')
        if (options.alwaysOnTop) args.push('--always-on-top')
        if (options.hideScrcpyWindow) args.push('--no-window')

        return args.join(' ')
    }

    const deviceOptions = onlineDevices.map(d => ({
        value: d.id,
        label: `${d.model || d.id} (${d.type.toUpperCase()})`
    }))

    if (!isConfigured) {
        return (
            <div className="page">
                <div className="page__header">
                    <h1 className="page__title">Setup Required</h1>
                    <p className="page__subtitle">Select your scrcpy folder to get started</p>
                </div>

                <div className="card text-center" style={{ maxWidth: '440px', margin: '40px auto' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)', color: 'var(--text-tertiary)' }}>
                        <HiDeviceMobile style={{ margin: '0 auto' }} />
                    </div>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Configure Scrcpy</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                        We need to know where scrcpy is located on your computer to continue.
                    </p>
                    <button className="btn btn--primary btn--lg" onClick={onSelectFolder}>
                        Select Scrcpy Folder
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Dashboard</h1>
                <p className="page__subtitle">Quickly control and manage your devices</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__value">{devices.length}</div>
                    <div className="stat-card__label">Total Devices</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value" style={{ color: 'var(--accent-success)' }}>
                        {onlineDevices.length}
                    </div>
                    <div className="stat-card__label">Online</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value" style={{ color: isRunning ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                        {isRunning ? 'Active' : 'Idle'}
                    </div>
                    <div className="stat-card__label">Session Status</div>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-controls">
                    <div className="card mb-lg">
                        <div className="card__header">
                            <span className="card__title">Selected Device</span>
                        </div>
                        {onlineDevices.length > 0 ? (
                            <CustomSelect
                                options={deviceOptions}
                                value={selectedDevice?.id || ''}
                                onChange={(val) => {
                                    const dev = devices.find(d => d.id === val)
                                    setSelectedDevice(dev || null)
                                }}
                                placeholder="Select a device..."
                            />
                        ) : (
                            <div className="empty-state">
                                <HiDeviceMobile className="empty-state__icon" />
                                <div className="empty-state__title">No online devices</div>
                                <div className="empty-state__text">Connect your device via USB or WiFi</div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="card__header">
                            <span className="card__title">Quick Presets</span>
                        </div>
                        <PresetSelector
                            selectedPreset={selectedPreset}
                            onSelect={onApplyPreset}
                        />
                    </div>
                </div>

                <div className="dashboard-start">
                    <StartButton
                        isRunning={isRunning}
                        isLoading={isLoading}
                        disabled={!selectedDevice || selectedDevice.status !== 'online'}
                        onStart={onStart}
                        onStop={onStop}
                    />

                    {selectedDevice && (
                        <div style={{ marginTop: 'var(--space-xl)', width: '100%' }}>
                            <div className="card__subtitle mb-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <HiStatusOnline /> Command Preview
                            </div>
                            <div className="command-preview">
                                {generateCommandString()}
                            </div>
                        </div>
                    )}

                    <div className="tip-box" style={{ width: '100%' }}>
                        <HiInformationCircle className="tip-box__icon" />
                        <span>Tip: Click the system tray icon to hide this app from taskbar.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
