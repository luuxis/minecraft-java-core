'use strict';


class Start {
    constructor (client, source) {
        this.client = client
        this.natives = source.natives
        this.librarie = source.librarie
        this.version = require(source.json);
        this.authorization = source.authorization
    }
    
}
module.exports = Start