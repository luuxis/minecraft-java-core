/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { EventEmitter } from 'events';
import path from 'path';
import { spawn } from 'child_process';

import jsonMinecraft from './Minecraft/Minecraft-Json.js';

import librariesMinecraft from './Minecraft/Minecraft-Libraries.js';
import assetsMinecraft from './Minecraft/Minecraft-Assets.js';
import loaderMinecraft from './Minecraft/Minecraft-Loader.js';
import javaMinecraft from './Minecraft/Minecraft-Java.js';

import bundleMinecraft from './Minecraft/Minecraft-Bundle.js';
import argumentsMinecraft from './Minecraft/Minecraft-Arguments.js';

import Downloader from './utils/Downloader.js';


export default class Launch {
    options: any;
    on: any;
    emit: any;

    constructor() {
        this.on = EventEmitter.prototype.on;
        this.emit = EventEmitter.prototype.emit;
    }

    async Launch(opt: any) {
        this.options = {
            url: opt?.url || null,
            authenticator: opt?.authenticator || null,
            timeout: opt?.timeout || 10000,
            path: path.resolve(opt?.path || '.Minecraft').replace(/\\/g, '/'),
            version: opt?.version || 'latest_release',
            instance: opt?.instance || '',
            detached: opt?.detached || false,
            downloadFileMultiple: opt?.downloadFileMultiple || 3,

            loader: {
                type: opt?.loader?.type || null,
                build: opt?.loader?.build || 'latest',
                enable: opt?.loader?.enable || false,
            },

            verify: opt?.verify || false,
            ignored: opt?.ignored || [],
            args: opt?.args || [],

            javaPath: opt?.javaPath || null,
            java: opt?.java || false,

            screen: {
                width: opt?.screen?.width || null,
                height: opt?.screen?.height || null,
                fullscreen: opt?.screen?.fullscreen || false,
            },

            memory: {
                min: opt?.memory?.min || '1G',
                max: opt?.memory?.max || '2G'
            }
        }

        if (!this.options.loader.enable) this.options.loader = false;

        this.start();
    }

    async start() {
        let data: any = await this.DownloadGame();
        if (data.error) return this.emit('error', data);
        let { minecraftJson, minecraftLoader, minecraftVersion, minecraftJava } = data;

        let minecraftArguments: any = await new argumentsMinecraft(this.options).GetArguments(minecraftJson, minecraftLoader);
        if (minecraftArguments.error) return this.emit('error', minecraftArguments);

        let loaderArguments: any = await new loaderMinecraft(this.options).GetArguments(minecraftLoader, minecraftVersion);
        if (loaderArguments.error) return this.emit('error', loaderArguments);

        let Arguments: any = [
            ...minecraftArguments.jvm,
            ...loaderArguments.jvm,
            ...minecraftArguments.classpath,
            ...loaderArguments.game,
            ...minecraftArguments.game
        ]

        let java: any = this.options.java ? minecraftJava.path : 'java';

        let minecraftDebug = spawn(java, Arguments, { cwd: this.options.path, detached: this.options.detached })

        this.emit('data', `Launching with arguments ${Arguments.join(' ')}`)
        minecraftDebug.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')))
        minecraftDebug.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')))
        minecraftDebug.on('close', (code) => this.emit('close', code))
    }

    async DownloadGame() {
        let InfoVersion = await new jsonMinecraft(this.options).GetInfoVersion();
        let loaderJson: any = null;
        if (InfoVersion.error) return InfoVersion
        let { json, version } = InfoVersion;

        let libraries = new librariesMinecraft(this.options)

        let gameLibraries: any = await libraries.Getlibraries(json);
        let gameAssetsOther: any = await libraries.GetAssetsOthers(this.options.url);
        let gameAssets: any = await new assetsMinecraft(this.options).GetAssets(json);
        let gameJava: any = this.options.java ? await new javaMinecraft(this.options).GetJsonJava(json) : { files: [] };

        let bundle: any = [...gameLibraries, ...gameAssetsOther, ...gameAssets, ...gameJava.files]
        let filesList: any = await new bundleMinecraft(this.options).checkBundle(bundle);

        if (filesList.length > 0) {
            let downloader = new Downloader();
            let totsize = await new bundleMinecraft(this.options).getTotalSize(filesList);

            downloader.on("progress", (DL: any, totDL: any, element: any) => {
                this.emit("progress", DL, totDL, element);
            });

            downloader.on("speed", (speed: any) => {
                this.emit("speed", speed);
            });

            downloader.on("estimated", (time: any) => {
                this.emit("estimated", time);
            });

            await downloader.downloadFileMultiple(filesList, totsize, this.options.downloadFileMultiple);
        }

        let natives = await libraries.natives(bundle);
        if (natives.length === 0) json.nativesList = false;
        else json.nativesList = true;

        if (this.options.loader) {
            let loaderInstall = new loaderMinecraft(this.options)

            loaderInstall.on('extract', (extract: any) => {
                this.emit('extract', extract);
            });

            loaderInstall.on('progress', (progress: any, size: any, element: any) => {
                this.emit('progress', progress, size, element);
            });

            loaderInstall.on('check', (progress: any, size: any, element: any) => {
                this.emit('check', progress, size, element);
            });

            loaderInstall.on('patch', (patch: any) => {
                this.emit('patch', patch);
            });

            let jsonLoader = await loaderInstall.GetLoader(version, gameJava.path).then((data: any) => data).catch((err: any) => err);
            if (jsonLoader.error) return this.emit('error', jsonLoader);
            loaderJson = jsonLoader;
        }

        return {
            minecraftJson: json,
            minecraftLoader: loaderJson,
            minecraftVersion: version,
            minecraftJava: gameJava
        }
    }
}