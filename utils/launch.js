'use strict';
const downloader = require('./download.js');
const Handler = require('./minecraft/Minecraft-Json.js');
const start = require('./minecraft/Minecraft-start.js');

const path = require('path');

class MCLCore {
    async launch(options){
        this.options = options;
        if(this.options.javapath) {
            this.options.java = false;
            this.options.ignored.push(this.options.javapath);
        }
        this.options.authorization = await Promise.resolve(this.options.authorization);
        this.jsonversion = new Handler(options);
        this.downloader = new downloader();
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
        
        if(this.options.verify) await this.jsonversion.removeNonIgnoredFiles(this.files);
        this.jsonversion.natives(this.files);
        this.startgame();
    }

    async startgame(){
        this.path = (`${path.resolve(this.options.path)}`).replace(/\\/g, "/")
        this.libraries = this.files.filter(mod => mod.type == "LIBRARY").map(mod => `${this.path}/${mod.path}`);
        this.natives = `${this.path}/versions/${this.options.version}/natives`
        this.logger = this.files.find(mod => mod.type == "LOG").path;

        if(this.options.custom) this.json = this.files.filter(mod => mod.type == "VERIONS").map(mod => `${this.path}/${mod.path}`)[0]
        else this.json = `${this.path}/versions/${this.options.version}/${this.options.version}.json`

        this.assets_index_name = this.files.filter(mod => mod.type == "CFILE").map(mod => mod.path)[0].split('/').pop().split('.').slice(0, -1).join('.');

        let source = {
            natives: this.natives,
            libraries: this.libraries,
            json: this.json,
            authorization: this.options.authorization,
            root: this.path,
            logger: this.logger,
            assets_index_name: this.assets_index_name,
            }
        this.start = new start(this.options, source);


        let args = await this.start.agrs();
        let test2 = []
        let test = test2.concat(args.jvm, args.classPaths, args.launchOptions);

        let java;
        if(process.platform == "win32" || process.platform == "linux") java = `${this.path}/runtime/java/bin/java`;
        else java = `${this.path}/runtime/java/jre.bundle/Contents/Home/bin/java`;
        
        this.emit('data', `Launching with arguments ${test.join(' ')}`)
        let game = this.start.start(test, java)
        game.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')))
        game.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')))
        game.on('close', (code) => this.emit('close', code))
    }

    on(event, func){
        this[event] = func;
    }
    
    emit(event, ...args){
        if(this[event]) this[event](...args);
    }
}

module.exports = MCLCore;
