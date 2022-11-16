/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
const fs = require('fs');
const child = require("child_process");

module.exports = class start {
    constructor(config, args, json) {
        this.config = config;
        this.args = args;
        this.json = json;
    }

    start(java) {
        if(this.isold()) this.copyAssets()
        return child.spawn(java, this.args, { cwd: this.config.path, detached: this.config.detached })
    }

    copyAssets() {
        let legacyDirectory = `${this.config.path}/resources`;
        let assets = JSON.parse(fs.readFileSync(`${this.config.path}/assets/indexes/${this.json.assets}.json`));

        for (let [file, hash] of Object.entries(assets.objects)) {
            let Hash = hash.hash;
            let Subhash = Hash.substring(0, 2)
            let SubAsset = `${this.config.path}/assets/objects/${Subhash}`
            let legacyAsset = file.split('/')
            legacyAsset.pop()

            if (!fs.existsSync(`${legacyDirectory}/${legacyAsset.join('/')}`)) {
                fs.mkdirSync(`${legacyDirectory}/${legacyAsset.join('/')}`, { recursive: true })
            }

            if (!fs.existsSync(`${legacyDirectory}/${file}`)) {
                fs.copyFileSync(`${SubAsset}/${Hash}`, `${legacyDirectory}/${file}`)
            }
        }
    }

    isold() {
        return this.json.assets === 'legacy' || this.json.assets === 'pre-1.6'
    }
}