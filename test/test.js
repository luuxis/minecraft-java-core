const { handler } = require('../index.js');
const json = require('./minecraft/versions/1.12.2/1.12.2.json');
const fs = require('fs');


//handler.getData("http://uzurion.luuxis.fr/files/test", "./minecraft")
fs.writeFileSync(`config.json`, JSON.stringify(json, true, 4), 'UTF-8')
