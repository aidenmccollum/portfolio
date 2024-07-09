import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { determineOrbit } from './calcs.js';

//defining common variables
var lookTarget = new THREE.Vector3(-2500,0,0);
var currentLook = new THREE.Vector3(-2500,0,0);
var panSpeed = 100; // the higher the value, the slower the pan


// defining scene and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 40000 );
camera.position.set(0, 2000, 6500);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild( renderer.domElement );

const textureLoader = new THREE.TextureLoader();
// //ambient lighting
const light = new THREE.AmbientLight( 0x404040, 0.25); // soft white light
scene.add( light );

//sunlight
const sunlight = new THREE.PointLight(0xffffff, 2000000);
sunlight.castShadow = true; 
scene.add(sunlight);

//controls - implemented later
const controls = new OrbitControls( camera, renderer.domElement );
controls.enabled = false;
const loader = new GLTFLoader();

//adding cube (for demonstration)
// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

//bloom renderer - for accurate visual effects
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 2; //intensity of glow
bloomPass.radius = 0;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

//sun object
const sunGeometry = new THREE.SphereGeometry(696.34, 400, 200); //radius in 1000's of km
const sunMaterial = new THREE.MeshStandardMaterial({
    emissiveIntensity:1,
    emissive: 0xffd700
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);


console.log('rendering view')

//generating an earth centered system
const earthSystem = new THREE.Group()

const earthR = 250;
const earthS = 500;
const tilt = 0.41; //earth axis tilt in radiuams

//creating the earth
const earthColor = textureLoader.load("../static/assets/earth_texture/earthmap1k.jpg")
const earthBump = textureLoader.load("../static/assets/earth_texture/earthbump1k.jpg")
const earthSpec = textureLoader.load("../static/assets/earth_texture/earthspec1k.jpg")

const earthGeometry = new THREE.SphereGeometry(earthR, earthS, earthS);
const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthColor,
    bumpMap: earthBump,
    bumpScale: 0.5,
    specularMap: earthSpec,
    shininess: 0.5,
});
const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

earthMesh.rotation.z = tilt;

earthSystem.add(earthMesh);

//atmosphere
// const atmosphereGeometry = new THREE.SphereGeometry(earthR+1, earthS, earthS);
// const atmosphereMat = new THREE.MeshPhongMaterial({
//     emissive: 0x0328fc,
//     emissiveIntensity: 3,
//     transparent: true,
//     opacity: 0.01
// })

// const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMat);

// earthSystem.add(atmosphere);

//MOON
const moonGeometry = new THREE.SphereGeometry(50, 40, 20);
const moonMaterial = new THREE.MeshStandardMaterial({
    color: 0x878787
});
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);

moonMesh.position.set(500,0,0);
earthSystem.add(moonMesh);

scene.add(earthSystem)

//shadowing for the system
renderer.shadowMap.enabled = true;
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 512;
sunlight.shadow.mapSize.height = 512;
sunlight.shadow.camera.near = 150; //shadows start 150 m from light
sunlight.shadow.camera.far = 350; //shadows end 350 m from light


//adding shadow interations for earth
earthMesh.castShadow = true;
earthMesh.receiveShadow = true;
moonMesh.receiveShadow = true;
moonMesh.castShadow = true;

//generating the earths orbit path
// let x = 0;
// let a = 0;
// let b = 0;
// x, a, b = determineOrbit(0.0167086, 152100, 147100);
// const curve = new THREE.EllipseCurve(
//     x,0,
//     a,b,
//     0, 2*Math.PI,
// )

// fake orbit
const curve = new THREE.EllipseCurve(
    0,0,
    2500,3000,
    0, 2*Math.PI,
)

const points = curve.getSpacedPoints(200); //divide orbit into 200 even pieces

const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({color: 0x333333, transparent: true, opacity: 0.5});

const orbit = new THREE.Line(geometry, material);
orbit.rotateX(-Math.PI/2); //rotated -90 degrees to be on y axis
scene.add(orbit);

//orbiting animation constants
const loopTime = 1;
const earthOrbitSpeed = 0.00001;
const moonOrbitRadius = 500;
const moonOrbitSpeed = 80;

//default look at side
camera.lookAt(lookTarget);

function animate() {
    
    //move earth around the sun
    const time = earthOrbitSpeed * performance.now();
    const t = (time % loopTime)/loopTime;

    let p = curve.getPoint(t);//returns vector of where you are on the orbit at any time
    // console.log(p, t);

    earthSystem.position.x = p.x;
    earthSystem.position.z = p.y;

    //move moon around the earth
    moonMesh.position.x = -Math.cos(time * moonOrbitSpeed) * moonOrbitRadius;
    moonMesh.position.z = -Math.sin(time * moonOrbitSpeed) * moonOrbitRadius;

    //rotate bodies around their axes
    sun.rotation.y += 0.0008;
    earthMesh.rotation.y+=0.0015;
    moonMesh.rotation.y +=0.0001;


    //move the camera if the locations dont match
    if (lookTarget != currentLook) {
        let dirX =  (lookTarget.x - currentLook.x)/panSpeed;
        let dirY = (lookTarget.y - currentLook.y)/panSpeed;
        let dirZ = (lookTarget.z - currentLook.z)/panSpeed;

        currentLook.x += dirX;
        currentLook.y += dirY;
        currentLook.z += dirZ;

        camera.lookAt(currentLook);
    }




	renderer.render( scene, camera );
    // camera.layers.set(1);
    bloomComposer.render();
}
renderer.setAnimationLoop( animate );



// HTML Relevant JS
document.getElementById("damoon").onclick = function() {
    controls.enabled = true;
    document.getElementById("intro-box").classList.add('hidden');
    document.getElementById("action-div").classList.add('hidden');
    setTimeout(function(){
        lookTarget = new THREE.Vector3(0,0,0);
    }, 400);
    
};