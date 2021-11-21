const { authenticator } = require('./index');


let opts = {
    login: authenticator.getAuth("Luuxis"),
    path: "./minecraft",
    version: "1.14",
    forge: "",
    memory: {
        max: "6G",
        min: "4G"
    }
}

console.log(opts)