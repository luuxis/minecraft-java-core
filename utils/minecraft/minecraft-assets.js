class assets {
    constructor(assetIndex) {
        this.assetIndex = assetIndex;
    }

    async Getassets() {
        let assets = [];
        for (let asset of Object.values(this.assetIndex.objects)) {
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: "FILE",
                path: `assets/objects/${asset.hash.substring(0, 2)}/${asset.hash}`,
                url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`
            });
        }
        return assets;
    }
}

module.exports = assets;