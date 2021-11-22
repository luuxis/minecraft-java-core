'use strict';
const Handler = require('./minecraft/Minecraft-Json.js');
const java = require('./java/Java-json.js');
const downloader = require('./download.js');

class MCLCore {
    async launch(options) {
        this.options = options;
        this.jsonversion = new Handler(options);
        this.downloader = new downloader();
        this.java = java;
        this.checkFiles();
    }

    async checkFiles() {
        let files = await this.jsonversion.getJSONVersion(this.options.version);
        let todownload = await this.jsonversion.checkBundle(this.options.version)
        let totsize = this.jsonversion.getTotalSize(todownload);

        if (todownload.length > 0) {
            this.downloader.on("progress", (DL, totDL) => {
                console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
            });
            
            await new Promise((ret) => {
                this.downloader.on("finish", ret);
                this.downloader.multiple(todownload, totsize, 10);
            });
        }
        this.jsonversion.natives(files)
        if(this.options.java) {
            let javadownload = await this.java.GetJsonJava(this.options.version, this.options.path)
            let totsizejava = this.jsonversion.getTotalSize(javadownload);

            if (javadownload.length > 0) {
                this.downloader.on("progress", (DL, totDL) => {
                    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
                });
                
                await new Promise((ret) => {
                    this.downloader.on("finish", ret);
                    this.downloader.multiple(javadownload, totsizejava, 10);
                });
            }            
        }
    }
}

module.exports = MCLCore;
