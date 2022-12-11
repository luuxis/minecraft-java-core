/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import fs from 'fs';
import nodeFetch from 'node-fetch';
import { EventEmitter } from 'events';

interface downloadOptions {
    url: string,
    path: string,
    length: number,
    folder: string
}

export default class download {
    on: any;
    emit: any;

    constructor() {
        this.on = EventEmitter.prototype.on;
        this.emit = EventEmitter.prototype.emit;
    }

    async downloadFileMultiple(files: downloadOptions, size: number, limit: number = 1) {
        if (limit > files.length) limit = files.length;
        let completed = 0;
        let downloaded = 0;
        let queued = 0;

        let start = new Date().getTime();
        let before = 0;
        let speeds = [];

        let estimated = setInterval(() => {
            let duration = (new Date().getTime() - start) / 1000;
            let loaded = (downloaded - before) * 8;
            if (speeds.length >= 5) speeds = speeds.slice(1);
            speeds.push((loaded / duration) / 8);
            let speed = 0;
            for (let s of speeds) speed += s;
            speed /= speeds.length;
            this.emit("speed", speed);
            let time = (size - downloaded) / (speed);
            this.emit("estimated", time);
            start = new Date().getTime();
            before = downloaded;
        }, 500);

        const downloadNext = async () => {
            if (queued < files.length) {
                let file = files[queued];
                queued++;
                if (!fs.existsSync(file.foler)) fs.mkdirSync(file.folder, { recursive: true });
                const writer = fs.createWriteStream(file.path);
                const response = await nodeFetch(file.url);
                response.body.on('data', (chunk: any) => {
                    downloaded += chunk.length;
                    this.emit('progress', downloaded, size);
                    writer.write(chunk);
                });

                response.body.on('end', () => {
                    writer.end();
                    completed++;
                    downloadNext();
                });

                response.body.on('error', (err: Error) => {
                    this.emit('error', err);
                });
            }
        };

        while (queued < limit) {
            downloadNext();
        }

        return new Promise((resolve: any) => {
            const interval = setInterval(() => {
                if (completed === files.length) {
                    clearInterval(estimated);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
}