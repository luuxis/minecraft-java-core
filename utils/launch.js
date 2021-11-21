const Handler = require('./minecraft/Minecraft-Json.js');
const download = require('./download.js');

class MCLCore {
    async launch(options) {
        this.options = options;
        this.jsonversion = new Handler(options);
        this.download = new download();
        this.checkFiles();
    }

    async checkFiles() {
       return await this.jsonversion.checkBundle(this.options.version)
    }

}
module.exports = MCLCore;