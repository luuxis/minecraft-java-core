/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import os from 'os';
import nodeFetch from 'node-fetch';
import path from 'path';

export default class JavaDownloader {
    options: any;

    constructor(options: any) {
        this.options = options;
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

        if (!osArchMapping)  return { error: true, message: 'OS not supported' };

        const archOs: any = osArchMapping[arch];
        const javaVersionsJson = await nodeFetch(`https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json`).then(res => res.json());

        const versionName = javaVersionsJson[archOs]?.[javaVersion]?.[0]?.version?.name;

        if (!versionName) return { error: true, message: 'Java not found' };

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
}