const fetch = require('node-fetch');

class assets {
    constructor(assetIndex) {
        this.assetIndex = assetIndex;
    }

    async Getassets() {
        let assets = [];
        let data = await fetch(this.assetIndex).then(res => res.json());
        for (let asset of Object.values(data.objects)) {
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: "FILE",
                path: `assets/objects/${asset.hash.substring(0, 2)}/${asset.hash}`,
                url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`
            });
        }
        return { assetIndex: data, assets: assets };
    }
}

module.exports = assets;