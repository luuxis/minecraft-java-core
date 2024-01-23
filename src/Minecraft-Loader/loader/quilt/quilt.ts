/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { getPathLibraries } from '../../../utils/Index.js';
import download from '../../../utils/Downloader.js';

import nodeFetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events';

export default class Quilt extends EventEmitter {
    options: any;
    versionMinecraft: any;

    constructor(options = {}) {
        super();
        this.options = options;
    }

    async downloadJson(Loader: any) {
        let build: any
        let metaData = await nodeFetch(Loader.metaData).then(res => res.json());

        let version = metaData.game.find(version => version.version === this.options.loader.version);
        let AvailableBuilds = metaData.loader.map(build => build.version);
        if (!version) return { error: `QuiltMC doesn't support Minecraft ${this.options.loader.version}` };

        if (this.options.loader.build === 'latest') {
            build = metaData.loader[0];
        } else if (this.options.loader.build === 'recommended') {
            build = metaData.loader.find(build => !build.version.includes('beta'));
        } else {
            build = metaData.loader.find(loader => loader.version === this.options.loader.build);
        }

        if (!build) return { error: `QuiltMC Loader ${this.options.loader.build} not found, Available builds: ${AvailableBuilds.join(', ')}` };

        let url = Loader.json.replace('${build}', build.version).replace('${version}', this.options.loader.version);
        let json = await nodeFetch(url).then(res => res.json()).catch(err => err);
        return json
    }

    async downloadLibraries(json) {
        let { libraries } = json;
        let downloader = new download();
        let files: any = [];
        let check = 0;
        let size = 0;

        for (let lib of libraries) {
            if (lib.rules) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            let file = {}
            let libInfo = getPathLibraries(lib.name);
            let pathLib = path.resolve(this.options.path, 'libraries', libInfo.path);
            let pathLibFile = path.resolve(pathLib, libInfo.name);

            if (!fs.existsSync(pathLibFile)) {
                let url = `${lib.url}${libInfo.path}/${libInfo.name}`
                let sizeFile = 0

                let res: any = await downloader.checkURL(url);
                if (res.status === 200) {
                    sizeFile = res.size;
                    size += res.size;
                }

                file = {
                    url: url,
                    folder: pathLib,
                    path: `${pathLib}/${libInfo.name}`,
                    name: libInfo.name,
                    size: sizeFile
                }
                files.push(file);
            }
            this.emit('check', check++, libraries.length, 'libraries');
        }

        if (files.length > 0) {
            downloader.on("progress", (DL: any, totDL: any) => {
                this.emit("progress", DL, totDL, 'libraries');
            });

            await downloader.downloadFileMultiple(files, size, this.options.downloadFileMultiple);
        }
        return libraries
    }
}