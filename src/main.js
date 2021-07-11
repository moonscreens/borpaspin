import * as THREE from "three";
import Chat from 'twitch-chat-emotes';
import { FBXLoader } from './fbxloader/FBXLoader.js';

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

// create our chat instance
const ChatInstance = new Chat({
    channels,
    duplicateEmoteLimit: 5,
});

const emoteSources = {};
const emoteTextures = {};
const emoteMaterials = {};
let borpa = false;

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 10;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false
});
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0x444444); // soft white light
scene.add(light);


const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // soft white light
scene.add(directionalLight);

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);


let lastFrame = Date.now();
// Called once per frame
function draw() {
    window.requestAnimationFrame(draw);

    // number of seconds since the last frame was drawn
    const delta = (Date.now() - lastFrame) / 1000;

    try {
        //borpa.rotation.addScalar(delta * 100);
        borpa.rotation.x += delta / 10;
        borpa.rotation.y += delta / 10;
        borpa.rotation.z += delta / 10;
    } catch (e) {}

    // update materials for animated emotes
    for (const key in emoteMaterials) {
        if (Object.hasOwnProperty.call(emoteMaterials, key)) {
            emoteMaterials[key].needsUpdate = true;
            emoteTextures[key].needsUpdate = true;
        }
    }

    for (let index = emoteArray.length - 1; index >= 0; index--) {
        const element = emoteArray[index];

        if (index % 2) {
            element.position.z += delta;
        } else {
            element.position.z -= delta;
        }

        if (element.dateSpawned < Date.now() - 10000) {
            scene.remove(element);
            emoteArray.splice(index, 1);
        }
    }

    renderer.render(scene, camera);

    lastFrame = Date.now();
}

// add a callback function for when a new message with emotes is sent
const emoteArray = [];
ChatInstance.on("emotes", (emotes) => {
    const group = new THREE.Group();

    group.position.x = Math.random() * 5 - 2.5,
        group.position.y = Math.random() * 5 - 2.5,
        group.dateSpawned = Date.now()

    for (let index = 0; index < emotes.length; index++) {
        const emote = emotes[index];

        if (!emoteTextures[emote.id]) {
            emoteSources[emote.id] = emote;
            emoteTextures[emote.id] = new THREE.CanvasTexture(emote.gif.canvas);
            emoteTextures[emote.id].emote = emote;
            emoteTextures[emote.id].magFilter = THREE.NearestFilter;
            setTimeout(() => {
                emoteTextures[emote.id].needsUpdate = true;
            }, 1000);
            emoteMaterials[emote.id] = new THREE.SpriteMaterial({
                map: emoteTextures[emote.id],
                transparent: true,
            });
        }
        const sprite = new THREE.Sprite(emoteMaterials[emote.id]);
        sprite.position.x = index;

        group.add(sprite);
    }
    scene.add(group);
    emoteArray.push(group);
})


const borpaMaterials = [
    new THREE.MeshLambertMaterial({
        color: new THREE.Color(0x22B14C),
    }),
    new THREE.MeshLambertMaterial({
        color: new THREE.Color(0xFFFFFF),
    }),
    new THREE.MeshLambertMaterial({
        color: new THREE.Color(0xC7835E),
    }),
    new THREE.MeshLambertMaterial({
        color: new THREE.Color(0xC7835E),
    }),
    new THREE.MeshLambertMaterial({
        color: new THREE.Color(0x3F48CC),
    })
];
for (let index = 0; index < borpaMaterials.length; index++) {
    const element = borpaMaterials[index];
    element.side = THREE.DoubleSide;
    element.flatShading = false;
}

const loader = new FBXLoader();
loader.load('Borpa.fbx', function (object) {
    borpa = object;
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

    scene.add(borpa);
    borpa.scale.setScalar(0.02);
});

draw();
