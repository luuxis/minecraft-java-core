/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import MinecraftNativeLinuxARM from './Minecraft-Lwjgl-Native.js';

import nodeFetch from 'node-fetch';
import os from 'os';

export default class Json {
    options: any;

    constructor(options: any) {
        this.options = options;
    }

    async GetInfoVersion() {
        let version: string = this.options.version;
        let data: any = await nodeFetch(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json?_t=${new Date().toISOString()}`);
        data = await data.json();

        if (version == 'latest_release' || version == 'r' || version == 'lr') {
            version = data.latest.release;
        }
        else if (version == 'latest_snapshot' || version == 's' || version == 'ls') {
            version = data.latest.snapshot;
        }

        data = data.versions.find(v => v.id === version);

        if (!data) return {
            error: true,
            message: `Minecraft ${version} is not found.`
        };

        let json: any = await nodeFetch(data.url).then(res => res.json());
        if (os.platform() == 'linux' && os.arch().startsWith('arm')) json = await new MinecraftNativeLinuxARM(this.options).ProcessJson(json);

        return {
            InfoVersion: data,
            json: json,
            version: version
        };
    }
}