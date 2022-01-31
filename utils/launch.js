'use strict';
const download = require('./download.js');
const Handler = require('./minecraft/Minecraft-Json.js');
const start = require('./minecraft/Minecraft-start.js');

const path = require('path');
const fs = require('fs');

class MCLCore {
    async launch(options){
        this.options = options;
        if(this.options.javapath) {
            this.options.java = false;
            this.options.ignored.push(this.options.javapath);
        }
        this.options.authorization = await Promise.resolve(this.options.authorization);
        this.jsonversion = new Handler(options);
        this.java_version = await this.jsonversion.java_version();
        this.checkFiles();
    }
    
    async checkFiles(){
        this.files = await this.jsonversion.getJSONVersion(this.options.version);
        if(this.options.verify) this.jsonversion.removeNonIgnoredFiles(this.files);
        let todownload = await this.jsonversion.checkBundle(this.options.version)

        if (todownload.length > 0) {
            let downloader = new download();
            let totsize = this.jsonversion.getTotalSize(todownload);
            
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
        
        if(this.options.verify) this.jsonversion.removeNonIgnoredFiles(this.files);
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
            if(process.platform == "win32" || process.platform == "linux") java = `${this.path}/runtime/${this.java_version}/bin/java`;
            else java = `${this.path}/runtime/${this.java_version}/jre.bundle/Contents/Home/bin/java`;
        } else if (this.options.javapath) {
            java = (`${path.resolve(this.options.javapath)}`).replace(/\\/g, "/");
        } else {
            java = "java";
        }

        if(this.start.isold()){
            const legacyDirectory = `${this.path}/resources`;
            const index = require(`${this.path}/assets/indexes/${this.json.assets}`);
            if(!fs.existsSync(legacyDirectory)) fs.mkdirSync(legacyDirectory, {recursive: true});

            await Promise.all(Object.keys(index.objects).map(async asset => {
                const hash = index.objects[asset].hash
                const subhash = hash.substring(0, 2)
                const subAsset = `${this.path}/assets/objects/${subhash}`

                const legacyAsset = asset.split('/')
                legacyAsset.pop()

                if (!fs.existsSync(path.join(legacyDirectory, legacyAsset.join('/')))) {
                    fs.mkdirSync(path.join(legacyDirectory, legacyAsset.join('/')), { recursive: true })
                }
                
                if (!fs.existsSync(path.join(legacyDirectory, asset))) {
                    fs.copyFileSync(path.join(subAsset, hash), path.join(legacyDirectory, asset))
                }
            }))
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