/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

import prompt from 'prompt';

module.exports = async function (url: string) {
    console.log(`Open brosser ${url}`);
    prompt.start();
    let result: { 'copy-URL': string } = await prompt.get(['copy-URL']);
    const copyUrl: string = result['copy-URL'];
    const code = copyUrl.split("code=")[1].split("&")[0];
    return code;
}