const Handler = require('./minecraft/Minecraft-Json.js');
const downloader = require('./download.js');

class MCLCore {
    async launch(options) {
        this.options = options;
        this.jsonversion = new Handler(options);
        this.downloader = new downloader();
        this.checkFiles();
    }

    getTotalSize(bundle) {
        let size = 0;
        for(let file of bundle){
            size += file.size;
        }
        return size;
    }

    async checkFiles() {
        this.downloader.on("progress", (DL, totDL) => {
            console.log(DL, totDL);
          });
          
          this.downloader.on("speed", (speed) => {
        
          });
          
          await new Promise((ret) => {
            this.downloader.on("finish", ret);
            this.downloader.multiple(this.jsonversion.checkBundle(this.options.version), this.getTotalSize(this.jsonversion.checkBundle(this.options.version)), 10);
          });
    }
    


}
module.exports = MCLCore;