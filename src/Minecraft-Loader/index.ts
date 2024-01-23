/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { loader } from '../utils/Index.js';
import Forge from './loader/forge/forge.js';
import NeoForge from './loader/neoForge/neoForge.js';
import Fabric from './loader/fabric/fabric.js';
import LegacyFabric from './loader/legacyfabric/legacyFabric.js';
import Quilt from './loader/quilt/quilt.js';


import { EventEmitter } from 'events';
import fs from 'fs'
import path from 'path'

export default class Loader extends EventEmitter {
    options: any;

    constructor(options: any) {
        super();
        this.options = options
    }

    async install() {
        let Loader = loader(this.options.loader.type);
        if (!Loader) return this.emit('error', { error: `Loader ${this.options.loader.type} not found` });

        if (this.options.loader.type === 'forge') {
            let forge = await this.forge(Loader);
            if (forge.error) return this.emit('error', forge);
            this.emit('json', forge);
        } else if (this.options.loader.type === 'neoforge') {
            let neoForge = await this.neoForge(Loader);
            if (neoForge.error) return this.emit('error', neoForge);
            this.emit('json', neoForge);
        } else if (this.options.loader.type === 'fabric') {
            let fabric = await this.fabric(Loader);
            if (fabric.error) return this.emit('error', fabric);
            this.emit('json', fabric);
        } else if (this.options.loader.type === 'legacyfabric') {
            let legacyFabric = await this.legacyFabric(Loader);
            if (legacyFabric.error) return this.emit('error', legacyFabric);
            this.emit('json', legacyFabric);
        } else if (this.options.loader.type === 'quilt') {
            let quilt = await this.quilt(Loader);
            if (quilt.error) return this.emit('error', quilt);
            this.emit('json', quilt);
        } else {
            return this.emit('error', { error: `Loader ${this.options.loader.type} not found` });
        }
    }

    async forge(Loader: any) {
        let forge = new Forge(this.options);
        // set event
        forge.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });

        forge.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });

        forge.on('extract', (element) => {
            this.emit('extract', element);
        });

        forge.on('patch', patch => {
            this.emit('patch', patch);
        });

        // download installer
        let installer = await forge.downloadInstaller(Loader);
        if (installer.error) return installer;

        if (installer.ext == 'jar') {
            // extract install profile
            let profile: any = await forge.extractProfile(installer.filePath);
            if (profile.error) return profile
            let destination = path.resolve(this.options.path, 'versions', profile.version.id)
            if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
            fs.writeFileSync(path.resolve(destination, `${profile.version.id}.json`), JSON.stringify(profile.version, null, 4));

            // extract universal jar
            let universal: any = await forge.extractUniversalJar(profile.install, installer.filePath);
            if (universal.error) return universal;

            // download libraries
            let libraries: any = await forge.downloadLibraries(profile, universal);
            if (libraries.error) return libraries;

            // patch forge if nessary
            let patch: any = await forge.patchForge(profile.install);
            if (patch.error) return patch;

            return profile.version;
        } else {
            let profile: any = await forge.createProfile(installer.id, installer.filePath);
            if (profile.error) return profile
            let destination = path.resolve(this.options.path, 'versions', profile.id)
            if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
            fs.writeFileSync(path.resolve(destination, `${profile.id}.json`), JSON.stringify(profile, null, 4));
            return profile;
        }
    }

    async neoForge(Loader: any) {
        let neoForge = new NeoForge(this.options);

        // set event
        neoForge.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });

        neoForge.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });

        neoForge.on('extract', (element) => {
            this.emit('extract', element);
        });

        neoForge.on('patch', patch => {
            this.emit('patch', patch);
        });

        // download installer
        let installer = await neoForge.downloadInstaller(Loader);
        if (installer.error) return installer;

        // extract install profile
        let profile: any = await neoForge.extractProfile(installer.filePath);
        if (profile.error) return profile
        let destination = path.resolve(this.options.path, 'versions', profile.version.id)
        if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.resolve(destination, `${profile.version.id}.json`), JSON.stringify(profile.version, null, 4));

        //extract universal jar
        let universal: any = await neoForge.extractUniversalJar(profile.install, installer.filePath, installer.oldAPI);
        if (universal.error) return universal;

        // download libraries
        let libraries: any = await neoForge.downloadLibraries(profile, universal);
        if (libraries.error) return libraries;

        // patch forge if nessary
        let patch: any = await neoForge.patchneoForge(profile.install, installer.oldAPI);
        if (patch.error) return patch;

        return profile.version;
    }

    async fabric(Loader: any) {
        let fabric = new Fabric(this.options);

        // set event
        fabric.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });

        fabric.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });

        // download Json
        let json = await fabric.downloadJson(Loader);
        if (json.error) return json;
        let destination = path.resolve(this.options.path, 'versions', json.id)
        if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));

        // download libraries
        await fabric.downloadLibraries(json);

        return json;
    }

    async legacyFabric(Loader: any) {
        let legacyFabric = new LegacyFabric(this.options);

        // set event
        legacyFabric.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });

        legacyFabric.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });

        // download Json
        let json = await legacyFabric.downloadJson(Loader);
        if (json.error) return json;
        let destination = path.resolve(this.options.path, 'versions', json.id)
        if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));

        // download libraries
        await legacyFabric.downloadLibraries(json);

        return json;
    }

    async quilt(Loader: any) {
        let quilt = new Quilt(this.options);

        // set event
        quilt.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });

        quilt.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });

        // download Json
        let json = await quilt.downloadJson(Loader);

        if (json.error) return json;
        let destination = path.resolve(this.options.path, 'versions', json.id)
        if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));

        // // download libraries
        await quilt.downloadLibraries(json);

        return json;
    }
}