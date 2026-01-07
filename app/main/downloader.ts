import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import { execSync } from 'child_process'
import { setScrcpyPath } from './config'

interface GithubRelease {
    tag_name: string
    assets: Array<{
        name: string
        browser_download_url: string
    }>
}

export async function downloadAndSetupScrcpy(): Promise<{ success: boolean; message: string; path?: string }> {
    try {
        const binariesDir = path.join(app.getPath('userData'), 'binaries')
        if (!fs.existsSync(binariesDir)) {
            fs.mkdirSync(binariesDir, { recursive: true })
        }

        // 1. Get latest release info
        const release = await getLatestRelease()
        const asset = release.assets.find(a => a.name.includes('win64') && a.name.endsWith('.zip'))

        if (!asset) {
            return { success: false, message: 'Could not find a suitable Windows 64-bit scrcpy release' }
        }

        const zipPath = path.join(binariesDir, asset.name)
        const extractPath = path.join(binariesDir, asset.name.replace('.zip', ''))

        // 2. Download
        await downloadFile(asset.browser_download_url, zipPath)

        // 3. Extract using PowerShell (built-in on Windows)
        if (fs.existsSync(extractPath)) {
            fs.rmSync(extractPath, { recursive: true, force: true })
        }
        fs.mkdirSync(extractPath, { recursive: true })

        execSync(`powershell -Command "Expand-Archive -Path \\"${zipPath}\\" -DestinationPath \\"${extractPath}\\" -Force"`)

        // 4. Cleanup
        fs.unlinkSync(zipPath)

        // Find the actual folder inside extraction (scrcpy-win64-vX.X)
        const items = fs.readdirSync(extractPath)
        let finalPath = extractPath
        for (const item of items) {
            const fullPath = path.join(extractPath, item)
            if (fs.statSync(fullPath).isDirectory() && item.startsWith('scrcpy-win64')) {
                finalPath = fullPath
                break
            }
        }

        // 5. Save config
        setScrcpyPath(finalPath)

        return { success: true, message: 'Scrcpy setup completed successfully', path: finalPath }
    } catch (error: any) {
        console.error('Scrcpy setup failed:', error)
        return { success: false, message: error.message || 'Setup failed' }
    }
}

async function getLatestRelease(): Promise<GithubRelease> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/Genymobile/scrcpy/releases/latest',
            headers: {
                'User-Agent': 'scrcpy-control-center'
            }
        }

        https.get(options, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data))
                } catch (e) {
                    reject(e)
                }
            })
        }).on('error', reject)
    })
}

async function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest)

        function getLink(downloadUrl: string) {
            https.get(downloadUrl, { headers: { 'User-Agent': 'scrcpy-control-center' } }, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    getLink(response.headers.location!)
                    return
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download file: ${response.statusCode}`))
                    return
                }

                response.pipe(file)
                file.on('finish', () => {
                    file.close()
                    resolve()
                })
            }).on('error', (err) => {
                fs.unlink(dest, () => { })
                reject(err)
            })
        }

        getLink(url)
    })
}
