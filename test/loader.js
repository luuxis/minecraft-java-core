let opt = {
    path: './.Minecraft',
    timeout: 10000,
    autoClean: true,
    loader: {
        type: 'forge',
        version: '1.12.2',
        build: '1.12.2-14.23.5.2860',
        config: false
    }
}

let loader = new loaderDownloader(opt);

loader.install();

loader.on('json', json => {
    console.log(json);
});

loader.on('extract', extract => {
    console.log(extract);
});

loader.on('progress', (progress, size, element) => {
    console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
});

loader.on('check', (progress, size, element) => {
    console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
});

loader.on('patch', patch => {
    console.log(patch);
});

loader.on('error', err => {
    console.log(err);
});