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
        if (this.options.java.version) return await this.getJavaOther(jsonversion, this.options.java.version);
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

        if (!osArchMapping) return await this.getJavaOther(jsonversion);

        const archOs: any = osArchMapping[arch];
        const javaVersionsJson = await nodeFetch(`https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json`).then(res => res.json());

        const versionName = javaVersionsJson[archOs]?.[javaVersion]?.[0]?.version?.name;

        if (!versionName) return await this.getJavaOther(jsonversion);

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

    async getJavaOther(jsonversion: any, versionDownload?: any) {
        const majorVersion = jsonversion.javaVersion?.component || versionDownload ? versionDownload : '8';
        const javaVersionURL = `https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot`;
        const javaVersions = await nodeFetch(javaVersionURL).then(res => res.json());
        const { platform, arch } = this.getPlatformArch();

        const java = javaVersions.find(file =>
            file.binary.image_type === this.options.java.type &&
            file.binary.architecture === arch &&
            file.binary.os === platform);

        if (!java) return { error: true, message: "No Java found" };

        const { checksum, link: url, name: fileName } = java.binary.package;
        const { release_name: version } = java;
        const image_type = java.binary.image_type;
        const pathFolder = path.resolve(this.options.path, `runtime/jre-${majorVersion}`);
        const filePath = path.resolve(pathFolder, fileName);

        await this.verifyAndDownloadFile({
            filePath,
            pathFolder,
            fileName,
            url,
            checksum,
            pathExtract: `${pathFolder}/${version}${image_type === 'jre' ? '-jre' : ''}`
        });

        let javaPath = `${pathFolder}/${version}${image_type === 'jre' ? '-jre' : ''}/bin/java`;
        if (platform == 'mac') javaPath = `${pathFolder}/${version}${image_type === 'jre' ? '-jre' : ''}/Contents/Home/bin/java`;

        if (!fs.existsSync(javaPath)) {
            await this.extract(filePath, pathFolder);
            await this.extract(filePath.replace('.gz', ''), pathFolder);
            if (fs.existsSync(filePath.replace('.gz', ''))) fs.unlinkSync(filePath.replace('.gz', ''));
            if (platform !== 'windows') fs.chmodSync(javaPath, 0o755);
        }

        return {
            files: [],
            path: javaPath,
        };
    }

    getPlatformArch() {
        return {
            platform: {
                win32: 'windows',
                darwin: 'mac',
                linux: 'linux'
            }[os.platform()],
            arch: {
                x64: 'x64',
                ia32: 'x32',
                arm64: this.options.intelEnabledMac && os.platform() == 'darwin' ? "x64" : "aarch64",
                arm: 'arm'
            }[os.arch()]
        };
    }

    async verifyAndDownloadFile({ filePath, pathFolder, fileName, url, checksum, pathExtract }) {
        if (fs.existsSync(filePath)) {
            if (await getFileHash(filePath, 'sha256') !== checksum) {
                fs.unlinkSync(filePath);
                fs.rmdirSync(pathExtract, { recursive: true });
            }
        }

        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(pathFolder)) fs.mkdirSync(pathFolder, { recursive: true });
            let download = new downloader();

            download.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });

            await download.downloadFile(url, pathFolder, fileName);
        }

        if (await getFileHash(filePath, 'sha256') !== checksum) {
            return { error: true, message: "Java checksum failed" };
        }

    }

    extract(filePath, destPath) {
        return new Promise((resolve, reject) => {
            const extract = Seven.extractFull(filePath, destPath, {
                $bin: sevenBin.path7za,
                recursive: true,
                $progress: true,
            })
            extract.on('end', () => {
                resolve(true)
            })
            extract.on('error', (err) => {
                reject(err)
            })

            extract.on('progress', (progress) => {
                if (progress.percent > 0) this.emit('extract', progress.percent);
            })
        })
    }
}