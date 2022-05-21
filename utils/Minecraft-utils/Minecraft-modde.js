'use strict';

const moddeFiles = require('./modde/Minecraft-modde-files');
const moddeJson = require('./modde/Minecraft-modde-json');

class modde {
    constructor(config) {
        this.config = config;
    }

    async filesGameModde() {
        return new moddeFiles(this.config).filesGameModde();
    }

    async jsonModde() {
        return new moddeJson(this.config).jsonModde(await this.filesGameModde());
    }
}
module.exports = modde;