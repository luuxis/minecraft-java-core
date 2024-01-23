import { spawn } from 'child_process';
import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events';

import { getPathLibraries, getFileFromArchive } from '../utils/Index.js';

export default class forgePatcher extends EventEmitter {
    options: any;

    constructor(options: any) {
        super();
        this.options = options;
    }

    async patcher(profile: any, config: any, neoForgeOld: boolean = true) {
        let { processors } = profile;

        for (let key in processors) {
            if (Object.prototype.hasOwnProperty.call(processors, key)) {
                let processor = processors[key];
                if (processor?.sides && !(processor?.sides || []).includes('client')) {
                    continue;
                }

                let jar = getPathLibraries(processor.jar)
                let filePath = path.resolve(this.options.path, 'libraries', jar.path, jar.name)

                let args = processor.args.map(arg => this.setArgument(arg, profile, config, neoForgeOld)).map(arg => this.computePath(arg));
                let classPaths = processor.classpath.map(cp => {
                    let classPath = getPathLibraries(cp)
                    return `"${path.join(this.options.path, 'libraries', `${classPath.path}/${classPath.name}`)}"`
                });
                let mainClass = await this.readJarManifest(filePath);

                await new Promise((resolve: any) => {
                    const ps = spawn(
                        `"${path.resolve(config.java)}"`,
                        [
                            '-classpath',
                            [`"${filePath}"`, ...classPaths].join(path.delimiter),
                            mainClass,
                            ...args
                        ], { shell: true }
                    );

                    ps.stdout.on('data', data => {
                        this.emit('patch', data.toString('utf-8'))
                    });

                    ps.stderr.on('data', data => {
                        this.emit('patch', data.toString('utf-8'))
                    });

                    ps.on('close', code => {
                        if (code !== 0) {
                            this.emit('error', `Forge patcher exited with code ${code}`);
                            resolve();
                        }
                        resolve();
                    });
                });
            }
        }

    }

    check(profile: any) {
        let files = [];
        let { processors } = profile;

        for (let key in processors) {
            if (Object.prototype.hasOwnProperty.call(processors, key)) {
                let processor = processors[key];
                if (processor?.sides && !(processor?.sides || []).includes('client')) continue;

                processor.args.map(arg => {
                    let finalArg = arg.replace('{', '').replace('}', '');
                    if (profile.data[finalArg]) {
                        if (finalArg === 'BINPATCH') return
                        files.push(profile.data[finalArg].client)
                    }
                })
            }
        }

        files = files.filter((item, index) => files.indexOf(item) === index);

        for (let file of files) {
            let libMCP = getPathLibraries(file.replace('[', '').replace(']', ''))
            file = `${path.resolve(this.options.path, 'libraries', `${libMCP.path}/${libMCP.name}`)}`;
            if (!fs.existsSync(file)) return false
        }
        return true;
    }

    setArgument(arg: any, profile: any, config: any, neoForgeOld) {
        let finalArg = arg.replace('{', '').replace('}', '');
        let universalPath = profile.libraries.find(v => {
            if (this.options.loader.type === 'forge') return (v.name || '').startsWith('net.minecraftforge:forge')
            if (this.options.loader.type === 'neoforge') return (v.name || '').startsWith(neoForgeOld ? 'net.neoforged:forge' : 'net.neoforged:neoforge')
        })

        if (profile.data[finalArg]) {
            if (finalArg === 'BINPATCH') {
                let clientdata = getPathLibraries(profile.path || universalPath.name)
                return `"${path
                    .join(this.options.path, 'libraries', `${clientdata.path}/${clientdata.name}`)
                    .replace('.jar', '-clientdata.lzma')}"`;
            }
            return profile.data[finalArg].client;
        }

        return arg
            .replace('{SIDE}', `client`)
            .replace('{ROOT}', `"${path.dirname(path.resolve(this.options.path, 'forge'))}"`)
            .replace('{MINECRAFT_JAR}', `"${config.minecraft}"`)
            .replace('{MINECRAFT_VERSION}', `"${config.minecraftJson}"`)
            .replace('{INSTALLER}', `"${this.options.path}/libraries"`)
            .replace('{LIBRARY_DIR}', `"${this.options.path}/libraries"`);
    }

    computePath(arg: any) {
        if (arg[0] === '[') {
            let libMCP = getPathLibraries(arg.replace('[', '').replace(']', ''))
            return `"${path.join(this.options.path, 'libraries', `${libMCP.path}/${libMCP.name}`)}"`;
        }
        return arg;
    }

    async readJarManifest(jarPath: string) {
        let extraction: any = await getFileFromArchive(jarPath, 'META-INF/MANIFEST.MF');

        if (extraction) return (extraction.toString("utf8")).split('Main-Class: ')[1].split('\r\n')[0];
        return null;
    }
}