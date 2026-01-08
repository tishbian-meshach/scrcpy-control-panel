import { EventEmitter } from 'events'
import { getDevices, Device } from './adb'

export class DeviceMonitor extends EventEmitter {
    private intervalId: NodeJS.Timeout | null = null
    private previousDevices: Device[] = []
    private isMonitoring: boolean = false
    private pollInterval: number = 2000 // 2 seconds

    constructor() {
        super()
    }

    /**
     * Start monitoring for device changes
     */
    start(): void {
        if (this.isMonitoring) {
            console.log('Device monitor already running')
            return
        }

        console.log('Starting device monitor...')
        this.isMonitoring = true

        // Initial device scan
        this.checkDevices()

        // Poll for changes
        this.intervalId = setInterval(() => {
            this.checkDevices()
        }, this.pollInterval)
    }

    /**
     * Stop monitoring for device changes
     */
    stop(): void {
        if (!this.isMonitoring) {
            return
        }

        console.log('Stopping device monitor...')
        this.isMonitoring = false

        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }

        this.previousDevices = []
    }

    /**
     * Check for device changes
     */
    private async checkDevices(): Promise<void> {
        try {
            const currentDevices = await getDevices()

            // Filter to only USB devices with 'online' status (authorized)
            const usbDevices = currentDevices.filter(
                device => device.type === 'usb' && device.status === 'online'
            )

            // Find newly connected devices
            const newDevices = usbDevices.filter(current => {
                return !this.previousDevices.some(prev => prev.id === current.id)
            })

            // Find disconnected devices
            const disconnectedDevices = this.previousDevices.filter(prev => {
                return !usbDevices.some(current => current.id === prev.id)
            })

            // Emit events for new devices
            if (newDevices.length > 0) {
                console.log('New USB device(s) detected:', newDevices)
                for (const device of newDevices) {
                    this.emit('device-connected', device)
                }
            }

            // Emit events for disconnected devices
            if (disconnectedDevices.length > 0) {
                console.log('USB device(s) disconnected:', disconnectedDevices)
                for (const device of disconnectedDevices) {
                    this.emit('device-disconnected', device)
                }
            }

            // Update previous devices
            this.previousDevices = usbDevices

        } catch (error) {
            console.error('Error checking devices:', error)
        }
    }

    /**
     * Get current monitoring status
     */
    isRunning(): boolean {
        return this.isMonitoring
    }

    /**
     * Get list of currently connected USB devices
     */
    getCurrentDevices(): Device[] {
        return [...this.previousDevices]
    }
}

// Singleton instance
let monitorInstance: DeviceMonitor | null = null

/**
 * Get the device monitor singleton instance
 */
export function getDeviceMonitor(): DeviceMonitor {
    if (!monitorInstance) {
        monitorInstance = new DeviceMonitor()
    }
    return monitorInstance
}
