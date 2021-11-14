const { handler } = require('../index.js');
const extractNatives = require('../../Minecraft-Java-Core/utils/native.js');

handler.getData("http://uzurion.luuxis.fr/files/test", "./minecraft").then(() => {
    console.log("done");
    extractNatives.extractNatives("1.12.2", "./minecraft")
}).catch(err => {
    console.log(err);
});

