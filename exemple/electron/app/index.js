const { ipcRenderer } = require('electron')


document.querySelector('.microsoft').addEventListener('click', async () => {
    document.querySelector('.email').disabled = true
    document.querySelector('.password').disabled = true
    document.querySelector('.microsoft').disabled = true
    ipcRenderer.send('microsoft', 'login')
    ipcRenderer.on('microsoft', (event, data) => {
        if(data === "cancel"){
            document.querySelector('.email').disabled = false
            document.querySelector('.password').disabled = false
            document.querySelector('.microsoft').disabled = false
        } else if(data === "success"){
            document.querySelector('.email').disabled = true
            document.querySelector('.password').disabled = true
            document.querySelector('.microsoft').disabled = true
            document.querySelector('.play').disabled = false
        }
    })
})

document.querySelector('.play').addEventListener('click', async () => {
    ipcRenderer.send('play', 'login')
})