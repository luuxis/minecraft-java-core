/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { EventEmitter } from 'events';
import loaderDownloader from '../Minecraft-Loader/index.js'
import path from 'path'

export default class MinecraftLoader {
    options: any;
    on: any;
    emit: any;
    loaderPath: string;
    constructor(options: any) {
        this.options = options;
        this.on = EventEmitter.prototype.on;
        this.emit = EventEmitter.prototype.emit;
        this.loaderPath = path.join(this.options.path, this.options.loader.path);
    }

    async GetLoader(version: any, javaPath: any) {
        let loader = new loaderDownloader({
            path: this.loaderPath,
            downloadFileMultiple: this.options.downloadFileMultiple,
            loader: {
                type: this.options.loader.type,
                version: version,
                build: this.options.loader.build,
                config: {
                    javaPath: javaPath,
                    minecraftJar: `${this.options.path}/versions/${version}/${version}.jar`,
                    minecraftJson: `${this.options.path}/versions/${version}/${version}.json`
                }
            }
        });

        return await new Promise((resolve, reject) => {
            loader.install();

            loader.on('json', (json: any) => {
                let loaderJson = json;
                loaderJson.libraries = loaderJson.libraries.map((lib: any) => {
                    lib.loader = this.loaderPath;
                    return lib;
                });
                resolve(loaderJson);
            });

            loader.on('extract', (extract: any) => {
                this.emit('extract', extract);
            });

            loader.on('progress', (progress: any, size: any, element: any) => {
                this.emit('progress', progress, size, element);
            });

            loader.on('check', (progress: any, size: any, element: any) => {
                this.emit('check', progress, size, element);
            });

            loader.on('patch', (patch: any) => {
                this.emit('patch', patch);
            });

            loader.on('error', (err: any) => {
                reject(err);
            });
        })
    }

    async GetArguments(json: any, version: any) {
        if (json === null) {
            return {
                game: [],
                jvm: []
            }
        }

        let moddeArguments = json.arguments;
        if (!moddeArguments) return { game: [], jvm: [] };
        let Arguments: any = {}
        if (moddeArguments.game) Arguments.game = moddeArguments.game;
        if (moddeArguments.jvm) Arguments.jvm = moddeArguments.jvm.map(jvm => {
            return jvm
                .replace(/\${version_name}/g, version)
                .replace(/\${library_directory}/g, `${this.loaderPath}/libraries`)
                .replace(/\${classpath_separator}/g, process.platform === 'win32' ? ';' : ':');
        })

        return {
            game: Arguments.game || [],
            jvm: Arguments.jvm || [],
            mainClass: json.mainClass
        };
    }
}