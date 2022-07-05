'use strict';
const nodeFetch = require("node-fetch");

class Json {
    constructor(version) {
        this.version = version;
    }

    async GetInfoVersion() {
        let data = await nodeFetch(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json?_t=${new Date().toISOString()}`);
        data = await data.json();

        if (this.version == 'latest_release' || this.version == 'r' || this.version == 'lr') {
            this.version = data.latest.release;
        } else if (this.version == 'latest_snapshot' || this.version == 's' || this.version == 'ls') {
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