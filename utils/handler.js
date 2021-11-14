const fetch = require('node-fetch');
const os = require('os');
const crypto = require('crypto');
const fs = require('fs');

let MojangLib = {win32: "windows", darwin: "osx", linux: "linux"};
let Arch = {x32: "32", x64: "64", arm: "32", arm64: "64"};

async function getJSONVersion(version_id){
  let jsonversion = (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json").then(res => res.json())).versions.find(ver => ver.id == version_id);
  if (!jsonversion) {
    console.log(`version ${version_id} not found`);
    return;
  }
  let Version = await fetch(jsonversion.url).then(res => res.json());
  Version.custom = await fetch("http://localhost/").then(res => res.json());
  
  let libraries = await getAllLibrairies(Version);
  let assets = await getAllAssets(Version);
  let assetsjson = {
    path: `assets/indexes/${version_id}.json`,
    type: "CFILE",
    content: JSON.stringify(assets.json)
  }
  assets = assets.assets;
  
  
  let clientjar = Version.downloads.client;
  assets.push({
    sha1: clientjar.sha1,
    size: clientjar.size,
    path: `versions/${version_id}/${version_id}.jar`,
    type: "LIBRARY",
    url: clientjar.url
  })
  
  
  if(Version.logging){
    let logging = Version.logging.client.file;
    assets.push({
      sha1: logging.sha1,
      size: logging.size,
      path: `assets/log_configs/${logging.id}`,
      type: "LOG",
      url: logging.url
    })
  }

  if(Version.custom){
    let custom = Version.custom;
    custom.forEach(url => {
      assets.push({
        sha1: url.sha1,
        size: url.size,
        path: url.path,
        type: "CUSTOM",
        url: url.url
      })
    });
    
    
  }
  return [assetsjson].concat(libraries).concat(assets);
}







async function getAllLibrairies(jsonversion){
    let libraries = [];
    for(let lib of jsonversion.libraries){
      let artifact;
      let type = "LIBRARY"
      if(lib.natives){
        let classifiers = lib.downloads.classifiers;
        let native = lib.natives[MojangLib[process.platform]];
        if(!native) native = lib.natives[process.platform];
        type = "NATIVE";
        if(native) artifact = classifiers[native.replace("${arch}", Arch[os.arch()])];
        else continue;
      } else {
        artifact = lib.downloads.artifact;
      }
      if(!artifact) continue;
      libraries.push({
        sha1: artifact.sha1,
        size: artifact.size,
        path: `libraries/${artifact.path}`,
        type: type,
        url: artifact.url
      });
    }
    return libraries;
  }

  async function getAllAssets(jsonversion){
    let assetsjson = await fetch(jsonversion.assetIndex.url).then(res => res.json());
    let assets = [];
    for(let asset of Object.values(assetsjson.objects)){
      assets.push({
        sha1: asset.hash,
        size: asset.size,
        type: "FILE",
        path: `assets/objects/${asset.hash.substring(0, 2)}/${asset.hash}`,
        url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`
      });
    }
    return {json: assetsjson, assets};
  }


async function launch(bundle){

    let natives = bundle.filter(mod => mod.type == "NATIVE").map(mod => mod.path);
    let nativeFolder = `versions/1.7.10/natives`;
    if(!fs.existsSync(nativeFolder)) fs.mkdirSync(nativeFolder, { recursive: true, mode: 0o777 });

    for(let native of natives){
      console.log(`Extracting native ${native}`);
      let zip = new AdmZip(native);
      let entries = zip.getEntries();
      for(let entry of entries){
        if(entry.entryName.startsWith("META-INF")) continue;
        fs.writeFileSync(`${nativeFolder}/${entry.entryName}`, entry.getData(), { encoding: "utf8", mode: 0o755 });
        if(process.platform == "darwin" && (`${nativeFolder}/${entry.entryName}`.endsWith(".dylib") || `${nativeFolder}/${entry.entryName}`.endsWith(".jnilib"))){
          console.log(`Whitelisting from Apple Quarantine ${`${nativeFolder}/${entry.entryName}`}`);
          let id = String.fromCharCode.apply(null, execSync(`xattr -p com.apple.quarantine "${`${nativeFolder}/${entry.entryName}`}"`));
          execSync(`xattr -w com.apple.quarantine "${id.replace("0081;", "00c1;")}" "${`${nativeFolder}/${entry.entryName}`}"`);
        }
      }
    }    
}







async function getJSONAsset(ver){
    fs.writeFileSync(`config.json`, JSON.stringify(await getJSONVersion(ver), true, 4), 'UTF-8')
    console.log(await getJSONVersion(ver));
}
getJSONAsset("1.12.2");



