const fetch = require('node-fetch');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const AdmZip = require('adm-zip');
const fs = require('fs');

let MojangLib = {win32: "windows", darwin: "osx", linux: "linux"};
let Arch = {x32: "32", x64: "64", arm: "32", arm64: "64"};









async function getJSONAsset(ver){
  fs.writeFileSync(`config.json`, JSON.stringify(await checkBundle("poiuytrdklkuytrdsdfghjkiuytrezsdfghjoiuytresdfghiuytresdfutr",ver), true, 4), 'UTF-8')
  //console.log(await checkBundle(ver));
  //await launch(await getJSONVersion(ver));
}