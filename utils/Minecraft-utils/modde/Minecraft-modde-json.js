'use strict';
const fs = require('fs');

class moddeFiles {
    constructor(config) {
        this.config = config;
    }

    async jsonModde(files) {
        let pathModdejson = files.filter(file => file.type == 'VERIONSCUSTOM').map(file => file.path)[0];
        console.log(pathModdejson);

        let json = fs.readFileSync(`${this.config.path}/${pathModdejson}`, 'utf8');
        return json
    }
}
module.exports = moddeFiles;