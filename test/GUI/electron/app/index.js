const { microsoft } = require('minecraft-java-core');
const Minecraft = new microsoft();

let login_btn = document.querySelector('.login');

login_btn.addEventListener('click', async () => {
    await Minecraft.getAuth()
})



