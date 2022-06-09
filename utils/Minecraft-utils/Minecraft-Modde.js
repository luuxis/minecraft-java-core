'use strict';

const moddeFiles = require('./Modde/Minecraft-Modde-Files');
const moddeJson = require('./Modde/Minecraft-Modde-Json');

class modde {
    constructor(config) {
        this.config = config;
    }

    async filesGameModde() {
        if(this.config.custom) return new moddeFiles(this.config).filesGameModde();
        else return [];
    }

    async jsonModde() {
        if(this.config.custom) return new moddeJson(this.config).jsonModde(await this.filesGameModde());
        else return false;
    }
}
module.exports = modde;