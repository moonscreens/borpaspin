import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import TwitchChat from "twitch-chat-emotes-threejs";
import { FBXLoader } from './fbxloader/FBXLoader.js';
import Stats from "stats.js";

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

let stats = false;
if (query_vars.stats) {
	stats = new Stats();
	stats.showPanel(1);
	document.body.appendChild(stats.dom);
}

const ChatInstance = new TwitchChat({
	// If using planes, consider using MeshBasicMaterial instead of SpriteMaterial
	materialType: THREE.MeshPhongMaterial,

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
const borpaScale = 0.0175;

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 10;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
	antialias: false,
	alpha: false
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xFFFFFF, 0.3); // soft white light
scene.add(light);


const lightOffset = 15;
const lightSphere = new THREE.SphereBufferGeometry(0.1, 32, 32);

const lightGroups = [];
function groupLight(light, castShadow = false) {

	topLight.add(new THREE.Mesh(
		lightSphere,
		new THREE.MeshBasicMaterial({
			color: light.color,
		})
	));

	const group = new THREE.Group();
	group.add(light);
	scene.add(group);
	lightGroups.push(group);

	light.position.multiplyScalar(lightOffset);
	if (castShadow) enableLightShadow(light);

	// add light helper
	//const helper = new SpotLightHelper(light);
	//scene.add(helper);

	return group;
}
function enableLightShadow(light) {
	light.castShadow = true;
	light.shadow.mapSize.width = 1024 * 3;
	light.shadow.mapSize.height = 1024 * 3;
	light.shadow.camera.near = 0.25;
	light.shadow.camera.far = lightOffset * 2;
	light.shadow.bias = -0.00001;
}

const topLight = new THREE.SpotLight(0x55ffff, 0.75, lightOffset * 3, 1, 0.1, 0); // soft white light
topLight.position.set(0, 1, 0);
topLight.position.normalize();
topLight.lookAt(new THREE.Vector3(0, 0, 0));
groupLight(topLight, true);

const topLight2 = new THREE.SpotLight(0x55ffff, 0.75, lightOffset * 3, 1, 0.1, 0); // soft white light
topLight2.position.set(0, -1, 0);
topLight2.position.normalize();
topLight2.lookAt(new THREE.Vector3(0, 0, 0));
groupLight(topLight2, true);

const backLight = new THREE.SpotLight(0xff4400, 0.4, lightOffset * 3, 1, 0.1, 0); // soft white light
backLight.position.set(1, -1, -1);
backLight.position.normalize();
backLight.lookAt(new THREE.Vector3(0, 0, 0));
groupLight(backLight);

const backLight2 = new THREE.SpotLight(0xff4400, 0.4, lightOffset * 3, 1, 0.1, 0); // soft white light
backLight2.position.set(-1, 0, 0);
backLight2.position.normalize();
backLight2.lookAt(new THREE.Vector3(0, 0, 0));
groupLight(backLight2);

const backLight3 = new THREE.SpotLight(0xff4400, 0.4, lightOffset * 3, 1, 0.1, 0); // soft white light
backLight3.position.set(0, -1, 0);
backLight3.position.normalize();
backLight3.lookAt(new THREE.Vector3(0, 0, 0));
groupLight(backLight3);

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
	if (stats) stats.begin();
	window.requestAnimationFrame(draw);

	// number of seconds since the last frame was drawn
	const delta = (Date.now() - lastFrame) / 1000;

	const noise1 = simplex.noise4D(1, 0, 0, Date.now() / 9000);
	const noise2 = simplex.noise4D(0, 0, 1, Date.now() / 9000);

	for (let index = 0; index < lightGroups.length; index++) {
		const element = lightGroups[index];
		element.rotation.x = simplex.noise3D(1, 0 + index * 1000, 0 + Date.now() / 30000) * Math.PI;
		element.rotation.y = simplex.noise3D(0, 1 + index * 1000, 0 + Date.now() / 30000) * Math.PI;
		element.rotation.z = simplex.noise3D(0, 0 + index * 1000, 1 + Date.now() / 30000) * Math.PI;

	}

	try {
		//borpa.rotation.addScalar(delta * 100);
		borpa.rotation.x = noise1;
		borpa.rotation.y += delta * Math.sin(Date.now() / 30000) * 2;
		borpa.rotation.z = noise2;
	} catch (e) { }

	for (let i = emoteArray.length - 1; i >= 0; i--) {
		emoteArray[i].rotation.x += emoteArray[i].velocity.x * delta;
		emoteArray[i].rotation.y += emoteArray[i].velocity.y * delta;
		emoteArray[i].rotation.z += emoteArray[i].velocity.z * delta;

		const p = (Date.now() - emoteArray[i].dateSpawned) / emoteArray[i].lifespan;
		if (p < 0.25) {
			emoteArray[i].scale.setScalar(easeInOutSine(p * 4));
		} else if (p < 0.75) {
			emoteArray[i].scale.setScalar(1);
		} else {
			emoteArray[i].scale.setScalar(easeInOutSine(1 - ((p - 0.75) * 4)));
		}

		if (p >= 1) {
			scene.remove(emoteArray[i]);
			emoteArray.splice(i, 1);
		}
	}

	renderer.render(scene, camera);

	lastFrame = Date.now();
	if (stats) stats.end();
}

