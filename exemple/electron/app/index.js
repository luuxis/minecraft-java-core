const { ipcRenderer } = require('electron')


document.querySelector('.microsoft').addEventListener('click', async () => {
    ipcRenderer.send('microsoft', 'login')
})