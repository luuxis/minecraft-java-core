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
            console.log(`${(DL / 1024).toFixed(2)} Mb to ${(totDL / 1024).toFixed(2)} Mb`);
        });
        
        await new Promise((ret) => {
            this.downloader.on("finish", ret);
            this.downloader.multiple(todownload, totsize, 10);
        });
    }
}

module.exports = MCLCore;
