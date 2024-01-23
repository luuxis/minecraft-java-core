/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { getPathLibraries, getFileHash, mirrors, getFileFromArchive, createZIP } from '../../../utils/Index.js';
import download from '../../../utils/Downloader.js';
import forgePatcher from '../../patcher.js'

import nodeFetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events';
import { skipLibrary } from '../../../utils/Index.js';

let Lib = { win32: "windows", darwin: "osx", linux: "linux" };

export default class ForgeMC extends EventEmitter {
    options: any;

    constructor(options = {}) {
        super();
        this.options = options;
    }

    async downloadInstaller(Loader: any) {
        let metaData = (await nodeFetch(Loader.metaData).then(res => res.json()))[this.options.loader.version];
        let AvailableBuilds = metaData;
        let forgeURL: String;
        let ext: String;
        let hashFileOrigin: String;
        if (!metaData) return { error: `Forge ${this.options.loader.version} not supported` };

        let build
        if (this.options.loader.build === 'latest') {
            let promotions = await nodeFetch(Loader.promotions).then(res => res.json());
            promotions = promotions.promos[`${this.options.loader.version}-latest`];
            build = metaData.find(build => build.includes(promotions))
        } else if (this.options.loader.build === 'recommended') {
            let promotion = await nodeFetch(Loader.promotions).then(res => res.json());
            let promotions = promotion.promos[`${this.options.loader.version}-recommended`];
            if (!promotions) promotions = promotion.promos[`${this.options.loader.version}-latest`];
            build = metaData.find(build => build.includes(promotions))
        } else {
            build = this.options.loader.build;
        }

        metaData = metaData.filter(b => b === build)[0];
        if (!metaData) return { error: `Build ${build} not found, Available builds: ${AvailableBuilds.join(', ')}` };


        let meta = await nodeFetch(Loader.meta.replace(/\${build}/g, metaData)).then(res => res.json());
        let installerType = Object.keys(meta.classifiers).find((key: String) => key == 'installer');
        let clientType = Object.keys(meta.classifiers).find((key: String) => key == 'client');
        let universalType = Object.keys(meta.classifiers).find((key: String) => key == 'universal');

        if (installerType) {
            forgeURL = forgeURL = Loader.install.replace(/\${version}/g, metaData);
            ext = Object.keys(meta.classifiers.installer)[0];
            hashFileOrigin = meta.classifiers.installer[`${ext}`];
        } else if (clientType) {
            forgeURL = Loader.client.replace(/\${version}/g, metaData);
            ext = Object.keys(meta.classifiers.client)[0];
            hashFileOrigin = meta.classifiers.client[`${ext}`];
        } else if (universalType) {
            forgeURL = Loader.universal.replace(/\${version}/g, metaData);
            ext = Object.keys(meta.classifiers.universal)[0];
            hashFileOrigin = meta.classifiers.universal[`${ext}`];
        } else {
            return { error: 'Invalid forge installer' };
        }

        let pathFolder = path.resolve(this.options.path, 'forge');
        let filePath = path.resolve(pathFolder, (`${forgeURL}.${ext}`).split('/').pop());

        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(pathFolder)) fs.mkdirSync(pathFolder, { recursive: true });
            let downloadForge = new download();

