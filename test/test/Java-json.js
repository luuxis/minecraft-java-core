const os = require("os");
const fetch = require("node-fetch");
const fs = require('fs');
const crypto = require('crypto');


async function getJava(minecraftVersion){
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
        javaVersionsJson = await fetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0].manifest.url).then(res => res.json())
    } else if(os.platform() == "darwin"){
        javaVersionsJson = await fetch(javaVersionsJson[`mac-os`][jsonversion][0].manifest.url).then(res => res.json())
    } else if(os.platform() == "linux"){
        let arch = {x64: "linux", ia32: "linux-i386"}
        javaVersionsJson = await fetch(javaVersionsJson[`${arch[os.arch()]}`][jsonversion][0].manifest.url).then(res => res.json())
    } else {
        return console.log("OS not supported");
    }

    
    return Object.entries(javaVersionsJson)
}






async function checkSHA1(file, hash){
    const hex = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
    if(hex == hash) return true;
    return false;
}

async function test(ver){
    //console.log(os.arch())
    fs.writeFileSync(`all.json`, JSON.stringify(await getJava(ver), true, 4), 'UTF-8')
    console.log(await getJava(ver))

}

test("1.5")