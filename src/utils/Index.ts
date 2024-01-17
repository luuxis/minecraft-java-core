/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import crypto from 'crypto';
import fs from 'fs';
import admZip from 'adm-zip';

function getPathLibraries(main: any, nativeString?: any, forceExt?: any) {
    let libSplit = main.split(':')
    let fileName = libSplit[3] ? `${libSplit[2]}-${libSplit[3]}` : libSplit[2];
    let finalFileName = fileName.includes('@') ? fileName.replace('@', '.') : `${fileName}${nativeString || ''}${forceExt || '.jar'}`;
    let pathLib = `${libSplit[0].replace(/\./g, '/')}/${libSplit[1]}/${libSplit[2].split('@')[0]}`
    return {
        path: pathLib,
        name: `${libSplit[1]}-${finalFileName}`
    };
}

async function getFileHash(filePath: string, algorithm: string = 'sha1') {
    let shasum = crypto.createHash(algorithm);

    let file = fs.createReadStream(filePath);
    file.on('data', data => {
        shasum.update(data);
    });

    let hash = await new Promise(resolve => {
        file.on('end', () => {
            resolve(shasum.digest('hex'));
        });
    });
    return hash;
}

function isold(json: any) {
    return json.assets === 'legacy' || json.assets === 'pre-1.6'
}

function loader(type: string) {
    if (type === 'forge') {
        return {
            metaData: 'https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json',
            meta: 'https://files.minecraftforge.net/net/minecraftforge/forge/${build}/meta.json',
            promotions: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json',
            install: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-installer',
            universal: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-universal',
            client: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-client',
        }
    } else if (type === 'neoforge') {
        return {
            legacyMetaData: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/forge',
            metaData: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge',
            legacyInstall: 'https://maven.neoforged.net/net/neoforged/forge/${version}/forge-${version}-installer.jar',
            install: 'https://maven.neoforged.net/net/neoforged/neoforge/${version}/neoforge-${version}-installer.jar'
        }
    } else if (type === 'fabric') {
        return {
            metaData: 'https://meta.fabricmc.net/v2/versions',
            json: 'https://meta.fabricmc.net/v2/versions/loader/${version}/${build}/profile/json'
        }
    } else if (type === 'legacyfabric') {
        return {
            metaData: 'https://meta.legacyfabric.net/v2/versions',
            json: 'https://meta.legacyfabric.net/v2/versions/loader/${version}/${build}/profile/json'
        }
    } else if (type === 'quilt') {
        return {
            metaData: 'https://meta.quiltmc.org/v3/versions',
            json: 'https://meta.quiltmc.org/v3/versions/loader/${version}/${build}/profile/json'
        }
    }
}


let mirrors = [
    "https://maven.minecraftforge.net",
    "https://maven.neoforged.net/releases",
    "https://maven.creeperhost.net",
    "https://libraries.minecraft.net",
    "https://repo1.maven.org/maven2"
]

async function getFileFromArchive(jar: string, file: string = null, path: string = null) {
    let fileReturn: any = []
    let zip = new admZip(jar);
    let entries = zip.getEntries();

    return await new Promise(resolve => {
        for (let entry of entries) {
            if (!entry.isDirectory && !path) {
                if (entry.entryName == file) fileReturn = entry.getData();
                if (!file) fileReturn.push({ name: entry.entryName, data: entry.getData() });
            }

            if (!entry.isDirectory && entry.entryName.includes(path) && path) {
                fileReturn.push(entry.entryName);
            }
        }
        resolve(fileReturn);
    });
}

async function createZIP(files: any, ignored: any = null) {
    let zip = new admZip();

    return await new Promise(resolve => {
        for (let entry of files) {
            if (ignored && entry.name.includes(ignored)) continue;
            zip.addFile(entry.name, entry.data);
        }
        resolve(zip.toBuffer());
    });
}

function skipLibrary(lib) {
    let Lib = { win32: "windows", darwin: "osx", linux: "linux" };

    let skip = false;
    if (lib.rules) {
        skip = true;
        lib.rules.forEach(({ action, os, features }) => {
            if (features) return true;
            if (action === 'allow' && ((os && os.name === Lib[process.platform]) || !os)) {
                skip = false;
            }

            if (action === 'disallow' && ((os && os.name === Lib[process.platform]) || !os)) {
                skip = true;
            }
        });
    }
    return skip;
}

export {
    getPathLibraries,
    isold,
    getFileHash,
    mirrors,
    loader,
    getFileFromArchive,
    createZIP,
    skipLibrary
};