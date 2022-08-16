/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
const fs = require('fs');
const nodeFetch = require('node-fetch');

module.exports = class moddeFiles {
    constructor(config) {
        this.config = config;
    }

    async jsonModde(files) {
        let urlModdejson = files.filter(file => file.type == 'VERIONSCUSTOM').map(file => file.url)[0];
        let jsonModde = await nodeFetch(urlModdejson);
        return jsonModde.json();
    }
}