'use strict';
const fetch = require('node-fetch');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const AdmZip = require('adm-zip');
const fs = require('fs');

let MojangLib = {win32: "windows", darwin: "osx", linux: "linux"};
let Arch = {x32: "32", x64: "64", arm: "32", arm64: "64"};

class Handler {
    constructor (client){
        this.client = client
    }

    getTotalSize(bundle) {
        let size = 0;
        for(let file of bundle){
            size += file.size;
        }
        return size;
    }

    async getAllLibrairies(jsonversion){
        let libraries = [];
        for(let lib of jsonversion.libraries){
            let artifact;
            let type = "LIBRARY"
            if(lib.natives){
                let classifiers = lib.downloads.classifiers;
                let native = lib.natives[MojangLib[process.platform]];
                if(!native) native = lib.natives[process.platform];
                type = "NATIVE";
                if(native) artifact = classifiers[native.replace("${arch}", Arch[os.arch()])];
                else continue;
            } else {
                artifact = lib.downloads.artifact;
            }
            if(!artifact) continue;
            libraries.push({
                sha1: artifact.sha1,
                size: artifact.size,
                path: `libraries/${artifact.path}`,
                type: type,
                url: artifact.url
            });
        }
        return libraries;
    }
    
    async getAllAssets(jsonversion){
        let assetsjson = await fetch(jsonversion.assetIndex.url).then(res => res.json());
        let assets = [];
        for(let asset of Object.values(assetsjson.objects)){
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: "FILE",
                path: `assets/objects/${asset.hash.substring(0, 2)}/${asset.hash}`,
                url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`
            });
        }
        return {json: assetsjson, assets};
    }

    async getJSONVersion(version_id){
        let jsonversion = (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json").then(res => res.json())).versions.find(ver => ver.id == version_id);
        if (!jsonversion) {
            console.log(`version ${version_id} not found`);
            return;
        }
        
        let Version = await fetch(jsonversion.url).then(res => res.json());
        if (this.client.custom) Version.custom = await fetch(this.client.url).then(res => res.json());
        
        let libraries = await this.getAllLibrairies(Version);
        let assets = await this.getAllAssets(Version);
        let assetsjson = {
            path: `assets/indexes/${version_id}.json`,
            type: "CFILE",
            content: JSON.stringify(assets.json)
        }
        assets = assets.assets;
        
        
        let clientjar = Version.downloads.client;
        assets.push({
            sha1: clientjar.sha1,
            size: clientjar.size,
            path: `versions/${version_id}/${version_id}.jar`,
            type: "LIBRARY",
            url: clientjar.url
        })
        
        if(Version.logging){
            let logging = Version.logging.client.file;
            assets.push({
                sha1: logging.sha1,
                size: logging.size,
                path: `assets/log_configs/${logging.id}`,
                type: "LOG",
                url: logging.url
            })
        }
        
        if(Version.custom){
            let custom = Version.custom;
            custom.forEach(url => {
                assets.push({
                    sha1: url.sha1,
                    size: url.size,
                    path: url.path,
                    url: url.url
                })
            });
        }
        return [assetsjson].concat(libraries).concat(assets);
    }
    
    async checkBundle(ver, custom){
        let bundle = await this.getJSONVersion(ver, custom)
        let todownload = [];
        
        for (let file of bundle){
            if(file.sha1 == undefined) continue;
            file.path = (`${path.resolve(this.client.path)}/${file.path}`).replace(/\\/g, "/");
            file.folder = file.path.split("/").slice(0, -1).join("/");
            
            if(file.type == "CFILE"){
                if(!fs.existsSync(file.folder)) fs.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
                fs.writeFileSync(file.path, file.content, { encoding: "utf8", mode: 0o755 });
                continue;
            }
            
            if(fs.existsSync(file.path)){
                if(file.sha1){
                    if(!(await this.checkSHA1(file.path, file.sha1))) todownload.push(file);
                }
            } else todownload.push(file);
        }
        return todownload;
    }

    async checkSHA1(file, hash){
        const hex = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
        if(hex == hash) return true;
        return false;
    }
    
    async natives(bundle){
        let natives = bundle.filter(mod => mod.type == "NATIVE").map(mod => `${(`${path.resolve(this.client.path)}/`).replace(/\\/g, "/")}${mod.path}`);
        let nativeFolder = (`${path.resolve(this.client.path)}/versions/${this.client.version}/natives`).replace(/\\/g, "/");
        if(!fs.existsSync(nativeFolder)) fs.mkdirSync(nativeFolder, { recursive: true, mode: 0o777 });
        
        for(let native of natives){
            let zip = new AdmZip(native);
            let entries = zip.getEntries();
            for(let entry of entries){
                if(entry.entryName.startsWith("META-INF")) continue;
                fs.writeFileSync(`${nativeFolder}/${entry.entryName}`, entry.getData(), { encoding: "utf8", mode: 0o755 });
            }
        }
    }
    
    async removeNonIgnoredFiles(bundle){
        let files = this.getFiles((`${path.resolve(this.client.path)}`).replace(/\\/g, "/"));
        let ignoredfiles = this.client.ignored
        ignoredfiles.forEach(file => this.client.ignored.push((`${path.resolve(this.client.path)}/${file}`).replace(/\\/g, "/")));
        bundle.forEach(file => ignoredfiles.push((`${path.resolve(this.client.path)}/${file.path}`).replace(/\\/g, "/")));
        
        files = files.filter(file => ignoredfiles.indexOf(file) < 0);

        for(let file of files){
            try {
                if(fs.statSync(file).isDirectory()){
                    fs.rmdirSync(file);
                } else {
                    fs.unlinkSync(file);
                    let folder = file.split("/").slice(0, -1).join("/");
                    while(true){
                        if(folder == (`${path.resolve(this.client.path)}`).replace(/\\/g, "/")) break;
                        let content = fs.readdirSync(folder);
                        if(content.length == 0) fs.rmdirSync(folder);
                        folder = folder.split("/").slice(0, -1).join("/");
                    }
                }
            } catch(e){ }
        } 
        return files
    }
    
    getFiles(path, file = []){
        if(fs.existsSync(path)){
            let files = fs.readdirSync(path);
            if(files.length == 0) file.push(path);
            for(let i in files){
                let name = `${path}/${files[i]}`;
                if(fs.statSync(name).isDirectory())
                this.getFiles(name, file);
                else
                file.push(name);
            }
        }
        return file;
    }
}
module.exports = Handler