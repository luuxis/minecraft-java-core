'use strict';

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
        let args = this.version.minecraftArguments ? this.version.minecraftArguments.split(' ') : this.version.arguments.game
        args = args.concat(this.version.minecraftArguments ? this.version.minecraftArguments.split(' ') : this.version.arguments.game)
        
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
        
        for (let index = 0; index < args.length; index++) {
            if (typeof args[index] === 'object') args.splice(index, 2)
            if (Object.keys(fields).includes(args[index])) {
                args[index] = fields[args[index]]
            }
        }

        

        return args
    }

    async start() {
        if(process.platform == "win32") this.librarie = this.librarie.join(";");
        else this.librarie = this.librarie.join(":");
        let args = [
            "-cp",
            this.librarie,
            `-Xms1024M`,
            `-Xmx1024M`,
            `-Djava.library.path=${this.natives}`,
            `-Dlog4j.configurationFile=${this.logger}`,
        ]
        args = args.concat(await this.agrs())
        
        return args
    }

}
module.exports = Start