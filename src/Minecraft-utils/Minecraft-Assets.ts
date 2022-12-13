/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import nodeFetch from 'node-fetch';

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
}