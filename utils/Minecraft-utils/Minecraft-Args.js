'use strict';
class Args {
    constructor(json, config) {
        this.json = json;
        this.config = config;
        this.version = this.json.id;
    }
    GetArgs() {
        let args = this.json.minecraftArguments ? this.json.minecraftArguments.split(' ') : this.json.arguments.game;
        let table = {
            '${auth_player_name}': '',
            '${version_name}': '',
            '${game_directory}': '',
            '${assets_root}': '',
            '${assets_index_name}': '',
            '${auth_uuid}': this.config.authenticator.uuid,
            '${auth_access_token}': this.config.authenticator.access_token,
            '${clientid}': this.config.authenticator.client_token,
            '${auth_xuid}': '',
            '${user_type}': '',
            '${version_type}': '',
        }


        console.log(this.config.authenticator)

        return args
    }
}

module.exports = Args;