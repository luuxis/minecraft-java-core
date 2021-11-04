const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');


function hashFile(filePath) {
  const hex = crypto.createHash('MD5').update(fs.readFileSync(filePath)).digest('hex')
  return hex
}

async function getData(url, Path) {
  let URL = await fetch(url).then(res => res.json());
  URL.length = URL.length - 1;
  for (let i = 0; i < URL.length; i++){
    if(!fs.existsSync(`${Path}/${URL[i].path.replace("files/", "")}`)){
      fs.mkdirSync(`${Path}/${URL[i].path.replace("files/", "")}`, { recursive: true })
    }
  }
}

getData('http://127.0.0.1', './minecraft');

