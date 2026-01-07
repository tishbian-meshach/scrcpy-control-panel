import { Tray, Menu, nativeImage, app } from 'electron'
import path from 'path'
import { showWindow, hideWindow, getMainWindow } from './window'
import { startScrcpy, stopScrcpy, getScrcpyStatus } from './scrcpy'

let tray: Tray | null = null

export function createTray(): void {
    // Create tray icon - use a simple 16x16 or 32x32 icon
    const iconPath = path.join(__dirname, '../../app/renderer/src/assets/scrcpy.png')

    // Create a default icon if file doesn't exist
    let trayIcon: nativeImage
    try {
        trayIcon = nativeImage.createFromPath(iconPath)
        if (trayIcon.isEmpty()) {
            trayIcon = createDefaultIcon()
        }
    } catch {
        trayIcon = createDefaultIcon()
    }

    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
    tray.setToolTip('Scrcpy Control Center')

    updateTrayMenu()

    tray.on('click', () => {
        const win = getMainWindow()
        if (win?.isVisible()) {
            hideWindow()
        } else {
            showWindow()
        }
    })
}

function createDefaultIcon(): nativeImage {
    // Create a simple colored square as default icon
    const size = 32
    const canvas = Buffer.alloc(size * size * 4)

    for (let i = 0; i < size * size; i++) {
        const offset = i * 4
        canvas[offset] = 74     // R - accent blue
        canvas[offset + 1] = 144 // G
        canvas[offset + 2] = 226 // B
        canvas[offset + 3] = 255 // A
    }

    return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

export function updateTrayMenu(): void {
    if (!tray) return

    const isRunning = getScrcpyStatus().running

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Scrcpy Control Center',
            enabled: false
        },
        { type: 'separator' },
        {
            label: isRunning ? '⏹ Stop Scrcpy' : '▶ Start Scrcpy',
            click: async () => {
                if (isRunning) {
                    await stopScrcpy()
                } else {
                    // Show window to select device and start
                    showWindow()
                }
                updateTrayMenu()
            }
        },
        { type: 'separator' },
        {
            label: 'Show App',
            click: () => showWindow()
        },
        {
            label: 'Hide App',
            click: () => hideWindow()
        },
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => {
                stopScrcpy()
                app.quit()
            }
        }
    ])

    tray.setContextMenu(contextMenu)
}

export function destroyTray(): void {
    if (tray) {
        tray.destroy()
        tray = null
    }
}

export function getTray(): Tray | null {
    return tray
}
