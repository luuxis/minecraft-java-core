/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

const nodeFetch = require('node-fetch');

module.exports = class modde {
    constructor(config) {
        this.config = config;
    }

    async librairiesModdeJson(ModdeJson) {
        let libModde = ModdeJson.libraries.map(librarie => librarie.name);
        let allLibrairiesModde = []
        for (let lib of libModde) {
            let libSplit = lib.split(':')
            let libName = `${libSplit[1]}-${libSplit[2]}.jar`
            let pathLib = `${libSplit[0].replace(/\./g, '/')}/${libSplit[1]}/${libSplit[2]}/${libName}`
            allLibrairiesModde.push(pathLib)
        }
        return allLibrairiesModde
    }

    async fileInfo(url) {
        let response = await nodeFetch(url);
        if(response.status == 200) {
            let size = response.headers.get('content-length');
            console.log(response)
            return {
                size: parseInt(size),
                sha1: ''
            }
        } else {
            return {
                size: '',
                sha1: ''
            }
        }
    }

    async filesList(ModdeJson, filesServer) {
        let forgeURL = 'https://libraries.minecraft.net';
        let librairiesModde = await this.librairiesModdeJson(ModdeJson);
        let LibrairiesServer = filesServer.filter(file => file.type == 'MODDELIBRARY');
        LibrairiesServer = LibrairiesServer.map(file => file.path);
        let missing = librairiesModde.filter(Librairies => !LibrairiesServer.includes(`libraries/${Librairies}`));

        let filesList = [];
        for (let lib of missing) {
            let fileProperties = await this.fileInfo(`${forgeURL}/${lib}`);
            let file = {}
            file.path = `libraries/${lib}`,
            file.size = fileProperties.size,
            file.sha1 = fileProperties.sha1,
            file.url = `${forgeURL}/${lib}`,
            file.type = 'MODDELIBRARY'
            filesList.push(file);
        }

        return filesList;
    }

    async filesGame() {
        if (this.config.modde) {
            if (this.config.url == null) return [];

            let filesServer = await nodeFetch(this.config.url).then(res => res.json());
            let ModdeJson = await nodeFetch(filesServer.filter(file => file.type == 'VERIONSCUSTOM').map(file => file.url)[0]).then(res => res.json());
            let filesList = await this.filesList(ModdeJson, filesServer);

            let files = [];
            for (let modde of [...filesServer, ...filesList]) {
                if (!modde.url) continue;
                let file = {}
                file.path = modde.path,
                file.size = modde.size,
                file.sha1 = modde.sha1,
                file.url = modde.url,
                file.type = modde.type
                files.push(file);
            }
            return {
                files: files,
                ModdeJson: ModdeJson
            }
        } else return {
            files: [],
            ModdeJson: false
        };
    }

    async GameModde() {
        let filesGame = await this.filesGame();
        return {
            gameModdeFiles: filesGame.files,
            gameModdeJson: filesGame.ModdeJson
        }
    }
}