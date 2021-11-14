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
      process.stdout.clearLine();
      console.log(`Downloading ${url.FilesName}`);
    })
    
    const buffer = await resp.buffer();
    const file = fs.createWriteStream(`${save_folder}/${url.FilesName}`);
    file.write(buffer);
  }
  
  catch (err) {
    console.log(err);
  }
}