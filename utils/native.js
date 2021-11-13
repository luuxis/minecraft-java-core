const Zip = require('adm-zip')


new Zip("./test.jar").extractAllTo("./test", true)