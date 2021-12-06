'use strict';

const child = require("child_process");

let os = { win32: 'windows', darwin: 'osx', linux: 'linux', sunos: 'linux', openbsd: 'linux', android: 'linux', aix: 'linux' }[process.platform];

class Start {
    constructor(client, source) {
        this.client = client
        this.natives = source.natives
        this.root = source.root
        this.json = source.json
        this.authorization = source.authorization
    }

    async agrs() {
        let all = []
        this.libraries = [];
        let libsminecraft = this.json.libraries.map(lib => lib);
        if(this.client.custom) this.json.custom.libraries.map(lib => this.libraries.push(`${this.root}/libraries/${lib.downloads.artifact.path}`));
        
        for (let lib of libsminecraft) {
            if(!lib.downloads.artifact) continue;
            if (lib.rules && lib.rules[0].os) {
                if (lib.rules[0].os.name !== os)
                continue;
            }
            this.libraries.push(`${this.root}/libraries/${lib.downloads.artifact.path}`);
        }
        this.libraries.push(`${this.json.id}`);

        let launchOptions = this.json.minecraftArguments ? this.json.minecraftArguments.split(' ') : this.json.arguments.game

        let fields = {
            '${auth_access_token}':this.authorization.access_token,
            '${auth_session}': this.authorization.access_token,
            '${auth_player_name}': this.authorization.name,
            '${auth_uuid}': this.authorization.uuid,
            '${auth_xuid}': this.authorization.meta.xuid || this.authorization.access_token,
            '${user_properties}': this.authorization.user_properties,
            '${user_type}': this.authorization.meta.type,
            '${version_name}': this.client.version,
            '${assets_index_name}': this.json.assetIndex.id,
            '${game_directory}': this.root,
            '${assets_root}': `${this.root}/assets`,
            '${game_assets}': `${this.root}/assets`,
            '${version_type}': this.json.type,
            '${clientid}': this.authorization.meta.clientId || (this.authorization.client_token || this.authorization.access_token)
        }
        
        for (let index = 0; index < launchOptions.length; index++) {
            if (typeof launchOptions[index] === 'object') launchOptions.splice(index, 2)
            if (Object.keys(fields).includes(launchOptions[index])) {
                launchOptions[index] = fields[launchOptions[index]]
            }
        }

        let classPaths = [
            "-cp",
            this.libraries.join(process.platform === 'win32' ? ';' : ':'),
            this.json.mainClass,
        ]

        let jvm = [
            '-XX:-UseAdaptiveSizePolicy',
            '-XX:-OmitStackTraceInFastThrow',
            '-Dfml.ignorePatchDiscrepancies=true',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djava.library.path=${this.natives}`,
            `-Xms${this.client.memory.min}`,
            `-Xmx${this.client.memory.max}`,
          ]
        
        all.push({
            launchOptions: launchOptions,
            classPaths: classPaths,
            jvm: jvm
        })
        return all[0]
    }

    forge_arguments() {
        let args = forge.minecraftArguments ? forge.minecraftArguments.split(' ') : forge.arguments
    
        args.jvm = args.jvm.map(jvm => {
            return jvm
            .replace(/\${version_name}/g, this.client.version)
            .replace(/\${library_directory}/g, `${this.root}/libraries`)
            .replace( /\${classpath_separator}/g, process.platform === 'win32' ? ';' : ':');
        })    
        return [args.game, args.jvm]
    }

    start(args, java) {
        const minecraft = child.spawn(java, args, { cwd: this.root, detached: this.client.detached })
        return minecraft
    }
}
module.exports = Start