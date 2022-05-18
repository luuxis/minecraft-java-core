'use strict';
// import librairies nodejs
const fs = require('fs');
const crypto = require('crypto');

class Verify {
    constructor(bundle, config) {
        this.bundle = bundle;
        this.config = config;
    }

    async checkBundle() {
        let bundle = this.bundle;
        let todownload = [];

        for (let file of bundle) {
            if (file.path == undefined) continue;
            file.path = `${this.config.path}/${file.path}`
            file.folder = file.path.split("/").slice(0, -1).join("/");

            if (fs.existsSync(file.path)) {
                if (this.config.verify) {
                    if (this.config.ignored.find(ignored => ignored == file.path.split("/").slice(-1)[0])) continue
                }
                if (file.sha1) {
                    if (!(await this.checkSHA1(file.path, file.sha1))) todownload.push(file);
                }
            } else todownload.push(file);
        }
        return todownload;
    }

    async checkSHA1(file, hash) {
        const hex = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
        if (hex == hash) return true;
        return false;
    }
}
module.exports = Verify;