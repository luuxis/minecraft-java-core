/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { EventEmitter } from 'events';
const loaderDownloader = require('minecraft-loader');


export default class MinecraftLoader {
    options: any;
    on: any;
    emit: any;
    constructor(options: any) {
        this.options = options;
        this.on = EventEmitter.prototype.on;
        this.emit = EventEmitter.prototype.emit;
    }

    async GetLoader(version: any, javaPath: any) {
        let loader = new loaderDownloader({
            path: `${this.options.path}/loader/${this.options.loader.type}`,
            timeout: this.options.timeout,
            autoClean: true,
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
                resolve(json);
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
}