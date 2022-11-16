/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
// import librairies nodejs
const path = require('path');
const nodeFetch = require('node-fetch');

//import modules minecraft-java-core
const gameJsonMinecraft = require('./Minecraft-utils/Minecraft-Json');
const gameModde = require('./Minecraft-utils/Minecraft-Modde');
const gameAssetsMinecraft = require('./Minecraft-utils/Minecraft-Assets');
const gameLibrariesMinecraft = require('./Minecraft-utils/Minecraft-Libraries');
const gameVerifyMinecraft = require('./Minecraft-utils/Minecraft-Verify');
const gameArgumentsMinecraft = require('./Minecraft-utils/Minecraft-Args');
const gameStartMinecraft = require('./Minecraft-utils/Minecraft-Start');
const gameJavaMinecraft = require('./java/Java-json');
const gameDownloadMinecraft = require('./download');

module.exports = class Launch {
    Launch(config = {}) {
        // set variables config
        this.config = {
            url: config.url ? config.url : null,
            authenticator: config.authenticator ? config.authenticator : null,
            path: path.resolve(config.path ? config.path : './Minecraft').replace(/\\/g, '/'),
            version: config.version ? config.version : 'latest_release',
            detached: config.detached ? config.detached : false,
            downloadFileMultiple: config.downloadFileMultiple ? config.downloadFileMultiple : 1,

            modde: config.modde ? config.modde : false,
            verify: config.verify ? config.verify : false,
            ignored: config.ignored ? config.ignored : [],
            args: config.args ? config.args : [],

            javaPath: config.javaPath ? config.javaPath : null,
            java: config.java ? config.java : false,

            screen: config.screen ? {
                width: config.screen ? config.screen.width : null,
                height: config.screen ? config.screen.height : null,
                fullscreen: config.screen ? config.screen.fullscreen : null,
            } : false,

            memory: {
                min: config.memory?.min ? config.memory.min : '1G',
                max: config.memory?.max ? config.memory.max : '2G'
            }
        };

        if(this.config.javaPath) this.config.java = false;
        this.start()
    }

    async start() {
        // download files
        let [gameJson, gameLibraries, gameJava, gameModdeJson] = await this.DownloadGame();
        if (gameJson.error) return console.log(gameJson.message);
    
        let args = new gameArgumentsMinecraft(gameJson.json, gameLibraries, gameModdeJson, this.config).GetArgs();
        args = [...args.jvm, ...args.classpath, ...args.game];
        
        // set java path
        let java = 'java'
        if (this.config.javaPath) {
            java = this.config.javaPath;
        } else if (this.config.java) {
            java = `${this.config.path}/runtime/${gameJava.version}/bin/java`
        }
        
        // start game
        this.emit('data', `Launching with arguments ${args.join(' ')}`)
        let minecraft = new gameStartMinecraft(this.config, args, gameJson.json).start(java);
        minecraft.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')))
        minecraft.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')))
        minecraft.on('close', (code) => this.emit('close', code))
    }

    async GetJsonVersion() {
        let InfoVersion = await new gameJsonMinecraft(this.config.version).GetInfoVersion();
        if (InfoVersion.error) return InfoVersion;
        let json = await nodeFetch(InfoVersion.url).then(res => res.json());
        return { InfoVersion: InfoVersion, json: json };
    }

    async DownloadGame() {
        let gameJson = await this.GetJsonVersion();
        if (gameJson.error) return [gameJson];
        let gameModdeConf = await new gameModde(this.config).GameModde();
        let gameAssets = await new gameAssetsMinecraft(gameJson.json.assetIndex).Getassets();
        let gameLibraries = await new gameLibrariesMinecraft(gameJson).Getlibraries();
        let gameJava = this.config.java ? await gameJavaMinecraft.GetJsonJava(gameJson.json) : [];
        let Bundle = [...gameLibraries, ...gameAssets.assets, ...gameModdeConf.gameModdeFiles, ...gameJava.files ? gameJava.files : []];
        let gameDownloadListe = await new gameVerifyMinecraft(Bundle, this.config).checkBundle();

        if (gameDownloadListe.length > 0) {
            let downloader = new gameDownloadMinecraft();
            let totsize = await new gameVerifyMinecraft().getTotalSize(gameDownloadListe);

            downloader.on("progress", (DL, totDL) => {
                this.emit("progress", DL, totDL);
            });

            downloader.on("speed", (speed) => {
                this.emit("speed", speed);
            });

            downloader.on("estimated", (time) => {
                this.emit("estimated", time);
            });
            
            await downloader.downloadFileMultiple(gameDownloadListe, totsize, this.config.downloadFileMultiple);
        }
        if(this.config.verify) new gameVerifyMinecraft(Bundle, this.config).removeNonIgnoredFiles();
        new gameLibrariesMinecraft(gameJson, this.config).natives(Bundle);
        return [gameJson, gameLibraries, gameJava, gameModdeConf.gameModdeJson];
    }

    on(event, func) {
        this[event] = func;
    }

    emit(event, ...args) {
        if (this[event]) this[event](...args);
    }
}
