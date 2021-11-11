const os = require("os");
const fetch = require("node-fetch")

let Arch = {x32: "x86", x64: "x64"};

let ver = {8: "jre-legacy", 16: "java-runtime-alpha"};


async function getManifestJSON(){
    let platformjson = await fetch("https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json").then(res => res.json())
    return await fetch(platformjson[`windows-x64`][`jre-legacy`][0].manifest.url).then(res => res.json());
}

async function cc(){
    let manifest = Object.entries((await getManifestJSON()).files);

    let java = manifest.find(file => file[0].endsWith(process.platform == "win32" ? "bin/javaw.exe" : "bin/java"))[0];
    let toDelete = java.replace(process.platform == "win32" ? "bin/javaw.exe" : "bin/java", "");

    let files = [];
    for(let [path, info] of manifest){
        if(info.type == "directory") continue;
        let file = {};
        file.path = `runtime/java/${path.replace(toDelete, "").replace("", "")}`;
        file.FilesName = path.split("/")[path.split("/").length-1]
        file.size = info.downloads.raw.size;
        file.sha1 = info.downloads.raw.sha1;
        file.url = info.downloads.raw.url;
        files.push(file);
    }

    console.log(files)
}

// console.log(process.platform)
// console.log(os.arch())
cc()




















// const { handler } = require('../index.js');

// handler.getData("http://localhost", "./mc")