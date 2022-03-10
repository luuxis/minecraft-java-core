'use strict';
const path = require('path')
const win = nw.Window.get();

const defaultProperties = {
    width: 1000,
    height: 650,
    resizable: false,
    position: "center",
    frame: (process.platform == "win32") ? true : false,
    icon: path.join(__dirname, '../../../assets/icons/microsoft.png')
}

module.exports = async function(url) {
    await new Promise((resolve) => {
        win.cookies.getAll({ domain: "live.com" }, async(cookies) => {
            for await (let cookie of cookies) {
                let url = `http${cookie.secure ? "s" : ""}://${cookie.domain.replace(/$\./, "") + cookie.path}`;
                win.cookies.remove({ url: url, name: cookie.name });
            }
            return resolve();
        });
    });

    let code = await new Promise((resolve) => {
        nw.Window.open(url, defaultProperties, (Window) => {
            let interval = null;
            let code;
            interval = setInterval(() => {
                if (Window.window.document.location.href.startsWith("https://login.live.com/oauth20_desktop.srf")) {
                    clearInterval(interval);
                    try {
                        code = Window.window.document.location.href.split("code=")[1].split("&")[0];
                    } catch (e) {
                        code = "cancel";
                    }
                    Window.close();
                }
            }, 100);

            Window.on('closed', () => {
                if (!code) code = "cancel";
                if (interval) clearInterval(interval);
                resolve(code);
            });
        });
    });
    return code
}