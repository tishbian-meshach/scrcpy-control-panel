import { useState } from 'react'
import { Device } from '../App'
import DeviceCard from '../components/DeviceCard'
import { HiRefresh, HiWifi, HiPlus } from 'react-icons/hi'

interface DevicesProps {
    devices: Device[]
    selectedDevice: Device | null
    setSelectedDevice: (device: Device | null) => void
    isConfigured: boolean
    onRefresh: () => void
    onSelectFolder: () => Promise<{ success: boolean; path: string | null; message: string }>
}

function Devices({
    devices,
    selectedDevice,
    setSelectedDevice,
    isConfigured,
    onRefresh,
    onSelectFolder
}: DevicesProps) {
    const [isConnecting, setIsConnecting] = useState(false)
    const [connectError, setConnectError] = useState<string | null>(null)

    const handleConnectWifi = async (deviceId: string) => {
        setIsConnecting(true)
        setConnectError(null)
        try {
            const result = await window.electronAPI.connectWifi(deviceId)
            if (!result.success) {
                setConnectError(result.message)
            }
        } catch (error) {
            setConnectError('An error occurred while connecting')
        }
        setIsConnecting(false)
    }

    const handleDisconnect = async (deviceId: string) => {
        setIsConnecting(true)
        setConnectError(null)
        try {
            const result = await window.electronAPI.disconnectDevice(deviceId)
            if (!result.success) {
                setConnectError(result.message)
            }
        } catch (error) {
            setConnectError('An error occurred while disconnecting')
        }
        setIsConnecting(false)
    }

    if (!isConfigured) {
        return (
            <div className="page">
                <div className="page__header">
                    <h1 className="page__title">Devices</h1>
                    <p className="page__subtitle">Connect and manage your Android devices</p>
                </div>

                <div className="card text-center" style={{ maxWidth: '440px', margin: '40px auto' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)', color: 'var(--text-tertiary)' }}>
                        <HiPlus style={{ margin: '0 auto' }} />
                    </div>
                    <h2>Not Configured</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                        You need to configure the scrcpy folder before you can manage devices.
                    </p>
                    <button className="btn btn--primary" onClick={onSelectFolder}>
                        Configure Now
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="page__title">Devices</h1>
                    <p className="page__subtitle">Manage connected Android devices over USB and WiFi</p>
                </div>
                <button className="btn btn--secondary" onClick={onRefresh}>
                    <HiRefresh /> Refresh List
                </button>
            </div>

            {connectError && (
                <div className="card mb-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
                    <div style={{ color: 'var(--accent-danger)', fontSize: '13px' }}>
                        Error: {connectError}
                    </div>
                </div>
            )}

            <div className="settings-grid">
                {devices.length > 0 ? (
                    devices.map(device => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            isSelected={selectedDevice?.id === device.id}
                            isConnecting={isConnecting}
                            onSelect={() => {
                                if (device.status === 'online') {
                                    setSelectedDevice(device)
                                }
                            }}
                            onConnectWifi={() => handleConnectWifi(device.id)}
                            onDisconnect={() => handleDisconnect(device.id)}
                        />
                    ))
                ) : (
                    <div className="card text-center" style={{ padding: '60px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)', color: 'var(--text-tertiary)' }}>
                            <HiWifi style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Devices Detected</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            Ensure USB debugging is enabled and your device is connected.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Devices
