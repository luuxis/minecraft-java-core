'use strict';
const fetch = require('node-fetch');

class Json {
    constructor(version) {
        this.version = version;
    }

    async GetInfoVersion() {
        let data = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
        data = await data.json();

        if (this.version == 'latest_release') {
            this.version = data.latest.release;
        } else if (this.version == 'latest_snapshot') {
            this.version = data.latest.snapshot;
        }
        
        data = data.versions.find(v => v.id === this.version);

        if (!data) {
            return {
                error: true,
                message: `version ${this.version} not found`
            };
        }
        return data;
    }
}

module.exports = Json;