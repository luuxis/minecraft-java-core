/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import nodeFetch from 'node-fetch';
import fs from 'fs';

export default class MinecraftAssets {
    assetIndex: any;
    options: any;
    constructor(options: any) {
        this.options = options;
    }

    async GetAssets(json: any) {
        this.assetIndex = json.assetIndex;

        let assets = [];
        let data = await nodeFetch(this.assetIndex.url).then(res => res.json());

        assets.push({
            type: "CFILE",
            path: `assets/indexes/${this.assetIndex.id}.json`,
            content: JSON.stringify(data)
        });

        data = Object.values(data.objects);

        for (let asset of data) {
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: "Assets",
                path: `assets/objects/${asset.hash.substring(0, 2)}/${asset.hash}`,
                url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`
            });
        }
        return assets
    }

    copyAssets(json: any) {
        let legacyDirectory: string = `${this.options.path}/resources`;
        if (this.options.instance) legacyDirectory = `${this.options.path}/instances/${this.options.instance}/resources`;
        let pathAssets = `${this.options.path}/assets/indexes/${json.assets}.json`;
        if (!fs.existsSync(pathAssets)) return;
        let assets = JSON.parse(fs.readFileSync(pathAssets, 'utf-8'));
        assets = Object.entries(assets.objects);

        for (let [file, hash] of assets) {
            let Hash = hash.hash;
            let Subhash = Hash.substring(0, 2)
            let SubAsset = `${this.options.path}/assets/objects/${Subhash}`
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
}