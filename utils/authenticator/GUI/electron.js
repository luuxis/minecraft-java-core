const path = require('path')


module.exports.getPlatformIcon = function (filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, '../../../assets/icons', `${filename}.${ext}`)
}