/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import path from 'path';
import fs from 'fs';
import os from 'os';


export default class MinecraftLoader {
    options: any;
    constructor(options: any) {
        this.options = options;
    }

    async ProcessJson(version: any) {
        let archMapping: any = { arm64: "aarch64", arm: 'aarch' }[os.arch()]
        let pathLWJGL = path.join(__dirname, `../../assets/LWJGL/${archMapping}`);

        let versionJinput = version.libraries.find((lib: any) => {
            if (lib.name.startsWith("net.java.jinput:jinput-platform:")) {
                return true;
            } else if (lib.name.startsWith("net.java.jinput:jinput:")) {
                return true;
            }
        })?.name.split(":").pop();

        let versionLWJGL = version.libraries.find((lib: any) => {
            if (lib.name.startsWith("org.lwjgl:lwjgl:")) {
                return true;
            } else if (lib.name.startsWith("org.lwjgl.lwjgl:lwjgl:")) {
                return true;
            }
        })?.name.split(":").pop();


        if (versionJinput) {
            version.libraries = version.libraries.filter((lib: any) => {
                if (lib.name.includes("jinput")) return false
                return true;
            });
        }

        if (versionLWJGL) {
            version.libraries = version.libraries.filter((lib: any) => {
                if (lib.name.includes("lwjgl")) return false;
                return true;
            });

            if (versionLWJGL.includes('2.9')) {
                let versionLWJGLNatives = JSON.parse(fs.readFileSync(path.join(pathLWJGL, '2.9.4.json'), 'utf-8'));
                version.libraries.push(...versionLWJGLNatives.libraries);
            } else {
                let versionLWJGLNatives = JSON.parse(fs.readFileSync(path.join(pathLWJGL, `${versionLWJGL}.json`), 'utf-8'));
                version.libraries.push(...versionLWJGLNatives.libraries);
            }


        }

        return version;
    }
}