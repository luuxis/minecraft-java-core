/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

export default class MinecraftLoader {
    options: any;
    constructor(options: any) {
        this.options = options;
    }
 
    async ProcessJson(version: any) {
        console.log(version.libraries)
        return version;
    }
}