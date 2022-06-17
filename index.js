module.exports = {
    Mojang: require('./utils/authenticator/mojang.js'),
    Microsoft: require('./utils/authenticator/microsoft.js'),
    GamePass: require('./utils/authenticator/microsoft-gammepass.js'),
    AZauth: require('./utils/authenticator/AZauth.js'),
    Java: require('./utils/java/Java-json.js'),
    Launch: require('./utils/launch.js'),
    Status: require('./utils/status/statusserver.js'),
    Skin: require('./utils/skin/skin.js')
}