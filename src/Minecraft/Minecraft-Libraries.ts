/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import os from 'os';
import fs from 'fs';
import AdmZip from 'adm-zip';
import nodeFetch from 'node-fetch';

let MojangLib = { win32: "windows", darwin: "osx", linux: "linux" };
let Arch = { x32: "32", x64: "64", arm: "32", arm64: "64" };

export default class Libraries {
    json: any;
    options: any;
    constructor(options: any) {
        this.options = options;
    }

    async Getlibraries(json: any) {
        this.json = json;
        let libraries = [];

        for (let lib of this.json.libraries) {
            let artifact: any;
            let type = "Libraries";

            if (lib.natives) {
                let classifiers = lib.downloads.classifiers;
                let native = lib.natives[MojangLib[process.platform]];
                if (!native) native = lib.natives[process.platform];
                type = "Native";
                if (native) artifact = classifiers[native.replace("${arch}", Arch[os.arch()])];
                else continue;
            } else {
                if (lib.rules && lib.rules[0].os) {
                    if (lib.rules[0].os.name !== MojangLib[process.platform]) continue;
                }
                artifact = lib.downloads.artifact;
            }
            if (!artifact) continue;
            libraries.push({
                sha1: artifact.sha1,
                size: artifact.size,
                path: `libraries/${artifact.path}`,
                type: type,
                url: artifact.url
            });
        }

        libraries.push({
            sha1: this.json.downloads.client.sha1,
            size: this.json.downloads.client.size,
            path: `versions/${this.json.id}/${this.json.id}.jar`,
            type: "Libraries",
            url: this.json.downloads.client.url
        });

        libraries.push({
            path: `versions/${this.json.id}/${this.json.id}.json`,
            type: "CFILE",
            content: JSON.stringify(this.json)
        });
        return libraries;
    }

    async GetAssetsOthers(url: any) {
        if (!url) return [];
        let data = await nodeFetch(url).then(res => res.json());

        let assets = [];
        for (let asset of data) {
            if (!asset.path) continue
            let path = asset.path;
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: path.split("/")[0],
                path: this.options.instance ? `instances/${this.options.instance}/${path}` : path,
                url: asset.url
            });
        }
        return assets
    }

    async natives(bundle: any) {
        let natives = bundle.filter(mod => mod.type === "Native").map(mod => `${mod.path}`);
        if (natives.length === 0) return natives;
        let nativeFolder = (`${this.options.path}/versions/${this.json.id}/natives`).replace(/\\/g, "/");
        if (!fs.existsSync(nativeFolder)) fs.mkdirSync(nativeFolder, { recursive: true, mode: 0o777 });

        for (let native of natives) {
            let zip = new AdmZip(native);
            let entries = zip.getEntries();
            for (let entry of entries) {
                if (entry.entryName.startsWith("META-INF")) continue;
                if (entry.isDirectory) {
                    fs.mkdirSync(`${nativeFolder}/${entry.entryName}`, { recursive: true, mode: 0o777 });
                    continue
                }
                fs.writeFile(`${nativeFolder}/${entry.entryName}`, zip.readFile(entry), { encoding: "utf8", mode: 0o777 }, () => { });
            }
        }
        return natives;
    }
}