import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import TwitchChat from "twitch-chat-emotes-threejs";
import { FBXLoader } from './fbxloader/FBXLoader.js';

const simplex = new SimplexNoise();

/*
** connect to twitch chat
*/

// a default array of twitch channels to join
let channels = ['moonmoon'];

// the following few lines of code will allow you to add ?channels=channel1,channel2,channel3 to the URL in order to override the default array of channels
const query_vars = {};
const query_parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    query_vars[key] = value;
});

if (query_vars.channels) {
    channels = query_vars.channels.split(',');
}

const ChatInstance = new TwitchChat({
    // If using planes, consider using MeshBasicMaterial instead of SpriteMaterial
    materialType: THREE.MeshBasicMaterial,

    // Passed to material options
    materialOptions: {
        side: THREE.DoubleSide,
        transparent: true,
    },

    channels,
    duplicateEmoteLimit: 1,
    maximumEmoteLimit: 3,
})

let borpa = false;
const borpaScale = 0.02;

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 10;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false
});
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xFFFFFF, 0.3); // soft white light
scene.add(light);


const topLight = new THREE.SpotLight(0xffffff, 1, 20, 20, 1, 0); // soft white light
topLight.position.set(0, 10, 0);
topLight.lookAt(new THREE.Vector3(0, 0, 0));

scene.add(topLight);
topLight.castShadow = true;
topLight.shadow.mapSize.width = 1024;
topLight.shadow.mapSize.height = 1024;
topLight.shadow.camera.near = 6;
topLight.shadow.camera.far = 15;
topLight.shadow.bias = -0.01;


const backLight = new THREE.SpotLight(0xff0000, 2, 20, 20, 1, 0); // soft white light
backLight.position.set(7, -7, -10);
backLight.lookAt(new THREE.Vector3(0, 0, 0));

scene.add(backLight);
backLight.castShadow = true;
backLight.shadow.mapSize.width = 1024;
backLight.shadow.mapSize.height = 1024;
backLight.shadow.camera.near = 6;
backLight.shadow.camera.far = 15;

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);


let rotationVelocity = new THREE.Vector3();

let lastFrame = Date.now();
// Called once per frame
function draw() {
    window.requestAnimationFrame(draw);

    // number of seconds since the last frame was drawn
    const delta = (Date.now() - lastFrame) / 1000;

    const noise1 = simplex.noise4D(1, 0, 0, Date.now() / 3000);
    const noise2 = simplex.noise4D(0, 1, 0, Date.now() / 3000);
    const noise3 = simplex.noise4D(0, 0, 1, Date.now() / 3000);
    rotationVelocity.x = noise1;
    rotationVelocity.y = noise2;
    rotationVelocity.z = noise3;

    try {
        //borpa.rotation.addScalar(delta * 100);
        borpa.rotation.x += delta * rotationVelocity.x;
        borpa.rotation.y += delta * rotationVelocity.y * 2;
        borpa.rotation.z += delta * rotationVelocity.z;

        borpa.scale.setScalar(((Math.sin(Date.now() / 30000) / 2 + 0.5) * 0.5 + 0.25) * borpaScale);
    } catch (e) { }

    for (let index = emoteArray.length - 1; index >= 0; index--) {
        const element = emoteArray[index];

        element.rotation.x += element.velocity.x * delta;
        element.rotation.y += element.velocity.y * delta;
        element.rotation.z += element.velocity.z * delta;

        if (element.dateSpawned < Date.now() - 10000) {
            scene.remove(element);
            emoteArray.splice(index, 1);
        }
    }

    renderer.render(scene, camera);

    lastFrame = Date.now();
}

function random3DDirection() {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;
    const vector = new THREE.Vector3(x, y, z);
    vector.normalize();
    return vector;
}

// add a callback function for when a new message with emotes is sent
const emoteSpawnDistance = 6;
const emoteArray = [];
const emoteGeometry = new THREE.PlaneBufferGeometry(1, 1);
ChatInstance.listen((emotes) => {
    const group = new THREE.Group();

    group.velocity = random3DDirection().multiplyScalar(Math.random() * 0.9 + 0.05);
    const distanceMult = (Math.random() / 2 + 0.5);
    group.scale.setScalar(distanceMult);
    const offset = random3DDirection().multiplyScalar(emoteSpawnDistance * distanceMult);

    //group.position.x = Math.random() * 5 - 2.5;
    //group.position.y = Math.random() * 5 - 2.5;
    group.dateSpawned = Date.now();

    for (let index = 0; index < emotes.length; index++) {
        const emote = emotes[index];
        const mesh = new THREE.Mesh(emoteGeometry, emote.material);
        mesh.position.copy(offset);
        mesh.position.x += index;
        mesh.lookAt(new THREE.Vector3(0, 0, 0));

        group.add(mesh);
    }
    scene.add(group);
    emoteArray.push(group);
})


const borpaMaterials = [
    new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x22B14C),
    }),
    new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xFFFFFF),
    }),
    new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xC7835E),
    }),
    new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xC7835E),
    }),
    new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x3F48CC),
    })
];
for (let index = 0; index < borpaMaterials.length; index++) {
    const element = borpaMaterials[index];
    element.side = THREE.DoubleSide;
    element.flatShading = true;
}

const loader = new FBXLoader();
loader.load('Borpa.fbx', function (object) {
    borpa = object;
    borpa.rotation.x = Math.random() * Math.PI * 2;
    borpa.rotation.y = Math.random() * Math.PI * 2;
    borpa.rotation.z = Math.random() * Math.PI * 2;
    borpa.traverse(function (child) {
        if (child.isMesh) {
            child.geometry.computeVertexNormals(true);
            child.material = borpaMaterials;
            // for (let index = 0; index < child.material.length; index++) {
            //     const mat = child.material[index];
            //     mat.map = false;
            //     mat.fog = false;
            //     mat.emissive.r = Math.random();
            //     mat.emissive.g = Math.random();
            //     mat.emissive.b = Math.random();
            //     mat.transparent = false;
            //     mat.side = THREE.DoubleSide;
            //     console.log(mat);
            // }
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    const pupilGeometry = new THREE.SphereBufferGeometry(10);
    const pupilMat = new THREE.MeshLambertMaterial({
        color: 0x222222,
        side: THREE.DoubleSide,
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMat);
    leftPupil.position.z = 201;
    leftPupil.position.y = 86;
    leftPupil.position.x = -31.5;
    borpa.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMat);
    rightPupil.position.z = 208;
    rightPupil.position.y = 65.25;
    rightPupil.position.x = 28;
    borpa.add(rightPupil);

    borpa.castShadow = true;
    borpa.receiveShadow = true;

    scene.add(borpa);
    borpa.scale.setScalar(borpaScale);
});

draw();
