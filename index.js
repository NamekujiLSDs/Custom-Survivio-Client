const { BrowserWindow, dialog, session, protocol, app, Menu, webContnts, shell, ipcMain } = require('electron')
const path = require('path')
const store = require('electron-store')
const config = new store()
const shortcut = require("electron-localshortcut")
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
let splashWindow
let settingWindow
let gameWindow

let appVersion = app.getVersion()

//アプデスキップ
// Object.defineProperty(app, 'isPackaged', {
//     get() {
//         return true;
//     }
// });

//カスタムプロトコルの登録
app.on('ready', () => {
    protocol.registerFileProtocol('cvc', (request, callback) =>
        callback(decodeURI(request.url.replace(/^cvc:\//, '')))
    )
})
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'cvc',
        privileges: {
            secure: true,
            corsEnabled: true
        }
    }
])

//Splash Window
let start = (ver) => {
    splashWindow = new BrowserWindow({
        width: 640,
        height: 360,
        fullscreen: false,
        frame: false,
        transparent: true,
        show: false,
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, "./assets/js/splash-preload.js")
        },
    },
    )
    splashWindow.loadFile(path.join(__dirname, "./assets/html/splash.html"))
    console.log(ver)

    const update = async () => {
        let updateCheck = null
        autoUpdater.on('checking-for-update', () => {
            splashWindow.webContents.send('status', 'Checking for updates...')
            updateCheck = setTimeout(() => {
                splashWindow.webContents.send('status', 'Update check error!')
                setTimeout(() => {
                    mainWindow()
                }, 1000)
            }, 15000)
        })
        autoUpdater.on('update-available', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send(
                'status',
                `Found new version v${i.version}!`
            )
        })
        autoUpdater.on('update-not-available', () => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send(
                'status',
                'You are using the latest version!'
            )
            setTimeout(() => {
                mainWindow()
            }, 1000)
        })
        autoUpdater.on('error', e => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Error!' + e.name)
            setTimeout(() => {
                mainWindow()
            }, 1000)
        })
        autoUpdater.on('download-progress', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Downloading new version...')
        })
        autoUpdater.on('update-downloaded', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Update downloaded')
            setTimeout(() => {
                autoUpdater.quitAndInstall()
            }, 1000)
        })
        autoUpdater.autoDownload = 'download'
        autoUpdater.allowPrerelease = false
        autoUpdater.checkForUpdates()
    }
    splashWindow.webContents.on('did-finish-load', () => {
        splashWindow.webContents.send("ver", ver)
        splashWindow.show()
        update()
    })
}

let mainWindow = () => {
    gameWindow = new BrowserWindow({
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "./js/main-preload.js")
        }
    })
    Menu.setApplicationMenu(null)
    gameWindow.webContents.loadURL("https://survev.io/")
    gameWindow.webContents.on('did-finish-load', () => {
        splashWindow.destroy()
        gameWindow.show()
    })
    gameWindow.webContents.on('before-input-event', (event, input) => {
        // サイドボタンのキーコードをチェック
        if (input.type === 'keyDown' && (input.code === 'BrowserBack' || input.code === 'BrowserForward')) {
            event.preventDefault(); // 入力をキャンセル
            console.log(`サイドボタンでのナビゲーションをキャンセルしました: ${input.code}`);
        }
    });
}

app.on('ready', () => {
    start(appVersion)
})