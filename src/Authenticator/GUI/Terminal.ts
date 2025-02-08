/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */

import prompt from 'prompt';

module.exports = async function (url: string) {
    console.log(`Open brosser ${url}`);
    prompt.start();
    let result = await prompt.get(['copy-URL']);
    return result['copy-URL'].split("code=")[1].split("&")[0];
}