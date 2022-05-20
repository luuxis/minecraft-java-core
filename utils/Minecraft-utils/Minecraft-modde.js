'use strict';
const fetch = require('node-fetch');
const fs = require('fs');

class modde {
    constructor(config, files) {
        this.config = config;
        this.files = files;
    }

    async filesGameModde() {
        if (this.config.url == null) {
            return [];
        }
        let json = await fetch(this.config.url).then(res => res.json());
        let files = [];
        for (let modde of json) {
            if (!modde.url) continue;
            let file = {}
            file.path = modde.path,
            file.size = modde.size,
            file.sha1 = modde.sha1,
            file.url = modde.url,
            file.type = modde.type
            files.push(file);
        }
        return files
    }

    GetArgs() {
        let moddeJson = this.files.filter(file => file.type == 'VERIONSCUSTOM').map(file => file.path)[0];
        let moddeArguments = JSON.parse(fs.readFileSync(moddeJson, 'utf8')).arguments;
        return moddeArguments;
    }

}
module.exports = modde;