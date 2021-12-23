const Gamedig = require('gamedig');

module.exports.StatusServer = async function(ip, port = 25565) {
    let result = Gamedig.query({type: 'minecraft',host: ip,port: port}).then(res => res).catch(err => {console.log(err); false});
    return result;
}