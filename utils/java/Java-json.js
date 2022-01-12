const os = require("os");
const fetch = require("node-fetch");

module.exports.GetJsonJava = async function (minecraftVersion) {
    let files = [];
    let javaVersionsJson = await fetch("https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json").then(res => res.json())
    let jsonversion = (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json").then(res => res.json())).versions.find(ver => ver.id == minecraftVersion);

    if (!jsonversion) {
        return console.log(`version ${minecraftVersion} not found`);
    } else {
        jsonversion = await fetch(jsonversion.url).then(res => res.json())
        if(!jsonversion.javaVersion){
            jsonversion = "jre-legacy"
        } else {
            jsonversion = jsonversion.javaVersion.component
        }
    }

    if(os.platform() == "win32"){
        let arch = {x64: "windows-x64", ia32: "windows-x86"}
        javaVersionsJson = Object.entries((await fetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0].manifest.url).then(res => res.json())).files)
    } else if(os.platform() == "darwin"){
        javaVersionsJson = Object.entries((await fetch(javaVersionsJson[`mac-os`][jsonversion][0].manifest.url).then(res => res.json())).files)
    } else if(os.platform() == "linux"){
        let arch = {x64: "linux", ia32: "linux-i386"}
        javaVersionsJson = Object.entries((await fetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0].manifest.url).then(res => res.json())).files)
    } else {
        return console.log("OS not supported");
    }
    
    for(let [path, info] of javaVersionsJson){
        if(info.type == "directory") continue;
        if(info.downloads === undefined) continue;
        let file = {};
        if(info.downloads){
            file.path = `runtime/${jsonversion}/${path}`;
            file.sha1 = info.downloads.raw.sha1;
            file.size = info.downloads.raw.size;
            file.type = "JAVA"
            file.url = info.downloads.raw.url;
            files.push(file);
        }
    }
    return {files: files, version: jsonversion};
}