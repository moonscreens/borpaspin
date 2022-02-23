import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';

import { renderer, scene, camera } from './main';

export default function () {
	const composer = new EffectComposer(renderer);
	const ssrPass = new SSRPass({
		renderer,
		scene,
		camera,
		width: innerWidth,
		height: innerHeight,
		selects: null,
	});
	
	ssrPass.thickness = 0.018;
	ssrPass.infiniteThick = false;
	ssrPass.opacity = 0.25;
	composer.addPass(ssrPass);

	return composer;
}