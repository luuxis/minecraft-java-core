'use strict';
const nodeFetch = require("node-fetch");

module.exports = class moddeFiles {
    constructor(config) {
        this.config = config;
    }

    async filesGameModde() {
        if (this.config.url == null) {
            return [];
        }
        let json = await nodeFetch(this.config.url).then(res => res.json());
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
        return files;
    }
}