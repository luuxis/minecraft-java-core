const path = require('path')

const defaultProperties = {
    width: 1000,
    height: 650,
    resizable: false,
    position: "center",
    frame: (process.platform == "win32") ? true : false,
    icon: path.join(__dirname, '../../../assets/icons', `microsoft.png`)
}



