import { Device } from '../App'
import { HiDeviceMobile, HiStatusOnline, HiStatusOffline, HiExclamation, HiWifi, HiTrash } from 'react-icons/hi'

interface DeviceCardProps {
    device: Device
    isSelected: boolean
    isConnecting: boolean
    onSelect: () => void
    onConnectWifi: () => void
    onDisconnect: () => void
}

function DeviceCard({
    device,
    isSelected,
    isConnecting,
    onSelect,
    onConnectWifi,
    onDisconnect
}: DeviceCardProps) {
    const getStatusIcon = () => {
        switch (device.status) {
            case 'online':
                return <HiStatusOnline className="text-success" />
            case 'offline':
                return <HiStatusOffline className="text-danger" />
            case 'unauthorized':
                return <HiExclamation className="text-warning" />
            default:
                return null
        }
    }

    const getStatusBadge = () => {
        switch (device.status) {
            case 'online':
                return <span className="device-card__badge device-card__badge--online">Online</span>
            case 'offline':
                return <span className="device-card__badge device-card__badge--offline">Offline</span>
            case 'unauthorized':
                return <span className="device-card__badge device-card__badge--unauthorized">Unauthorized</span>
        }
    }

    return (
        <div
            className={`device-card ${isSelected ? 'device-card--selected' : ''}`}
            onClick={onSelect}
            style={{ cursor: device.status === 'online' ? 'pointer' : 'not-allowed' }}
        >
            <div className="device-card__icon">
                {device.type === 'usb' ? <HiDeviceMobile size={22} /> : <HiWifi size={22} />}
            </div>

            <div className="device-card__info">
                <div className="device-card__name">
                    {device.model || 'Android Device'}
                </div>
                <div className="device-card__id">{device.id}</div>
                <div className="device-card__meta">
                    <span className={`device-card__badge device-card__badge--${device.type}`}>
                        {device.type.toUpperCase()}
                    </span>
                    {getStatusBadge()}
                </div>
            </div>

            <div className="device-card__actions">
                {device.type === 'usb' && device.status === 'online' && (
                    <button
                        className="btn btn--secondary btn--sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onConnectWifi()
                        }}
                        disabled={isConnecting}
                        title="Connect over WiFi"
                    >
                        {isConnecting ? (
                            <span className="spinner" style={{ width: 14, height: 14 }}></span>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <HiWifi /> WiFi
                            </div>
                        )}
                    </button>
                )}

                {device.type === 'wifi' && (
                    <button
                        className="btn btn--ghost btn--sm text-danger"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDisconnect()
                        }}
                        disabled={isConnecting}
                        title="Disconnect WiFi"
                    >
                        {isConnecting ? (
                            <span className="spinner" style={{ width: 14, height: 14 }}></span>
                        ) : (
                            <HiTrash size={16} />
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

export default DeviceCard
