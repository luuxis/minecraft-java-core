/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

const path = require('path')
const { app, BrowserWindow, session } = require('electron')

const defaultProperties = {
    width: 1000,
    height: 650,
    resizable: false,
    center: true,
    icon: path.join(__dirname, '../../../assets/icons', `Microsoft.${(process.platform === 'win32') ? 'ico' : 'png'}`),
}

module.exports = async function (url: string, redirect_uri: string = "https://login.live.com/oauth20_desktop.srf", devTools: boolean = false) {
    await app.whenReady()

    // Isolated, in-memory session per login attempt: keeps this window off
    // session.defaultSession so the host app's own CSP/webRequest rules don't
    // get enforced against login.live.com (that was blanking the page), and a
    // fresh partition each call means no leftover live.com cookies to clear.
    const loginSession = session.fromPartition(`oauth-login-${Date.now()}-${Math.random().toString(36).slice(2)}`)

    return new Promise(resolve => {
        const mainWindow = new BrowserWindow({
            ...defaultProperties,
            webPreferences: {
                session: loginSession,
                nodeIntegration: false,
                contextIsolation: true,
            },
        })
        mainWindow.setMenu(null)
        mainWindow.loadURL(url)

        let settled = false
        const finish = (result: any) => {
            if (settled) return
            settled = true
            resolve(result)
            if (!mainWindow.isDestroyed()) mainWindow.close()
        }

        const checkUrl = (navigationUrl: string) => {
            if (!navigationUrl || !navigationUrl.startsWith(redirect_uri)) return
            const code = new URLSearchParams(navigationUrl.substring(navigationUrl.indexOf('?') + 1)).get('code')
            finish(code ?? "cancel")
        }

        // will-redirect fires as soon as the OAuth server redirects, before the
        // (often blank) landing page has a chance to finish loading.
        mainWindow.webContents.on('will-redirect', (_event: any, navigationUrl: string) => checkUrl(navigationUrl))
        mainWindow.webContents.on('did-navigate', (_event: any, navigationUrl: string) => checkUrl(navigationUrl))
        mainWindow.webContents.on('did-finish-load', () => checkUrl(mainWindow.webContents.getURL()))
        if (devTools) mainWindow.webContents.openDevTools({ mode: 'detach' })
        mainWindow.webContents.on('did-fail-load', (_event: any, errorCode: number) => {
            // -3 is ERR_ABORTED, expected when we redirect/close mid-navigation
            if (errorCode !== -3) finish("cancel")
        })

        mainWindow.on('closed', () => {
            finish("cancel")
            loginSession.clearStorageData().catch(() => {})
        })
    })
}
