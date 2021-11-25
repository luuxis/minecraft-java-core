'use strict';

class Start {
    constructor(client, source) {
        this.client = client
        this.natives = source.natives
        this.librarie = source.libraries
        this.root = source.root
        this.version = require(source.json);
        this.authorization = source.authorization
    }

    async agrs() {
        if(process.platform == "win32") this.librarie = this.librarie.join(";");
        else this.librarie = this.librarie.join(":");

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

        

        let args = [
            "-cp",
            this.librarie,
            `-Djava.library.path=${this.natives}`,
            this.version.logging.client.argument
        ]
        return fields
    }

}
module.exports = Start