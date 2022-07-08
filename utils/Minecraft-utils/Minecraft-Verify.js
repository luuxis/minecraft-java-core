'use strict';
// import librairies nodejs
const fs = require('fs');
const crypto = require('crypto');

module.exports = class Verify {
    constructor(bundle, config) {
        this.bundle = bundle;
        this.config = config;
    }

    async checkBundle() {
        let bundle = this.bundle;
        let todownload = [];

        for (let file of bundle) {
            if (!file.path) continue;
            file.path = `${this.config.path}/${file.path}`
            file.folder = file.path.split("/").slice(0, -1).join("/");

            if (file.type == "CFILE") {
                if (!fs.existsSync(file.folder)) fs.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
                fs.writeFileSync(file.path, file.content, { encoding: "utf8", mode: 0o755 });
                continue;
            }

            if (fs.existsSync(file.path)) {
                if (this.config.ignored.find(ignored => ignored == file.path.split("/").slice(-1)[0])) continue                
                if (file.sha1) if (!(await this.checkSHA1(file.path, file.sha1))) todownload.push(file);
            } else todownload.push(file);
        }
        return todownload;
    }

    async checkSHA1(file, hash) {
        const hex = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
        if (hex == hash) return true;
        return false;
    }

    async removeNonIgnoredFiles() {
        let files = this.getFiles(this.config.path);
        let ignoredfiles = []

        for (let file of this.config.ignored) {
            file = (`${this.config.path}/${file}`)
            if (fs.existsSync(file)) {
                if (fs.statSync(file).isDirectory()) {
                    ignoredfiles.push(...this.getFiles(file));
                } else if (fs.statSync(file).isFile()) {
                    ignoredfiles.push(file);
                }
            }
        }

        ignoredfiles.forEach(file => this.config.ignored.push((file)));
        this.bundle.forEach(file => ignoredfiles.push((file.path)));
        files = files.filter(file => ignoredfiles.indexOf(file) < 0);

        for (let file of files) {
            try {
                if (fs.statSync(file).isDirectory()) {
                    fs.rmdirSync(file);
                } else {
                    fs.unlinkSync(file);
                    let folder = file.split("/").slice(0, -1).join("/");
                    while (true) {
                        if (folder == this.config.path) break;
                        let content = fs.readdirSync(folder);
                        if (content.length == 0) fs.rmdirSync(folder);
                        folder = folder.split("/").slice(0, -1).join("/");
                    }
                }
            } catch (e) {
                continue;
            }
        }
    }

    getFiles(path, file = []) {
        if (fs.existsSync(path)) {
            let files = fs.readdirSync(path);
            if (files.length == 0) file.push(path);
            for (let i in files) {
                let name = `${path}/${files[i]}`;
                if (fs.statSync(name).isDirectory()) this.getFiles(name, file);
                else file.push(name);
            }
        }
        return file;
    }

    async getTotalSize(bundle) {
        let todownload = 0;
        for (let file of bundle) {
            todownload += file.size;
        }
        return todownload;
    }
}