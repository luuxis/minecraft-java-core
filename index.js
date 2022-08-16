/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

module.exports = {
    Mojang: require('./utils/authenticator/mojang.js'),
    Microsoft: require('./utils/authenticator/microsoft.js'),
    Java: require('./utils/java/Java-json.js'),
    AZauth: require('./utils/authenticator/AZauth.js'),
    Launch: require('./utils/launch.js'),
    Status: require('./utils/status/statusServer.js'),
    // Skin: require('./utils/skin/skin.js')
}