'use strict';
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
        let files = await this.jsonversion.getJSONVersion(this.options.version);
        let todownload = await this.jsonversion.checkBundle(this.options.version)
        let totsize = this.jsonversion.getTotalSize(todownload);
        
        this.downloader.on("progress", (DL, totDL) => {
            console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
        });
        
        await new Promise((ret) => {
            this.downloader.on("finish", ret);
            this.downloader.multiple(todownload, totsize, 10);
        });
        this.jsonversion.natives(files)
    }
}

module.exports = MCLCore;