            downloadForge.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, (`${forgeURL}.${ext}`).split('/').pop());
            });

            await downloadForge.downloadFile(`${forgeURL}.${ext}`, pathFolder, (`${forgeURL}.${ext}`).split('/').pop());
        }

        let hashFileDownload = await getFileHash(filePath, 'md5');

        if (hashFileDownload !== hashFileOrigin) {
            fs.rmSync(filePath);
            return { error: 'Invalid hash' };
        }
        return { filePath, metaData, ext, id: `forge-${build}` };
    }

    async extractProfile(pathInstaller: any) {
        let forgeJSON: any = {}

        let file: any = await getFileFromArchive(pathInstaller, 'install_profile.json')
        let forgeJsonOrigin = JSON.parse(file);

        if (!forgeJsonOrigin) return { error: { message: 'Invalid forge installer' } };
        if (forgeJsonOrigin.install) {
            forgeJSON.install = forgeJsonOrigin.install;
            forgeJSON.version = forgeJsonOrigin.versionInfo;
        } else {
            forgeJSON.install = forgeJsonOrigin;
            let file: any = await getFileFromArchive(pathInstaller, path.basename(forgeJSON.install.json))
            forgeJSON.version = JSON.parse(file);
        }

        return forgeJSON;
    }

    async extractUniversalJar(profile: any, pathInstaller: any) {
        let skipForgeFilter = true

        if (profile.filePath) {
            let fileInfo = getPathLibraries(profile.path)
            this.emit('extract', `Extracting ${fileInfo.name}...`);

            let pathFileDest = path.resolve(this.options.path, 'libraries', fileInfo.path)
            if (!fs.existsSync(pathFileDest)) fs.mkdirSync(pathFileDest, { recursive: true });

            let file: any = await getFileFromArchive(pathInstaller, profile.filePath)
            fs.writeFileSync(`${pathFileDest}/${fileInfo.name}`, file, { mode: 0o777 })
        } else if (profile.path) {
            let fileInfo = getPathLibraries(profile.path)
            let listFile: any = await getFileFromArchive(pathInstaller, null, `maven/${fileInfo.path}`)

            await Promise.all(
                listFile.map(async (files: any) => {
                    let fileName = files.split('/')
                    this.emit('extract', `Extracting ${fileName[fileName.length - 1]}...`);
                    let file: any = await getFileFromArchive(pathInstaller, files)
                    let pathFileDest = path.resolve(this.options.path, 'libraries', fileInfo.path)
                    if (!fs.existsSync(pathFileDest)) fs.mkdirSync(pathFileDest, { recursive: true });
                    fs.writeFileSync(`${pathFileDest}/${fileName[fileName.length - 1]}`, file, { mode: 0o777 })
                })
            );
        } else {
            skipForgeFilter = false
        }

        if (profile.processors?.length) {
            let universalPath = profile.libraries.find(v => {
                return (v.name || '').startsWith('net.minecraftforge:forge')
            })

            let client: any = await getFileFromArchive(pathInstaller, 'data/client.lzma');
            let fileInfo = getPathLibraries(profile.path || universalPath.name, '-clientdata', '.lzma')
            let pathFile = path.resolve(this.options.path, 'libraries', fileInfo.path)

            if (!fs.existsSync(pathFile)) fs.mkdirSync(pathFile, { recursive: true });
            fs.writeFileSync(`${pathFile}/${fileInfo.name}`, client, { mode: 0o777 })
            this.emit('extract', `Extracting ${fileInfo.name}...`);
        }

        return skipForgeFilter
    }

    async downloadLibraries(profile: any, skipForgeFilter: any) {
        let { libraries } = profile.version;
        let downloader = new download();
        let check = 0;
        let files: any = [];
        let size = 0;

        if (profile.install.libraries) libraries = libraries.concat(profile.install.libraries);

        libraries = libraries.filter((library, index, self) => index === self.findIndex(t => t.name === library.name))

        let skipForge = [
            'net.minecraftforge:forge:',
            'net.minecraftforge:minecraftforge:'
        ]

        for (let lib of libraries) {
            let natives = null;

            if (skipForgeFilter && skipForge.find(libs => lib.name.includes(libs))) {
                if (lib.downloads?.artifact?.url == "" || !lib.downloads?.artifact?.url) {
                    this.emit('check', check++, libraries.length, 'libraries');
                    continue;
                }
            }

            if (skipLibrary(lib)) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }

            if (lib.natives) {
                natives = lib.natives[Lib[process.platform]];
            }

            let file = {}
            let libInfo = getPathLibraries(lib.name, natives ? `-${natives}` : '');
            let pathLib = path.resolve(this.options.path, 'libraries', libInfo.path);
            let pathLibFile = path.resolve(pathLib, libInfo.name);

            if (!fs.existsSync(pathLibFile)) {
                let url
                let sizeFile = 0;
                let baseURL = natives ? `${libInfo.path}/` : `${libInfo.path}/${libInfo.name}`;
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

    async patchForge(profile: any) {
        if (profile?.processors?.length) {
            let patcher: any = new forgePatcher(this.options);
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

    async createProfile(id: any, pathInstaller: any) {
        let forgeFiles: any = await getFileFromArchive(pathInstaller)
        let minecraftJar: any = await getFileFromArchive(this.options.loader.config.minecraftJar)
        let data: any = await createZIP([...minecraftJar, ...forgeFiles], 'META-INF');

        let destination = path.resolve(this.options.path, 'versions', id);

        let profile = JSON.parse(fs.readFileSync(this.options.loader.config.minecraftJson, 'utf-8'))
        profile.libraries = [];
        profile.id = id;
        profile.isOldForge = true;
        profile.jarPath = path.resolve(destination, `${id}.jar`);

        if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.resolve(destination, `${id}.jar`), data, { mode: 0o777 });
        return profile
    }
}