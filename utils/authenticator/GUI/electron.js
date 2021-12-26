const path = require('path')
const {app, BrowserWindow} = require('electron')

const defaultProperties = {
  width: 1000,
  height: 650,
  resizable: false,
  center: true,
  icon: path.join(__dirname, '../../../assets/icons', `microsoft.${(process.platform === 'win32') ? 'ico' : 'png'}`),
};


