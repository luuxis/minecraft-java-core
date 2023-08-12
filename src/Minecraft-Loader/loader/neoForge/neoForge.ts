/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { getPathLibraries, getFileHash, mirrors, getFileFromJar } from '../../../utils/Index.js';
import download from '../../../utils/Downloader.js';
import neoForgePatcher from '../../patcher.js'

import nodeFetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events';

export default class NeoForgeMC {
    options: any;
    on: any;
    emit: any;

    constructor(options = {}) {
        this.options = options;
        this.on = EventEmitter.prototype.on;
        this.emit = EventEmitter.prototype.emit;
    }

    async downloadInstaller(Loader: any) {
        let build: string
        let neoForgeURL = Loader.install
        let metaData = await nodeFetch(Loader.metaData).then(res => res.json());

        let versions = metaData.versions.filter(version => version.includes(`${this.options.loader.version}-`));
        if (!versions.length) return { error: `NeoForge doesn't support Minecraft ${this.options.loader.version}` };

        if (this.options.loader.build === 'latest' || this.options.loader.build === 'recommended') {
            build = versions[versions.length - 1];
        } else build = versions.find(loader => loader === this.options.loader.build);

        if (!build) return { error: `NeoForge Loader ${this.options.loader.build} not found, Available builds: ${versions.join(', ')}` };

        neoForgeURL = neoForgeURL.replaceAll(/\${version}/g, build);


        let pathFolder = path.resolve(this.options.path, 'neoForge');
        let filePath = path.resolve(pathFolder, `forge-${build}-installer.jar`);

        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(pathFolder)) fs.mkdirSync(pathFolder, { recursive: true });
            let downloadForge = new download();

            downloadForge.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, `forge-${build}-installer.jar`);
            });

            await downloadForge.downloadFile(neoForgeURL, pathFolder, `forge-${build}-installer.jar`);
        }

        return { filePath };
    }

    async extractProfile(pathInstaller: any) {
        let neoForgeJSON: any = {}

        let file: any = await getFileFromJar(pathInstaller, 'install_profile.json')
        let neoForgeJsonOrigin = JSON.parse(file);

        if (!neoForgeJsonOrigin) return { error: { message: 'Invalid neoForge installer' } };
        if (neoForgeJsonOrigin.install) {
            neoForgeJSON.install = neoForgeJsonOrigin.install;
            neoForgeJSON.version = neoForgeJsonOrigin.versionInfo;
        } else {
            neoForgeJSON.install = neoForgeJsonOrigin;
            let file: any = await getFileFromJar(pathInstaller, path.basename(neoForgeJSON.install.json))
            neoForgeJSON.version = JSON.parse(file);
        }

        return neoForgeJSON;
    }

    async extractUniversalJar(profile: any, pathInstaller: any) {
        let skipneoForgeFilter = true

        if (profile.filePath) {
            let fileInfo = getPathLibraries(profile.path)
            this.emit('extract', `Extracting ${fileInfo.name}...`);

            let pathFileDest = path.resolve(this.options.path, 'libraries', fileInfo.path)
            if (!fs.existsSync(pathFileDest)) fs.mkdirSync(pathFileDest, { recursive: true });

            let file: any = await getFileFromJar(pathInstaller, profile.filePath)
            fs.writeFileSync(`${pathFileDest}/${fileInfo.name}`, file, { mode: 0o777 })
        } else if (profile.path) {
            let fileInfo = getPathLibraries(profile.path)
            let listFile: any = await getFileFromJar(pathInstaller, null, `maven/${fileInfo.path}`)

            await Promise.all(
                listFile.map(async (files: any) => {
                    let fileName = files.split('/')
                    this.emit('extract', `Extracting ${fileName[fileName.length - 1]}...`);
                    let file: any = await getFileFromJar(pathInstaller, files)
                    let pathFileDest = path.resolve(this.options.path, 'libraries', fileInfo.path)
                    if (!fs.existsSync(pathFileDest)) fs.mkdirSync(pathFileDest, { recursive: true });
                    fs.writeFileSync(`${pathFileDest}/${fileName[fileName.length - 1]}`, file, { mode: 0o777 })
                })
            );
        } else {
            skipneoForgeFilter = false
        }

        if (profile.processors?.length) {
            let universalPath = profile.libraries.find(v => {
                return (v.name || '').startsWith('net.neoforged:forge')
            })

            let client: any = await getFileFromJar(pathInstaller, 'data/client.lzma');
            let fileInfo = getPathLibraries(profile.path || universalPath.name, '-clientdata', '.lzma')
            let pathFile = path.resolve(this.options.path, 'libraries', fileInfo.path)

            if (!fs.existsSync(pathFile)) fs.mkdirSync(pathFile, { recursive: true });
            fs.writeFileSync(`${pathFile}/${fileInfo.name}`, client, { mode: 0o777 })
            this.emit('extract', `Extracting ${fileInfo.name}...`);
        }

        return skipneoForgeFilter
    }

    async downloadLibraries(profile: any, skipneoForgeFilter: any) {
        let { libraries } = profile.version;
        let downloader = new download();
        let check = 0;
        let files: any = [];
        let size = 0;

        if (profile.install.libraries) libraries = libraries.concat(profile.install.libraries);

        libraries = libraries.filter((library, index, self) => index === self.findIndex(t => t.name === library.name))

        let skipneoForge = [
            'net.minecraftforge:neoforged:',
            'net.minecraftforge:minecraftforge:'
        ]

        for (let lib of libraries) {
            if (skipneoForgeFilter && skipneoForge.find(libs => lib.name.includes(libs))) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            if (lib.rules) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            let file = {}
            let libInfo = getPathLibraries(lib.name);
            let pathLib = path.resolve(this.options.path, 'libraries', libInfo.path);
            let pathLibFile = path.resolve(pathLib, libInfo.name);

            if (!fs.existsSync(pathLibFile)) {
                let url
                let sizeFile = 0

                let baseURL = `${libInfo.path}/${libInfo.name}`;
                let response: any = await downloader.checkMirror(baseURL, mirrors)

                if (response?.status === 200) {
                    size += response.size;
                    sizeFile = response.size;
                    url = response.url;
                } else if (lib.downloads?.artifact) {
                    url = lib.downloads.artifact.url
                    size += lib.downloads.artifact.size;
                    sizeFile = lib.downloads.artifact.size;
                } else {
                    url = null
                }

                if (url == null || !url) {
                    return { error: `Impossible to download ${libInfo.name}` };
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
            downloader.on("progress", (DL, totDL) => {
                this.emit("progress", DL, totDL, 'libraries');
            });

            await downloader.downloadFileMultiple(files, size, this.options.downloadFileMultiple);
        }
        return libraries
    }

    async patchneoForge(profile: any) {
        if (profile?.processors?.length) {
            let patcher: any = new neoForgePatcher(this.options);
            let config: any = {}

            patcher.on('patch', data => {
                this.emit('patch', data);
            });

            patcher.on('error', data => {
                this.emit('error', data);
            });

            if (!patcher.check(profile)) {
                config = {
                    java: this.options.loader.config.javaPath,
                    minecraft: this.options.loader.config.minecraftJar,
                    minecraftJson: this.options.loader.config.minecraftJson
                }

                await patcher.patcher(profile, config);
            }
        }
        return true
    }
}