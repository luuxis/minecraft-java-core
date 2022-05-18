'use strict';
const os = require('os');

let MojangLib = { win32: "windows", darwin: "osx", linux: "linux" };
let Arch = { x32: "32", x64: "64", arm: "32", arm64: "64" };

class Libraries {
    constructor(version) {
        this.version = version;
    }

    async Getlibraries() {
        let libraries = [];

        for (let lib of this.version.libraries) {
            let artifact;
            let type = "LIBRARY";

            if (lib.natives) {
                let classifiers = lib.downloads.classifiers;
                let native = lib.natives[MojangLib[process.platform]];
                if (!native) native = lib.natives[process.platform];
                type = "NATIVE";
                if (native) artifact = classifiers[native.replace("${arch}", Arch[os.arch()])];
                else continue;
            } else {
                if (lib.rules && lib.rules[0].os) {
                    if (lib.rules[0].os.name !== "") continue;
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

        let clientjar = this.version.downloads.client;
        libraries.push({
            sha1: clientjar.sha1,
            size: clientjar.size,
            path: `versions/${this.version.id}/${this.version.id}.jar`,
            type: "JARVERSION",
            url: clientjar.url
        });
        return libraries;
    }
}

module.exports = Libraries;