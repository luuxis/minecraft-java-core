const Handler = require('./minecraft/Minecraft-Json.js');
const downloader = require('./download.js');

class MCLCore {
    async launch(options) {
        this.options = options;
        this.jsonversion = new Handler(options);
        this.downloader = new downloader();
        this.checkFiles();
    }

    async checkFiles() {
        let todownload = await this.jsonversion.checkBundle(this.options.version)
        let totsize = this.jsonversion.getTotalSize(todownload);
        
        this.downloader.on("progress", (DL, totDL) => {
            console.log(DL, totDL);
        });
        
        await new Promise((ret) => {
            this.downloader.on("finish", ret);
            this.downloader.multiple(todownload, totsize, 10);
        });
    }
}

module.exports = MCLCore;