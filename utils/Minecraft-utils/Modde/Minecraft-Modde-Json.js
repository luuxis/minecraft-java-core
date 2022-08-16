/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
const fs = require('fs');

module.exports = class moddeFiles {
    constructor(config) {
        this.config = config;
    }

    async jsonModde(files) {
        let pathModdejson = files.filter(file => file.type == 'VERIONSCUSTOM').map(file => file.path)[0];
        let json = fs.readFileSync(`${this.config.path}/${pathModdejson}`, 'utf8');
        return JSON.parse(json)
    }
}