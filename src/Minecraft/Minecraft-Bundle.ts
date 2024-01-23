/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import fs from 'fs';
import path from 'path';
import { getFileHash } from '../utils/Index.js'

export default class MinecraftBundle {
    options: any;
    constructor(options: any) {
        this.options = options;
    }

    async checkBundle(bundle: any) {
        let todownload = [];

        for (let file of bundle) {
            if (!file.path) continue
            file.path = path.resolve(this.options.path, file.path).replace(/\\/g, "/");
            file.folder = file.path.split("/").slice(0, -1).join("/");

            if (file.type == "CFILE") {
                if (!fs.existsSync(file.folder)) fs.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
                fs.writeFileSync(file.path, file.content, { encoding: "utf8", mode: 0o755 });
                continue;
            }

            if (fs.existsSync(file.path)) {
                let replaceName = `${this.options.path}/`
                if (this.options.instance) replaceName = `${this.options.path}/instances/${this.options.instance}/`
                if (this.options.ignored.find(ignored => ignored == file.path.replaceAll(replaceName, ""))) continue

                if (file.sha1) {
                    if (await getFileHash(file.path) != file.sha1) todownload.push(file);
                }

            } else todownload.push(file);
        }
        return todownload;
    }

    async getTotalSize(bundle: any) {
        let todownload = 0;
        for (let file of bundle) {
            todownload += file.size;
        }
        return todownload;
    }

    async checkFiles(bundle: any) {
        let instancePath = ''
        if (this.options.instance) {
            if (!fs.existsSync(`${this.options.path}/instances`)) fs.mkdirSync(`${this.options.path}/instances`, { recursive: true });
            instancePath = `/instances/${this.options.instance}`
        }
        let files = this.options.instance ? this.getFiles(`${this.options.path}/instances/${this.options.instance}`) : this.getFiles(this.options.path);
        let ignoredfiles = [...this.getFiles(`${this.options.path}/loader`), ...this.getFiles(`${this.options.path}/runtime`)]

        for (let file of this.options.ignored) {
            file = (`${this.options.path}${instancePath}/${file}`)
            if (fs.existsSync(file)) {
                if (fs.statSync(file).isDirectory()) {
                    ignoredfiles.push(...this.getFiles(file));
                } else if (fs.statSync(file).isFile()) {
                    ignoredfiles.push(file);
                }
            }
        }

        ignoredfiles.forEach(file => this.options.ignored.push((file)));
        bundle.forEach(file => ignoredfiles.push((file.path)));
        files = files.filter(file => ignoredfiles.indexOf(file) < 0);

        for (let file of files) {
            try {
                if (fs.statSync(file).isDirectory()) {
                    fs.rmSync(file, { recursive: true });
                } else {
                    fs.unlinkSync(file);
                    let folder = file.split("/").slice(0, -1).join("/");
                    while (true) {
                        if (folder == this.options.path) break;
                        let content = fs.readdirSync(folder);
                        if (content.length == 0) fs.rmSync(folder);
                        folder = folder.split("/").slice(0, -1).join("/");
                    }
                }
            } catch (e) {
                continue;
            }
        }
    }

    getFiles(path: any, file = []) {
        if (fs.existsSync(path)) {
            let files = fs.readdirSync(path);
            if (files.length == 0) file.push(path);
            for (let i in files) {
                let name = `${path}/${files[i]}`;
                if (fs.statSync(name).isDirectory()) this.getFiles(name, file);
                else file.push(name);
            }
        }
        return file;
    }
}