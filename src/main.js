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
    materialType: THREE.MeshLambertMaterial,

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


const lightGroup = new THREE.Group();
const lightOffset = 7;
scene.add(lightGroup);
const lightSphere = new THREE.SphereBufferGeometry(0.1, 32, 32);

function enableLightShadow (light) {

	light.castShadow = true;
	light.shadow.mapSize.width = 1024*2;
	light.shadow.mapSize.height = 1024*2;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = lightOffset * 3;
}

const topLight = new THREE.SpotLight(0x55ffff, 1, lightOffset * 3, lightOffset * 3, 0.1, 0); // soft white light
topLight.add(new THREE.Mesh(
	lightSphere,
	new THREE.MeshBasicMaterial({
		color: 0x55ffff,
	})
));
topLight.position.set(0, 1, 0);
topLight.position.normalize();
topLight.position.multiplyScalar(lightOffset);
topLight.lookAt(new THREE.Vector3(0, 0, 0));
enableLightShadow(topLight);

lightGroup.add(topLight);

const backLight = new THREE.SpotLight(0xff0000, 0.25, lightOffset * 3, lightOffset * 3, 0.1, 0); // soft white light
backLight.add(
	new THREE.Mesh(
		lightSphere,
		new THREE.MeshBasicMaterial({
			color: 0xff0000,
		})
	)
);
backLight.position.set(1, -1, -1);
backLight.position.normalize();
backLight.position.multiplyScalar(lightOffset);
backLight.lookAt(new THREE.Vector3(0, 0, 0));
enableLightShadow(backLight);

lightGroup.add(backLight);

const backLight2 = new THREE.SpotLight(0xff0000, 0.25, lightOffset * 3, lightOffset * 3, 0.1, 0); // soft white light
backLight2.add(
	new THREE.Mesh(
		lightSphere,
		new THREE.MeshBasicMaterial({
			color: 0xff0000,
		})
	)
);
backLight2.position.set(-1, 0, 0);
backLight2.position.normalize();
backLight2.position.multiplyScalar(lightOffset);
backLight2.lookAt(new THREE.Vector3(0, 0, 0));
enableLightShadow(backLight2);

lightGroup.add(backLight2);

const backLight3 = new THREE.SpotLight(0xff0000, 0.25, lightOffset * 3, lightOffset * 3, 0.1, 0); // soft white light
backLight3.add(
	new THREE.Mesh(
		lightSphere,
		new THREE.MeshBasicMaterial({
			color: 0xff0000,
		})
	)
);
backLight3.position.set(0, -1, 0);
backLight3.position.normalize();
backLight3.position.multiplyScalar(lightOffset);
backLight3.lookAt(new THREE.Vector3(0, 0, 0));
enableLightShadow(backLight3);

lightGroup.add(backLight3);

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

    const noise1 = simplex.noise4D(1, 0, 0, Date.now() / 9000);
    const noise2 = simplex.noise4D(0, 0, 1, Date.now() / 9000);

	lightGroup.rotation.x = simplex.noise3D(1, 0, 0 + Date.now()/30000) * Math.PI;
	lightGroup.rotation.y = simplex.noise3D(0, 1, 0 + Date.now()/30000) * Math.PI;
	lightGroup.rotation.z = simplex.noise3D(0, 0, 1 + Date.now()/30000) * Math.PI;

    try {
        //borpa.rotation.addScalar(delta * 100);
        borpa.rotation.x = noise1;
        borpa.rotation.y += delta * Math.sin(Date.now() / 30000) * 2;
        borpa.rotation.z = noise2;

        borpa.scale.setScalar(((Math.sin(Date.now() / 30000) / 2 + 0.5) * 0.25 + 0.55) * borpaScale);
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

const spawnOffset = new THREE.Vector3(0, 0, 0);
setInterval(()=>{
	spawnOffset.x = Math.random() * 2 - 1;
	spawnOffset.y = Math.random() * 2 - 1;
	spawnOffset.z = Math.random() * 2 - 1;
	spawnOffset.normalize();
}, 10000)

function random3DDirection(noiseScalar = 0.001) {
    const x = simplex.noise4D(1, 0, 0, Date.now() * noiseScalar);
    const y = simplex.noise4D(0, 1, 0, Date.now() * noiseScalar);
    const z = simplex.noise4D(0, 0, 1, Date.now() * noiseScalar);
    const vector = new THREE.Vector3(x, y, z);
	vector.add(spawnOffset);
    vector.normalize();
    return vector;
}

// add a callback function for when a new message with emotes is sent
const emoteSpawnDistance = 4;
const emoteArray = [];
const emoteGeometry = new THREE.PlaneBufferGeometry(1, 1);
ChatInstance.listen((emotes) => {
    const group = new THREE.Group();

    group.velocity = random3DDirection(0.00004).multiplyScalar(Math.random() + 0.5);
    const distanceMult = 1 + Math.random() * 0.5;
    //group.scale.setScalar(distanceMult);
    const offset = random3DDirection(0.00002).multiplyScalar(emoteSpawnDistance * distanceMult);

    //group.position.x = Math.random() * 5 - 2.5;
    //group.position.y = Math.random() * 5 - 2.5;
    group.dateSpawned = Date.now();

    for (let index = 0; index < emotes.length; index++) {
        const emote = emotes[index];
        const mesh = new THREE.Mesh(emoteGeometry, emote.material);
		mesh.castShadow = true;
        mesh.position.copy(offset);
        mesh.position.x += index;
        mesh.lookAt(new THREE.Vector3(0, 0, 0));

        group.add(mesh);
    }
    scene.add(group);
    emoteArray.push(group);
})


const borpaMaterials = [
    new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x22B14C), // skin
    }),
    new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xFFFFFF), // eyes
    }),
    new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xC7835E), // lip
    }),
    new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xC7835E), // lip
    }),
    new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3F48CC), // clothes
    })
];
for (let index = 0; index < borpaMaterials.length; index++) {
    const element = borpaMaterials[index];
	element.metalness = 0.25;
	element.roughness = 0.5;
}

const loader = new FBXLoader();
loader.load('borpa.fbx', function (object) {
    borpa = new THREE.Group();
	borpa.add(object);
	object.position.z = -70;
	object.position.y = -20;
    //borpa.rotation.x = Math.random() * Math.PI * 2;
    //borpa.rotation.y = Math.random() * Math.PI * 2;
    //borpa.rotation.z = Math.random() * Math.PI * 2;
    object.traverse(function (child) {
        if (child.isMesh) {
			/*const tempGeometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
			tempGeometry.mergeVertices();
			tempGeometry.computeVertexNormals();
			child.geometry = new THREE.BufferGeometry().fromGeometry( tempGeometry );*/

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

    const pupilGeometry = new THREE.SphereBufferGeometry(7);
    const pupilMat = new THREE.MeshLambertMaterial({
        color: 0x222222,
        side: THREE.DoubleSide,
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMat);
    leftPupil.position.z = 208;
    leftPupil.position.y = 87;
    leftPupil.position.x = -20.3;
    object.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMat);
    rightPupil.position.z = 211.5;
    rightPupil.position.y = 74;
    rightPupil.position.x = 18.3;
    object.add(rightPupil);

    object.castShadow = true;
    object.receiveShadow = true;
    borpa.scale.setScalar(borpaScale);
    scene.add(borpa);
});

draw();
