const { ipcRenderer } = require('electron')


let version

ipcRenderer.on("ver", (e, v) => {
    console.log(v)
    console.log(e)
    version = v
    document.getElementById("ver").innerText = version
})

document.addEventListener("DOMContentLoaded", () => {
})

ipcRenderer.on("status", (e, v) => {
    console.log(e, v)
    document.getElementById("stats").innerText = v
})