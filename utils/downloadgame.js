const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');


async function getJSONVersion(version_id){
    let jsonversion = (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json").then(res => res.json())).versions.find(ver => ver.id == version_id);
    if (!jsonversion) {
        return console.log(`version ${version_id} not found`);
    }
    return await fetch(jsonversion.url).then(res => res.json());
  }


async function getJSONAsset(){
    console.log(await getJSONVersion("1.14.6"));
}
getJSONAsset();
