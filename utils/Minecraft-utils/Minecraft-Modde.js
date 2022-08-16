/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

const nodeFetch = require('node-fetch');

module.exports = class modde {
    constructor(config) {
        this.config = config;
    }

    async filesGameModde() {
        if (this.config.modde) {
            if (this.config.url == null) return [];
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
        } else return [];
    }

    async jsonModde() {
        if (this.config.modde) {
            let files = await this.filesGameModde();
            let urlModdejson = files.filter(file => file.type == 'VERIONSCUSTOM').map(file => file.url)[0];
            let jsonModde = await nodeFetch(urlModdejson);
            return jsonModde.json();
        } else return false;
    }

    async GameModde() {
        return {
            gameModdeFiles: await this.filesGameModde(),
            gameModdeJson: await this.jsonModde()
        }
    }
}