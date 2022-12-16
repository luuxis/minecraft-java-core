/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import { getPathLibraries } from '../utils/Index.js';

let MojangLib = { win32: "windows", darwin: "osx", linux: "linux" };

export default class MinecraftArguments {
    options: any;
    authenticator: any;
    constructor(options: any) {
        this.options = options;
        this.authenticator = options.authenticator;
    }

    async GetArguments(json: any, loaderJson: any) {
        let game = await this.GetGameArguments(json);
        let jvm = await this.GetJVMArguments(json);
        let classpath = await this.GetClassPath(json, loaderJson);

        return {
            game: game,
            jvm: jvm,
            classpath: classpath
        }
    }

    async GetGameArguments(json: any) {
        let game = json.minecraftArguments ? json.minecraftArguments.split(' ') : json.arguments.game;

        let table = {
            '${auth_access_token}': this.authenticator.access_token,
            '${auth_session}': this.authenticator.access_token,
            '${auth_player_name}': this.authenticator.name,
            '${auth_uuid}': this.authenticator.uuid,
            '${auth_xuid}': this.authenticator.meta.xuid || this.authenticator.access_token,
            '${user_properties}': this.authenticator.user_properties,
            '${user_type}': this.authenticator.meta.type,
            '${version_name}': json.id,
            '${assets_index_name}': json.assetIndex.id,
            '${game_directory}': this.options.path,
            '${assets_root}': this.isold(json) ? `${this.options.path}/resources` : `${this.options.path}/assets`,
            '${game_assets}': this.isold(json) ? `${this.options.path}/resources` : `${this.options.path}/assets`,
            '${version_type}': json.type,
            '${clientid}': this.authenticator.clientId || (this.authenticator.client_token || this.authenticator.access_token)
        }

        for (let i in game) {
            if (typeof game[i] === 'object') game.splice(i, 2)
            if (Object.keys(table).includes(game[i])) game[i] = table[game[i]]
        }

        return game;
    }

    async GetJVMArguments(json: any) {
        let opts = {
            win32: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
            darwin: '-XstartOnFirstThread',
            linux: '-Xss1M'
        }
        let jvm = [
            opts[process.platform],
            `-Xms${this.options.memory.min}`,
            `-Xmx${this.options.memory.max}`,
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M',
            '-Dfml.ignoreInvalidMinecraftCertificates=true'
        ]

        if (json.nativesList) {
            jvm.push(`-Djava.library.path=${this.options.path}/versions/${json.id}/natives`)
        }

        return jvm;
    }

    async GetClassPath(json: any, loaderJson: any) {
        let classPath: any = []
        let libraries: any = json.libraries;

        if (loaderJson?.libraries) libraries = libraries.concat(loaderJson.libraries);
        libraries = libraries.filter((library, index, self) => index === self.findIndex(t => t.name === library.name))

        for (let lib of libraries) {
            if (lib.natives) {
                let native = lib.natives[MojangLib[process.platform]];
                if (!native) native = lib.natives[process.platform];
                else continue;
            } else {
                if (lib.rules && lib.rules[0].os) {
                    if (lib.rules[0].os.name !== MojangLib[process.platform]) continue;
                }
            }
            let path = getPathLibraries(lib.name)
            if (lib.loader) {
                classPath.push(`${lib.loader}/libraries/${path.path}/${path.name}`)
            } else {
                classPath.push(`${this.options.path}/libraries/${path.path}/${path.name}`)
            }
        }
        classPath.push(`${this.options.path}/versions/${json.id}/${json.id}.jar`)

        return [
            `-cp`,
            classPath.join(process.platform === 'win32' ? ';' : ':'),
            loaderJson ? loaderJson.mainClass : json.mainClass
        ]
    }

    isold(json: any) {
        return json.assets === 'legacy' || json.assets === 'pre-1.6'
    }
}
