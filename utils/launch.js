'use strict';
const downloader = require('./download.js');
const java = require('./java/Java-json.js');
const Handler = require('./minecraft/Minecraft-Json.js');
const spawn = require('child_process')

class MCLCore {
    async launch(options){
        this.options = options;
        this.options.authorization = await Promise.resolve(this.options.authorization);
        this.jsonversion = new Handler(options);
        this.downloader = new downloader();
        this.java = java;
        this.checkFiles();
    }
    
    async checkFiles(){
        this.files = await this.jsonversion.getJSONVersion(this.options.version);
        if(this.options.verify) await this.jsonversion.removeNonIgnoredFiles(this.files);
        let todownload = await this.jsonversion.checkBundle(this.options.version)
        let totsize = this.jsonversion.getTotalSize(todownload);
        
        if (todownload.length > 0) {
            this.downloader.on("progress", (DL, totDL) => {
                this.emit("progress", DL, totDL);
            });

            this.downloader.on("speed", (speed) => {
                this.emit("speed", speed);
            });
            
            await new Promise((ret) => {
                this.downloader.on("finish", ret);
                this.downloader.multiple(todownload, totsize, 10);
            });
        }
        
        if(this.options.java) {
            let javadownload = await this.java.GetJsonJava(this.options.version, this.options.path)
            let totsizejava = this.jsonversion.getTotalSize(javadownload);

            if (javadownload.length > 0) {
                this.downloader.on("progress", (DL, totDL) => {
                    this.emit("progress", DL, totDL);
                });

                this.downloader.on("speed", (speed) => {
                    this.emit("speed", speed);
                });
                
                await new Promise((ret) => {
                    this.downloader.on("finish", ret);
                    this.downloader.multiple(javadownload, totsizejava, 10);
                });
            }            
        }
        if(this.options.verify) await this.jsonversion.removeNonIgnoredFiles(this.files);
        this.jsonversion.natives(this.files);
        this.startgame();
    }

    async startgame(){

    }

    on(event, func){
        this[event] = func;
    }
    
    emit(event, ...args){
        if(this[event]) this[event](...args);
    }
}

module.exports = MCLCore;
