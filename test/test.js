const JsonVersion = require('../utils/minecraft/Minecraft-Json.js');
const assetsVertion = require('../utils/minecraft/Minecraft-assets.js');
const librariesVertion = require('../utils/minecraft/minecraft-libraries');
const fetch = require('node-fetch')
const fs = require('fs')

async function test_json() {
    let data = await new JsonVersion('latest_snapshot').GetInfoVersion();
    let version = await fetch(data.url).then(data => data.json())
    let assets = await fetch(version.assetIndex.url).then(data => data.json())
    let assetDownload = await new assetsVertion(assets).Getassets();
    let librariesDownload = await new librariesVertion(version).Getlibraries();
    // console.log(librariesDownload);
    
    fs.writeFileSync('latest_snapshot_lib.json', JSON.stringify(librariesDownload, null, 4))

}
test_json();