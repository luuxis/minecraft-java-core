const { skin } = require('../index');

((async () => {
    let profile = await skin.skin('access_token', 'https://textures.minecraft.net/texture/ac3de5b50fb6174da51032677ead046295486bf682b3ea73e0617a210c4b4f46');
    console.log(profile);
})());