/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import os from 'os';
import nodeFetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';
import Seven from 'node-7z';
import sevenBin from '7zip-bin'

import { getFileHash } from '../utils/Index.js';
import downloader from '../utils/Downloader.js';

export default class JavaDownloader {
    options: any;
    on: any;
    emit: any;

    constructor(options: any) {
        this.options = options;
        this.on = EventEmitter.prototype.on;
        this.emit = EventEmitter.prototype.emit;
    }

    async getJavaFiles(jsonversion: any) {
        const archMapping = {
            win32: { x64: 'windows-x64', ia32: 'windows-x86', arm64: 'windows-arm64' },
            darwin: { x64: 'mac-os', arm64: this.options.intelEnabledMac ? "mac-os" : "mac-os-arm64" },
            linux: { x64: 'linux', ia32: 'linux-i386' }
        };

        const osPlatform = os.platform();
        const arch = os.arch();
        const osArchMapping = archMapping[osPlatform];
        const javaVersion = jsonversion.javaVersion?.component || 'jre-legacy';
        let files = []

        if (!osArchMapping) return await this.getJavaFilesArm64(jsonversion);

        const archOs: any = osArchMapping[arch];
        const javaVersionsJson = await nodeFetch(`https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json`).then(res => res.json());

        const versionName = javaVersionsJson[archOs]?.[javaVersion]?.[0]?.version?.name;

        if (!versionName) return await this.getJavaFilesArm64(jsonversion);

        const manifestUrl = javaVersionsJson[archOs][javaVersion][0]?.manifest?.url;
        const manifest = await nodeFetch(manifestUrl).then(res => res.json());
        const javaFiles: any = Object.entries(manifest.files);

        const java = javaFiles.find(([path]) => path.endsWith(process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java'))[0];
        const toDelete = java.replace(process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java', '');

        for (let [path, info] of javaFiles) {
            if (info.type == "directory") continue;
            if (!info.downloads) continue;
            let file: any = {};
            file.path = `runtime/jre-${versionName}-${archOs}/${path.replace(toDelete, "")}`;
            file.executable = info.executable;
            file.sha1 = info.downloads.raw.sha1;
            file.size = info.downloads.raw.size;
            file.url = info.downloads.raw.url;
            file.type = "Java";
            files.push(file);
        }

        return {
            files,
            path: path.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}/bin/java`),
        };
    }

    async getJavaFilesArm64(jsonversion: any) {
        const majorVersion = jsonversion.javaVersion?.majorVersion || '8';
        const javaVersion = `https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot`
        const javaVersionsJson = await nodeFetch(javaVersion).then(res => res.json());

        const java = javaVersionsJson.find((file: any) => {
            if (file.binary.image_type === 'jre') {
                if (file.binary.architecture === (os.arch() === 'x64' ? 'x64' : 'aarch64')) {
                    if (file.binary.os === os.platform()) {
                        return true;
                    }
                }
            }
        });

        if (!java) return { error: true, message: "No Java found" };

        const checksum = java.binary.package.checksum;
        const url = java.binary.package.link;
        const fileName = java.binary.package.name;
        const version = java.release_name;
        const image_type = java.binary.image_type;
        const pathFolder = path.resolve(this.options.path, `runtime/jre-${majorVersion}`);
        const filePath = path.resolve(this.options.path, `runtime/jre-${majorVersion}/${fileName}`);

        if (fs.existsSync(filePath)) {
            if (await getFileHash(filePath, 'sha256') !== checksum) fs.unlinkSync(filePath);
        }

        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(pathFolder)) fs.mkdirSync(pathFolder, { recursive: true });
            let download = new downloader();

            download.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });

            await download.downloadFile(url, pathFolder, fileName);
        }

        if (await getFileHash(filePath, 'sha256') !== checksum) return { error: true, message: "Java checksum failed" };

        // extract file tar.
        await this.tarExtract(filePath, pathFolder);
        console.log("Java extracted");

        return {
            files: [],
            path: `${pathFolder}/${version}-${image_type}/bin/java`,
        };
    }

   async tarExtract(archiveFilePath: string, extractionPath: string) {
        return new Promise((resolve, reject) => {
            if (process.platform !== 'win32') fs.chmodSync(sevenBin.path7za, '755');
            const myStream = Seven.extract(archiveFilePath, extractionPath, {
                $progress: true,
                $bin: sevenBin.path7za,
                recursive: true
            })
    
            myStream.on('end', () => resolve);
            myStream.on('progress', (progress: any) => console.log(progress) )
            myStream.on('error', (err: any) => reject(err));
        });
    }
}