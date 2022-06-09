'use strict';

class Args {
    constructor(json, librariesMinecraft, gameModdeJson, config) {
        this.json = json;
        this.librariesMinecraft = librariesMinecraft;
        this.gameModdeJson = gameModdeJson;
        this.config = config;
        this.version = this.json.id;
        this.authenticator = this.config.authenticator;
    }
    GetArgs() {
        let game = this.GetGame();
        let jvm = this.GetJVM();
        let classpath = this.classPath()
        let moddeArguments = this.GetArgumentsModde();
        let args = { jvm, classpath: [...moddeArguments.jvm, ...classpath], game: [...moddeArguments.game, ...game] };
        return args;
    }

    GetGame() {
        let game = this.json.minecraftArguments ? this.json.minecraftArguments.split(' ') : this.json.arguments.game;
        if (this.config.custom) {
            let gamemodde = this.gameModdeJson.minecraftArguments ? this.gameModdeJson.minecraftArguments.split(' ') : this.gameModdeJson.arguments
            if (!gamemodde.game) {
                game.push(...gamemodde)
                game = [...new Set(game)]
            }
        }
        
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

        for (let i in game) {
            if (typeof game[i] === 'object') game.splice(i, 2)
            if (Object.keys(table).includes(game[i])) game[i] = table[game[i]]
        }

        return game;
    }

    GetJVM() {
        let jvm = [
            this.getjvm(),
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djava.library.path=${this.config.path}/versions/${this.version}/natives`,
            `-Xms${this.config.memory.min}`,
            `-Xmx${this.config.memory.max}`
        ]
        return jvm;
    }

    GetArgumentsModde() {
        if (!this.gameModdeJson) return { game: [], jvm: [] }
        let moddeArguments = this.gameModdeJson.arguments;
        if (!moddeArguments) return { game: [], jvm: [] };
        let Arguments = {}
        if (moddeArguments.game) Arguments.game = moddeArguments.game;
        if (moddeArguments.jvm) Arguments.jvm = moddeArguments.jvm.map(jvm => {
            return jvm
                .replace(/\${version_name}/g, this.version)
                .replace(/\${library_directory}/g, `${this.config.path}/libraries`)
                .replace(/\${classpath_separator}/g, process.platform === 'win32' ? ';' : ':');
        })
        return Arguments;
    }

    classPath() {
        let librariesMinecraft = this.librariesMinecraft.filter(mod => mod.type == "LIBRARY").map(mod => mod.path);
        let librairiesModde = {}

        if (!this.gameModdeJson) librairiesModde = []
        else librairiesModde = this.gameModdeJson.libraries.map(librarie => `${this.config.path}/libraries/${librarie.name.split(':')[0].replace(/\./g, '/')}/${librarie.name.split(':')[1]}/${librarie.name.split(':')[2]}/${librarie.name.split(':')[1]}-${librarie.name.split(':')[2]}.jar`);

        let libraries = [...librairiesModde, ...librariesMinecraft];
        if (process.platform == "win32") libraries = libraries.join(";");
        else libraries = libraries.join(":");
        let classpath = [
            `-cp`,
            `${libraries}`,
            this.gameModdeJson ? this.gameModdeJson.mainClass : this.json.mainClass
        ]
        return classpath;
    }

    isold() {
        return this.json.assets === 'legacy' || this.json.assets === 'pre-1.6'
    }

    getjvm() {
        const opts = {
            win32: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
            darwin: '-XstartOnFirstThread',
            linux: '-Xss1M'
        }
        return opts[process.platform]
    }
}

module.exports = Args;