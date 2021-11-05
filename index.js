const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');


function hashFile(filePath) {
  const hex = crypto.createHash('MD5').update(fs.readFileSync(filePath)).digest('hex')
  return hex
}

const request = require('request');
/**
 * download file from url, and save to folder
 * @param {string} url
 * @param {string} path
 * @param {string} filename
 */
function download(url, path, filename) {
  request.get(url).on('error', function (err) {
    console.log(err);
  }).pipe(fs.createWriteStream(path + filename));
}

async function getData(url, Path) {
  let URL = await fetch(url).then(res => res.json());
  URL.length = URL.length - 1;
  
  for (let i = 0; i < URL.length; i++){
    if(!fs.existsSync(`${Path}/${URL[i].path}`)){
      fs.mkdirSync(`${Path}/${URL[i].path}`, { recursive: true })
    } 
      download(URL[i].url, `${Path}/${URL[i].path}/`, URL[i].FilesName);
    
  }
}

getData('http://127.0.0.1', './minecraft');

