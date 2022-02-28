'use strict';

const child = require("child_process");

let os = { win32: 'windows', darwin: 'osx', linux: 'linux', sunos: 'linux', openbsd: 'linux', android: 'linux', aix: 'linux' }[process.platform];

class Start {
    constructor(client, source) {
        this.client = client
        if(this.client.custom === "MCP") this.client.custom = false
        this.natives = source.natives
        this.root = source.root
        this.json = source.json
        this.authenticator = source.authenticator
    }

    async agrs() {
        let all = []
        this.libraries = [];
        let libsminecraft = this.json.libraries.map(lib => lib);
        if(this.client.custom){
            if (this.json.custom.libraries.downloads){
                this.json.custom.libraries.map(lib => this.libraries.push(`${this.root}/libraries/${lib.downloads.artifact.path}`));
            } else {
                this.json.custom.libraries.map(libs => this.libraries.push(`${this.root}/libraries/${libs.name.split(':')[0].replace(/\./g, '/')}/${libs.name.split(':')[1]}/${libs.name.split(':')[2]}/${libs.name.split(':')[1]}-${libs.name.split(':')[2]}.jar`));
            }
        }
        
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
        if(this.client.custom) {
            this.argscustom = this.json.custom.minecraftArguments ? this.json.custom.minecraftArguments.split(' ') : this.json.custom.arguments
            if(!this.argscustom.game){
                launchOptions.push(...this.argscustom)
                launchOptions = [...new Set(launchOptions)]
            }
        }
        
        if (this.argscustom && this.argscustom.jvm) {
            this.argscustom.jvm = this.argscustom.jvm.map(jvm => {
                return jvm
                .replace(/\${version_name}/g, this.client.version)
                .replace(/\${library_directory}/g, `${this.root}/libraries`)
                .replace(/\${classpath_separator}/g, process.platform === 'win32' ? ';' : ':');
            })
        }

        let fields = {
            '${auth_access_token}': this.authenticator.access_token,
            '${auth_session}': this.authenticator.access_token,
            '${auth_player_name}': this.authenticator.name,
            '${auth_uuid}': this.authenticator.uuid,
            '${auth_xuid}': this.authenticator.meta.xuid || this.authenticator.access_token,
            '${user_properties}': this.authenticator.user_properties,
            '${user_type}': this.authenticator.meta.type,
            '${version_name}': this.client.version,
            '${assets_index_name}': this.json.assetIndex.id,
            '${game_directory}': this.root,
            '${assets_root}': this.isold() ? `${this.root}/resources` : `${this.root}/assets`,
            '${game_assets}': this.isold() ? `${this.root}/resources` : `${this.root}/assets`,
            '${version_type}': this.json.type,
            '${clientid}': this.authenticator.meta.clientId || (this.authenticator.client_token || this.authenticator.access_token)
        }
        
        for (let index = 0; index < launchOptions.length; index++) {
            if (typeof launchOptions[index] === 'object') launchOptions.splice(index, 2)
            if (Object.keys(fields).includes(launchOptions[index])) {
                launchOptions[index] = fields[launchOptions[index]]
            }
        }
        
        if (this.authenticator.meta.demo) {
            launchOptions.push('--demo')
        }

        // if (this.client.server) {
        //     if (this.client.server.autoconnect){
        //         launchOptions.push(
        //             '--server',
        //             this.client.server.ip || '127.0.0.1',
        //             '--port',
        //             this.client.server.port || 25565
        //         )
        //     } 
        // } 

        let classPaths = [
            "-cp",
            this.libraries.join(process.platform === 'win32' ? ';' : ':'),
            this.json.mainClass,
        ]

        let jvm = [
            await this.getJVM(),
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djava.library.path=${this.natives}`,
            `-Xms${this.client.memory.min}`,
            `-Xmx${this.client.memory.max}`
        ]

        if (this.client.args){
            jvm.push(...this.client.args)
        }

        if(this.client.custom){
            if(this.argscustom && this.argscustom.jvm) jvm.push(...this.argscustom.jvm)
            if(this.argscustom && this.argscustom.game) classPaths.push(...this.argscustom.game)
        }
        
        all.push({
            launchOptions: launchOptions,
            classPaths: classPaths,
            jvm: jvm
        })
        return all[0]
    }

    isold() {
        return this.json.assets === 'legacy' || this.json.assets === 'pre-1.6'
    }

    start(args, java) {
        const minecraft = child.spawn(java, args, { cwd: this.root, detached: this.client.detached })
        return minecraft
    }

    async getJVM() {
        const opts = {
            win32: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
            darwin: '-XstartOnFirstThread',
            linux: '-Xss1M'
        }
        return opts[process.platform]
    }
}
module.exports = Start