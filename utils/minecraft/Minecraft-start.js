'use strict';

const child = require("child_process");

class Start {
    constructor(client, source) {
        this.client = client
        this.natives = source.natives
        this.librarie = source.libraries
        this.root = source.root
        this.logger = source.logger
        this.version = require(source.json);
        this.authorization = source.authorization
    }

    async agrs() {
        let all = []
        let launchOptions = this.version.minecraftArguments ? this.version.minecraftArguments.split(' ') : this.version.arguments.game

        let fields = {
            '${auth_access_token}':this.authorization.access_token,
            '${auth_session}': this.authorization.access_token,
            '${auth_player_name}': this.authorization.name,
            '${auth_uuid}': this.authorization.uuid,
            '${user_properties}': this.authorization.user_properties,
            '${user_type}': this.authorization.meta.type,
            '${version_name}': this.client.version,
            '${assets_index_name}': this.version.assetIndex.id,
            '${game_directory}': this.root,
            '${assets_root}': `${this.root}/assets`,
            '${game_assets}': `${this.root}/assets`,
            '${version_type}': this.version.type
        }
        
        for (let index = 0; index < launchOptions.length; index++) {
            if (typeof launchOptions[index] === 'object') launchOptions.splice(index, 2)
            if (Object.keys(fields).includes(launchOptions[index])) {
                launchOptions[index] = fields[launchOptions[index]]
            }
        }

        if(process.platform == "win32") this.librarie = this.librarie.join(";");
        else this.librarie = this.librarie.join(":");
        let classPaths = [
            "-cp",
            this.librarie,
            this.version.mainClass,
        ]

        let jvm = [
            '-XX:-UseAdaptiveSizePolicy',
            '-XX:-OmitStackTraceInFastThrow',
            '-Dfml.ignorePatchDiscrepancies=true',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djava.library.path=${this.natives}`,
            `-Xmx1G`,
            `-Xms1G`
          ]
        
        all.push({
            launchOptions: launchOptions,
            classPaths: classPaths,
            jvm: jvm
        })
        return all[0]
    }

    start(args) {
        const minecraft = child.spawn(`${this.root}/runtime/java/bin/javaw.exe`, args, { cwd: this.root, detached: true })
        return minecraft
    }
}
module.exports = Start