function easeInOutSine(t) {
	return -0.5 * (Math.cos(Math.PI * t) - 1);
}

const spawnOffset = new THREE.Vector3(0, 0, 0);
setInterval(() => {
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
const emoteGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
ChatInstance.listen((emotes) => {
	const group = new THREE.Group();

	group.velocity = random3DDirection(0.00004).multiplyScalar(Math.random() + 0.5);
	const distanceMult = 1 + Math.random() * 0.5;
	const offset = random3DDirection(0.00002).multiplyScalar(emoteSpawnDistance * distanceMult);

	group.dateSpawned = Date.now();
	group.lifespan = 7000 + Math.random() * 10000;

	for (let index = 0; index < emotes.length; index++) {
		const emote = emotes[index];
		const mesh = new THREE.Mesh(emoteGeometry, emote.material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.position.copy(offset);
		mesh.position.x += index;
		mesh.lookAt(new THREE.Vector3(0, 0, 0));

		group.add(mesh);
	}
	scene.add(group);
	emoteArray.push(group);
})

new THREE.TextureLoader().load('/space.avif', (texture) => {
	const envMap = texture;
	envMap.mapping = THREE.EquirectangularRefractionMapping;

	scene.environment = envMap;

	borpaMaterials.forEach(element => {
		element.envMap = envMap;
		element.needsUpdate = true;
	});
})

const borpaMatDefaults = {
	shininess: 25,
	reflectivity: 0.25,
	refractionRatio: 0.97,
}
const borpaMaterials = [
	new THREE.MeshPhongMaterial({
		color: new THREE.Color(0x22B14C), // skin
		...borpaMatDefaults,
	}),
	new THREE.MeshPhongMaterial({
		color: new THREE.Color(0xFFFFFF), // eyes
		...borpaMatDefaults,
		shininess: 100,
		reflectivity: 0.25,
	}),
	new THREE.MeshPhongMaterial({
		color: new THREE.Color(0xC7835E), // lip
		...borpaMatDefaults,
	}),
	new THREE.MeshPhongMaterial({
		color: new THREE.Color(0xC7835E), // lip
		...borpaMatDefaults,
	}),
	new THREE.MeshPhongMaterial({
		color: new THREE.Color(0x3F48CC), // clothes
		...borpaMatDefaults,
		reflectivity: 0.1,
		shininess: 0,
	}),
	new THREE.MeshPhongMaterial({
		color: new THREE.Color(0x222222), // lip
		...borpaMatDefaults,
		reflectivity: 0.5,
		shininess: 100,
	}),
];

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
	const pupilMat = borpaMaterials[borpaMaterials.length - 1];
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
