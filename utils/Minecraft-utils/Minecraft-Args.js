'use strict';
class Args {
    constructor(json, config) {
        this.json = json;
        this.config = config;
        this.version = this.json.id;
        this.authenticator = this.config.authenticator;
    }
    GetArgs() {
        let options = this.json.minecraftArguments ? this.json.minecraftArguments.split(' ') : this.json.arguments.game;
        let table = {
            '${auth_access_token}': this.authenticator.access_token,
            '${auth_session}': this.authenticator.access_token,
            '${auth_player_name}': this.authenticator.name,
            '${auth_uuid}': this.authenticator.uuid,
            '${auth_xuid}': this.authenticator.xuid || this.authenticator.access_token,
            '${user_properties}': this.authenticator.user_properties,
            '${user_type}': this.authenticator.meta.type,
            '${version_name}': this.version,
            '${assets_index_name}': this.json.assetIndex.id,
            '${game_directory}': this.config.path,
            '${assets_root}': this.isold() ? `${this.config.path}/resources` : `${this.config.path}/assets`,
            '${game_assets}': this.isold() ? `${this.config.path}/resources` : `${this.config.path}/assets`,
            '${version_type}': this.json.type,
            '${clientid}': this.authenticator.clientId || (this.authenticator.client_token || this.authenticator.access_token)
        }


        for (let i in options) {
            if (typeof options[i] === 'object') options.splice(i, 2)
            if (Object.keys(table).includes(options[i])) options[i] = table[options[i]]
        }

        return options;
    }
    isold() {
        return this.json.assets === 'legacy' || this.json.assets === 'pre-1.6'
    }
}

module.exports = Args;