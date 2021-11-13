const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');
const minecraft_url = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";

let total_size = 0;
let current_size = 0;


function hashFile(filePath) {
  const hex = crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex')
  return hex
}

/**
 * create function to download multiple files, create a folder if it doesn't exist and download the files
 * @param {any} url
 * @param {string} save_folder
 */


async function download(url, save_folder){
  if (!fs.existsSync(save_folder)) {
    fs.mkdirSync(save_folder, { recursive: true });
  
  }
  
  try {
    const resp = await fetch(url.url, {keepalive: false});
    
    const size = url.size;
    let downloadedsize = 0;
    
    resp.body.on("data", chunk => {
      downloadedsize += chunk.length
      const percent_file = Math.round(downloadedsize / size * 100)
      const percent_total = Math.round((current_size + downloadedsize) / total_size * 100)
      process.stdout.cursorTo(0);
      process.stdout.clearLine();
      process.stdout.write(`Downloading ${url.FilesName} ${percent_file}% (${percent_total}%)`);
    });
    
    resp.body.on("end", () => {
      current_size += url.size;
      process.stdout.cursorTo(0);
    })
    
    const buffer = await resp.buffer();
    const file = fs.createWriteStream(`${save_folder}/${url.FilesName}`);
    file.write(buffer);
  }
  
  catch (err) {
    console.log(err);
  }
}

module.exports.getData = async function (url, Path) {
  let URL = await fetch(url).then(res => res.json());
  URL.length = URL.length - 1;

  total_size = 0
  current_size = 0
  
  URL.forEach(url => total_size += url.size);

  for (let i = 0; i < URL.length; i++) {
    if (fs.existsSync(`${Path}/${URL[i].path}/${URL[i].FilesName}`)){
      if(hashFile(`${Path}/${URL[i].path}/${URL[i].FilesName}`) === URL[i].sha1){
      } else {
      await download(URL[i], `${Path}/${URL[i].path}`);
      }
    } else {
      await download(URL[i], `${Path}/${URL[i].path}`);
    }
  }
}

