/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */


interface launchOptions {
    url: string | null,
    authenticator: object | null,
    path: string | '.Minecraft',
    version: string | 'latest_release',
    detached: boolean | false,
    downloadFileMultiple: number | 3,

    modde: boolean | false,
    loader: {
        type: string 
        build: string | 'latest'
        config: {
            javaPath: string | null,
            minecraftJar: string | null,
            minecraftJson: string | null,
        }
    },

    verify: boolean | false,
    ignored: any | [],
    args: any | [],

    javaPath: string | null,
    java: boolean | false,

    screen: {
        width: number | null,
        height: number | null,
        fullscreen: boolean | false,
    },

    memory: {
        min: string | '1G',
        max: string | '2G',
    }
}


export default class Launch {
    async start(opt: launchOptions) {
        return opt
    }
}