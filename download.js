const fetch = require("node-fetch");
const fs = require("fs");

let size = 0;
let downloadedsize = 0;

/**
 * create function to download multiple files, create a folder if it doesn't exist and download the files
 * @param {string} url
 * @param {string} path
 * @param {string} filename
 */
const download = (url, path, filename) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  const file = fs.createWriteStream(`${path}/${filename}`);
  const request = fetch(url);
  request.then(response => {
      response.body.on("data", chunk => {
        downloadedsize += chunk.length;
        const percent = (downloadedsize / size) * 100;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${percent.toFixed(0)}%`);
      });
      response.body.on("end", () => {
        file.end();
        console.log("Downloaded");
      });
    })
    .catch(err => {
      console.log(err);
    });
};

download("https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", "./", "google.png");

