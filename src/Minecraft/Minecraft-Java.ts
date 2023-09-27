/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import os from 'os';
import nodeFetch from 'node-fetch';
import path from 'path';

export default class java {
    options: any;
    constructor(options: any) {
        this.options = options;
    }

    async GetJsonJava(jsonversion: any) {
        let version: any;
        let files: any = [];
        let javaVersionsJson = await nodeFetch("https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json").then(res => res.json())

        if (!jsonversion.javaVersion) jsonversion = "jre-legacy"
        else jsonversion = jsonversion.javaVersion.component

        if (os.platform() == "win32") {
            let arch = { x64: "windows-x64", ia32: "windows-x86" }
            version = `jre-${javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0]?.version?.name}`
            if (version.includes('undefined')) return { error: true, message: "Java not found" };
            javaVersionsJson = Object.entries((await nodeFetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0]?.manifest?.url).then(res => res.json())).files)
        } else if (os.platform() == "darwin") {
            let arch = { x64: "mac-os", arm64: this.options.intelEnabledMac ?  "mac-os" : "mac-os-arm64" }
            version = `jre-${javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0]?.version?.name}`
            if (version.includes('undefined')) return { error: true, message: "Java not found" };
            javaVersionsJson = Object.entries((await nodeFetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0]?.manifest?.url).then(res => res.json())).files)
        } else if (os.platform() == "linux") {
            let arch = { x64: "linux", ia32: "linux-i386" }
            version = `jre-${javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0]?.version?.name}`
            if (version.includes('undefined')) return { error: true, message: "Java not found" };
            javaVersionsJson = Object.entries((await nodeFetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0]?.manifest?.url).then(res => res.json())).files)
        } else return console.log("OS not supported");

        if (!javaVersionsJson) return { error: true, message: "Java not found" };

        let java = javaVersionsJson.find(file => file[0].endsWith(process.platform == "win32" ? "bin/javaw.exe" : "bin/java"))[0];
        let toDelete = java.replace(process.platform == "win32" ? "bin/javaw.exe" : "bin/java", "");

        for (let [path, info] of javaVersionsJson) {
            if (info.type == "directory") continue;
            if (!info.downloads) continue;
            let file: any = {};
            file.path = `runtime/${version}-${process.platform}/${path.replace(toDelete, "")}`;
            file.executable = info.executable;
            file.sha1 = info.downloads.raw.sha1;
            file.size = info.downloads.raw.size;
            file.url = info.downloads.raw.url;
            file.type = "Java";
            files.push(file);
        }
        return {
            files: files,
            path: path.resolve(this.options.path, `runtime/${version}-${process.platform}/bin/java${process.platform == "win32" ? ".exe" : ""}`),
        };

    }
}