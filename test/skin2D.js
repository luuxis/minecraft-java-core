const { Skin } = require('../index');
const nodeFetch = require('node-fetch');
let skinURL = 'http://textures.minecraft.net/texture/ac3de5b50fb6174da51032677ead046295486bf682b3ea73e0617a210c4b4f46';

async function main() {
    let skinBuffer = await nodeFetch(skinURL).then(res => res.buffer());
    let skin = await new Skin.SkinTexture2D(skinBuffer).getSkin();
    console.log(skin);
}

main();