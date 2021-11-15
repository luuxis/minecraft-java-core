const json = require('./config.json');
const Downloader = require('./download.js');

let downloader = new Downloader();

const totsize = function getTotalSize(bundle){
    let size = 0;
    for(let file of bundle){
      size += file.size;
    }
    return size;
  }


async function test(){
downloader.on("progress", (DL, totDL) => {
    console.log(DL, totDL);
});

downloader.on("speed", (speed) => {
});

await new Promise((ret) => {
    downloader.on("finish", ret);
    downloader.multiple(json, totsize(json), 1);
});
}

test();