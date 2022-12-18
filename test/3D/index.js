let skinUrl = 'http://textures.minecraft.net/texture/ac3de5b50fb6174da51032677ead046295486bf682b3ea73e0617a210c4b4f46'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1000 / 500, 0.1, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(1000, 500);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: '#F1F1F1'});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 2;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.05;
    renderer.render(scene, camera);
};

animate();