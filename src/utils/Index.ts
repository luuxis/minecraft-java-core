/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

export function getPathLibraries(main: any, nativeString?: any, forceExt?: any) {
    let libSplit = main.split(':')
    let fileName = libSplit[3] ? `${libSplit[2]}-${libSplit[3]}` : libSplit[2];
    let finalFileName = fileName.includes('@') ? fileName.replace('@', '.') : `${fileName}${nativeString || ''}${forceExt || '.jar'}`;
    let pathLib = `${libSplit[0].replace(/\./g, '/')}/${libSplit[1]}/${libSplit[2].split('@')[0]}`
    return {
        path: pathLib,
        name: `${libSplit[1]}-${finalFileName}`
    };
}