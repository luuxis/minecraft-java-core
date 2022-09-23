/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

module.exports = {
    Mojang: require('./utils/authenticator/Mojang.js'),
    Microsoft: require('./utils/authenticator/Microsoft.js'),
    Java: require('./utils/java/Java-json.js'),
    AZauth: require('./utils/authenticator/AZauth.js'),
    Launch: require('./utils/launch.js'),
    Status: require('./utils/status/statusServer.js'),
    SkinAPI: require('./utils/skin/API/getSkin.js'),
    SkinTexture2D: require('./utils/skin/Texture/skin2D.js'),
}