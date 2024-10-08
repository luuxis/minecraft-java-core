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

export default class JavaDownloader extends EventEmitter {
    options: any;
    constructor(options: any) {
        super();
        this.options = options;
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
        let files = [];

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
        const majorVersion = versionDownload || jsonversion.javaVersion?.majorVersion || 8;
        const javaVersionURL = `https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot`;
        const javaVersions = await nodeFetch(javaVersionURL).then(res => res.json());

        const { platform, arch } = this.getPlatformArch();

        const java = javaVersions.find(({ binary }) =>
            binary.image_type === this.options.java.type &&
            binary.architecture === arch &&
            binary.os === platform
        );

        if (!java) return { error: true, message: "No Java found" };

        const { checksum, link: url, name: fileName } = java.binary.package;
        const pathFolder = path.resolve(this.options.path, `runtime/jre-${majorVersion}`);
        const filePath = path.join(pathFolder, fileName);

        await this.verifyAndDownloadFile({ filePath, pathFolder, fileName, url, checksum });

        let javaPath = path.join(pathFolder, 'bin', 'java');
        if (platform === 'mac') javaPath = path.join(pathFolder, 'Contents', 'Home', 'bin', 'java');

        if (!fs.existsSync(javaPath)) {
            await this.extract(filePath, pathFolder);
            fs.unlinkSync(filePath);

            if (filePath.endsWith('.tar.gz')) {
                const tarFilePath = filePath.replace('.gz', '');
                await this.extract(tarFilePath, pathFolder);
                if (fs.existsSync(tarFilePath)) fs.unlinkSync(tarFilePath);
            }

            const extractedItems = fs.readdirSync(pathFolder);
            if (extractedItems.length === 1) {
                const extractedFolder = path.join(pathFolder, extractedItems[0]);
                const stat = fs.statSync(extractedFolder);
                if (stat.isDirectory()) {
                    const subItems = fs.readdirSync(extractedFolder);
                    for (const item of subItems) {
                        const srcPath = path.join(extractedFolder, item);
                        const destPath = path.join(pathFolder, item);
                        fs.renameSync(srcPath, destPath);
                    }
                    fs.rmdirSync(extractedFolder);
                }
            }

            if (platform !== 'windows') fs.chmodSync(javaPath, 0o755);
        }

        return { files: [], path: javaPath };
    }

    getPlatformArch() {
        const platformMap = { win32: 'windows', darwin: 'mac', linux: 'linux' };
        const archMap = { x64: 'x64', ia32: 'x32', arm64: 'aarch64', arm: 'arm' };
        const platform = platformMap[os.platform()] || os.platform();
        let arch = archMap[os.arch()] || os.arch();

        if (os.platform() === 'darwin' && os.arch() === 'arm64' && this.options.intelEnabledMac) {
            arch = 'x64';
        }

        return { platform, arch };
    }

    async verifyAndDownloadFile({ filePath, pathFolder, fileName, url, checksum }) {
        if (fs.existsSync(filePath)) {
            const existingChecksum = await getFileHash(filePath, 'sha256');
            if (existingChecksum !== checksum) {
                fs.unlinkSync(filePath);
                fs.rmSync(pathFolder, { recursive: true, force: true });
            }
        }

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(pathFolder, { recursive: true });
            const download = new downloader();

            download.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });

            await download.downloadFile(url, pathFolder, fileName);
        }

        const downloadedChecksum = await getFileHash(filePath, 'sha256');
        if (downloadedChecksum !== checksum) {
            throw new Error("Java checksum failed");
        }
    }

    async extract(filePath: string, destPath: string) {
        if (os.platform() !== 'win32') fs.chmodSync(sevenBin.path7za, 0o755);

        await new Promise<void>((resolve, reject) => {
            const extract = Seven.extractFull(filePath, destPath, {
                $bin: sevenBin.path7za,
                recursive: true,
                $progress: true,
            });

            extract.on('end', () => resolve());
            extract.on('error', (err) => reject(err));
            extract.on('progress', (progress) => {
                if (progress.percent > 0) this.emit('extract', progress.percent);
            });
        });
    }
}