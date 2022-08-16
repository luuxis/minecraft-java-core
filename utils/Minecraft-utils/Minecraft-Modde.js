/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

const moddeFiles = require('./Modde/Minecraft-Modde-Files');
const moddeJson = require('./Modde/Minecraft-Modde-Json');

module.exports = class modde {
    constructor(config) {
        this.config = config;
    }

    async filesGameModde() {
        if(this.config.modde) return new moddeFiles(this.config).filesGameModde();
        else return [];
    }

    async jsonModde() {
        if(this.config.modde) return new moddeJson(this.config).jsonModde(await this.filesGameModde());
        else return false;
    }
}