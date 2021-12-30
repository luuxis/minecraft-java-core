const ping = require('minecraft-server-ping');

module.exports.StatusServer = async function(ip, port = 25565) {
    return await ping.ping(ip, port).catch(err => false);
}