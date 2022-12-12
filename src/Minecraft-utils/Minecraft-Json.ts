/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
import nodeFetch from 'node-fetch';

export default class Json {
    version: string;

    constructor(version: string) {
        this.version = version;
    }

    async GetInfoVersion() {
        let data: any = await nodeFetch(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json?_t=${new Date().toISOString()}`);
        data = await data.json();

        if (this.version == 'latest_release' || this.version == 'r' || this.version == 'lr') this.version = data.latest.release;
        else if (this.version == 'latest_snapshot' || this.version == 's' || this.version == 'ls') this.version = data.latest.snapshot;

        data = data.versions.find(v => v.id === this.version);

        if (!data) return {
            error: true,
            message: `Minecraft ${this.version} is not found.`
        };

        return {
            InfoVersion: data,
            json: await nodeFetch(data.url).then(res => res.json()),
            version: this.version
        };
    }
}