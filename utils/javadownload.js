const os = require("os");
const fetch = require("node-fetch");


async function getManifestJSON(java_ver){
  let ver = {8: "jre-legacy", 16: "java-runtime-alpha"};
  let platformjson = await fetch("https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json").then(res => res.json())
  return await fetch(platformjson["linux"][ver[java_ver]][0].manifest.url).then(res => res.json());
}

async function JavaFiles(java_ver){
  let manifest = Object.entries((await getManifestJSON(java_ver)).files);

  let files = [];
  for(let [path, info] of manifest){
    if(info.type == "directory") continue;
    let file = {};
    file.path = path.split("/").slice(0, -1).join("/");
    file.FilesName = path.split('/').pop();
    if(info.downloads){
      file.sha1 = info.downloads.raw.sha1;
      file.size = info.downloads.raw.size;
      file.url = info.downloads.raw.url;
    }
    files.push(file);
  }

  console.log(files);
  return files;
}

//console.log(os.arch())


 


