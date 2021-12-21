'use strict';
const download = require('./download.js');
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
        this.checkFiles();
    }
    
    async checkFiles(){
        this.files = await this.jsonversion.getJSONVersion(this.options.version);
        if(this.options.verify) await this.jsonversion.removeNonIgnoredFiles(this.files);
        let todownload = await this.jsonversion.checkBundle(this.options.version)
        let totsize = this.jsonversion.getTotalSize(todownload);
        let downloader = new download();

        if (todownload.length > 0) {
            downloader.on("progress", (DL, totDL) => {
                this.emit("progress", DL, totDL);
            });

            downloader.on("speed", (speed) => {
                this.emit("speed", speed);
            });

            downloader.on("estimated", (time) => {
                this.emit("estimated", time);
            });
            
            await new Promise((ret) => {
                downloader.on("finish", ret);
                downloader.multiple(todownload, totsize, 10);
            });
        }
        
        if(this.options.verify) await this.jsonversion.removeNonIgnoredFiles(this.files);
        this.jsonversion.natives(this.files);
        this.startgame();
    }

    async startgame(){
        this.path = (`${path.resolve(this.options.path)}`).replace(/\\/g, "/")
        this.natives = `${this.path}/versions/${this.options.version}/natives`

        this.vanilla = require(this.files.filter(mod => mod.type == "VERSION").map(mod => `${this.path}/${mod.path}`)[0])
        if(this.options.custom) this.custom = require(this.files.filter(mod => mod.type == "VERIONSCUSTOM").map(mod => `${this.path}/${mod.path}`)[0])

        this.json = this.vanilla
        this.json.id = this.files.filter(mod => mod.type == "JARVERSION").map(mod => `${this.path}/${mod.path}`)[0]
        this.json.mainClass = this.vanilla.mainClass
        if(this.options.custom){
            this.json.custom = this.custom
            this.json.mainClass = this.custom.mainClass
        }

        let source = {
            natives: this.natives,
            json: this.json,
            authorization: this.options.authorization,
            root: this.path,
        }

        this.start = new start(this.options, source);

        let args = await this.start.agrs();
        
        let jvm = args.jvm
        let classPaths = args.classPaths
        let launchOptions = args.launchOptions

        let launchargs = [].concat(jvm, classPaths, launchOptions)
        let java;

        if(this.options.java) {
            if(process.platform == "win32" || process.platform == "linux") java = `${this.path}/runtime/java/bin/java`;
            else java = `${this.path}/runtime/java/jre.bundle/Contents/Home/bin/java`;
        } else if (this.options.javapath) {
            java = (`${path.resolve(this.options.javapath)}`).replace(/\\/g, "/");
        } else {
            java = "java";
        }
        
        this.emit('data', `Launching with arguments ${launchargs.join(' ')}`)
        let game = this.start.start(launchargs, java)
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