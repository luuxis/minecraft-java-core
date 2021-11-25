'use strict';


class Start {
    constructor(client, source) {
        this.client = client
        this.natives = source.natives
        this.librarie = source.libraries
        this.version = require(source.json);
        this.authorization = source.authorization
    }

    async agrs() {
        if(process.platform == "win32") this.librarie = this.librarie.join(";");
        else this.librarie = this.librarie.join(":");

        let args = [
            "-cp",
            this.librarie,
            `-Djava.library.path=${this.natives}`,
        ]
        
        return args
    }

}
module.exports = Start