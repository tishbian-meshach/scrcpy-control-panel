import { Tray, Menu, nativeImage, app } from 'electron'
import path from 'path'
import { showWindow, hideWindow, getMainWindow } from './window'
import { startScrcpy, stopScrcpy, getScrcpyStatus } from './scrcpy'

let tray: Tray | null = null

export function createTray(): void {
    // Create tray icon - use a simple 16x16 or 32x32 icon
    // Determine icon path based on environment
    let iconPath = path.join(__dirname, '../../app/renderer/src/assets/scrcpy.png')

    // In production, resources are often flattened or in specific folders
    if (app.isPackaged) {
        // Try to find the icon in the resources folder
        // configured in electron-builder.yml (extraResources or files)
        // Since we didn't explicitly add it to extraResources, it might be in the app.asar or adjacent
        // But we DID add build/icon.png for the installer. 
        // Let's rely on a known location. 
        // Best practice: put it in a 'public' or 'resources' folder that gets copied.

        // For now, let's try to look relative to the executable if not found in asar
        const resourcesPath = process.resourcesPath
        const potentialIcon = path.join(resourcesPath, 'app.asar.unpacked/app/renderer/src/assets/scrcpy.png')
        // Or if we copied it to build/icon.png and included it

        // Simpler approach: Use the one we created in build/icon.png if we can find where it ends up.
        // Actually, let's fallback to the internal default if the file isn't found, 
        // BUT we should try to point to the file we know exists in dev.

        // FIX: The most reliable way for Electron apps is `path.join(__dirname, '../../dist/icon.png')` 
        // if we put a copy there during build.
    }

    // Let's use a robust discovery
    const possiblePaths = [
        path.join(process.resourcesPath, 'icon.png'), // If we put it in extraResources
        path.join(__dirname, '../../build/icon.png'), // If preserved in build
        path.join(__dirname, '../../app/renderer/src/assets/scrcpy.png') // Dev
    ]

    let trayIcon: Electron.NativeImage | null = null

    for (const p of possiblePaths) {
        try {
            const img = nativeImage.createFromPath(p)
            if (!img.isEmpty()) {
                trayIcon = img
                break
            }
        } catch (e) {
            // ignore
        }
    }

    if (!trayIcon) {
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

function createDefaultIcon(): Electron.NativeImage {
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
