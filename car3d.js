/**
 * ═══════════════════════════════════════════
 *  STRONG PERFORMANCE — car3d.js
 *  Motor 3D limpo e autônomo
 * ═══════════════════════════════════════════
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// ── 0. CANVAS ────────────────────────────
const canvas = document.querySelector('canvas.webgl');
if (!canvas) throw new Error('canvas.webgl not found');

// ── 1. RENDERER ──────────────────────────
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,                       // fundo transparente
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

// ── 2. SCENE ─────────────────────────────
const scene = new THREE.Scene();
// Fundo nulo → canvas fica transparente → fundo do html aparece
scene.background = null;

// ── 3. CAMERA ────────────────────────────
const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1, 100
);
camera.position.set(6, 2.5, 8);
camera.lookAt(0, 0, 0);
scene.add(camera);

// ── 4. LUZES (100 % físico, sem HDR) ─────
scene.add(new THREE.AmbientLight(0xffffff, 1.8));

const sun = new THREE.DirectionalLight(0xffffff, 6);
sun.position.set(8, 12, 10);
scene.add(sun);

const fill = new THREE.DirectionalLight(0xffffff, 3);
fill.position.set(-6, 6, -8);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xD4AF37, 1.5);   // dourada
rim.position.set(0, 4, -10);
scene.add(rim);

scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 2));

console.log('💡 Luzes OK');

// ── 5. CARREGAMENTO DO MODELO ────────────
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

let car = null;   // scene root do modelo
const allParts = [];     // todas as meshes
const techParts = [];     // rodas, freios, suspensão
const engineParts = [];     // motor, escapamento
const elecParts = [];     // faróis, fios
const bodyParts = [];     // carroceria
let bodyMats = [];     // materiais da pintura
const homePos = new Map();   // posição original de cada mesh
const homeRot = new Map();

function classify(mesh) {
    const n = mesh.name.toLowerCase();
    const mat = mesh.material && mesh.material.name ? mesh.material.name.toLowerCase() : '';

    if (/wheel|rim|disc|brake|tire|caliper|spring|shock|suspension|damper|strut|arm|wishbone|coil|axle|shaft/i.test(n) || /alloy|metal/i.test(mat)) {
        techParts.push(mesh);
    } else if (/engine|motor|exhaust|transmission|radiator|interior|seat|leather|trim/i.test(n) || /interior|leather/i.test(mat)) {
        engineParts.push(mesh);
    } else if (/light|lamp|wire|battery|glass|lens/i.test(n) || /glass|lens|light/i.test(mat)) {
        elecParts.push(mesh);
    } else {
        bodyParts.push(mesh);
    }
}

loader.load(
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb',
    (gltf) => {
        car = gltf.scene;
        car.scale.setScalar(1.2);
        car.position.y = -0.5;

        car.traverse(child => {
            if (!child.isMesh) return;
            allParts.push(child);
            homePos.set(child, child.position.clone());
            homeRot.set(child, child.rotation.clone());
            classify(child);

            // garante visibilidade
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
                m.transparent = true;
                m.opacity = 1;
                m.depthWrite = true;
                m.needsUpdate = true;
            });

            // coleta materiais de pintura
            const mn = (child.material?.name || '').toLowerCase();
            if (mn.includes('body') || mn.includes('paint') || child.name.toLowerCase().includes('body')) {
                mats.forEach(m => { if (!bodyMats.includes(m)) bodyMats.push(m); });
            }
        });

        scene.add(car);
        console.log(`🚗 Modelo carregado — ${allParts.length} meshes`);
        setupGSAP();
        setupColorPicker();
    },
    undefined,
    err => console.error('❌ Erro ao carregar modelo:', err)
);

// ── 6. GSAP + SCROLLTRIGGER ──────────────
function setupGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // --- A) EXPLOSÃO (Assembly/Disassembly) ---
    const orig = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const tlExplode = gsap.timeline({
        scrollTrigger: {
            trigger: '#step-assembly',
            start: 'top 50%',     // Atraso para dar tempo de ver o carro inteiro
            end: 'bottom center',
            scrub: 2,             // Scrub lento para suavizar o desmanche
        }
    });

    allParts.forEach(part => {
        const orig = homePos.get(part);
        const dir = orig.clone().normalize();
        if (dir.lengthSq() < 0.001) dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();

        const target = orig.clone().add(dir.multiplyScalar(3 + Math.random() * 2));
        tlExplode.fromTo(part.position,
            { x: orig.x, y: orig.y, z: orig.z },
            { x: target.x, y: target.y, z: target.z, ease: 'power2.out' },
            0);
        tlExplode.fromTo(part.rotation,
            { x: homeRot.get(part).x, y: homeRot.get(part).y },
            {
                x: homeRot.get(part).x + (Math.random() - 0.5) * 1.5,
                y: homeRot.get(part).y + (Math.random() - 0.5) * 1.5, ease: 'power2.out'
            },
            0);
    });

    // --- B) SEÇÃO: Suspensão e Freios (X-Ray) ---
    createXRay('#step-brakes', techParts,
        { x: 2.5, y: 0.3, z: -3 },
        { x: 0.8, y: -0.3, z: -1.5 }
    );

    // --- C) SEÇÃO: Motor ---
    createXRay('#step-engine', engineParts,
        { x: -1.5, y: 2, z: 3 },
        { x: 0, y: 0.5, z: 1 }
    );

    // --- D) SEÇÃO: Elétrica ---
    createXRay('#step-electrical', elecParts,
        { x: -2, y: 0.5, z: -3.5 },
        { x: -0.5, y: 0.2, z: -1.5 }
    );

    // --- E) SEÇÃO: Customizer (remonta tudo) ---
    const tlCustom = gsap.timeline({
        scrollTrigger: {
            trigger: '#step-customizer',
            start: 'top center',
            end: 'bottom center',
            scrub: 0.5,
        }
    });
    allParts.forEach(part => {
        const p = homePos.get(part);
        const r = homeRot.get(part);
        tlCustom.to(part.position, { x: p.x, y: p.y, z: p.z }, 0);
        tlCustom.to(part.rotation, { x: r.x, y: r.y, z: r.z }, 0);
        eachMat(part, m => tlCustom.to(m, { opacity: 1 }, 0));
    });

    // --- F) FADE ao entrar Sobre ---
    gsap.to(canvas, {
        scrollTrigger: {
            trigger: '#sobre',
            start: 'top 80%',
            end: 'top 20%',
            scrub: true,
        },
        opacity: 0,
    });

    console.log('🎬 GSAP animations OK');
}

/** Cria um efeito X-Ray: grupo highlighted, resto transparente */
function createXRay(trigger, highlightGroup, camPos) {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger,
            start: 'top 60%',    // Atraso: a caixa de texto começa a aparecer e depois o raio-x acende
            end: 'bottom center',
            scrub: 1.5,          // Transição lenta de opacidade
        }
    });

    // Se o grupo estiver vazio (o modelo não tem essas peças), usa techParts (rodas) como fallback visual
    const activeGroup = highlightGroup.length > 0 ? highlightGroup : techParts;

    allParts.forEach(part => {
        if (activeGroup.includes(part)) {
            // este grupo fica 100 % visível e volta à posição original
            eachMat(part, m => tl.to(m, { opacity: 1 }, 0));
            const p = homePos.get(part);
            const r = homeRot.get(part);
            if (p) tl.to(part.position, { x: p.x, y: p.y, z: p.z }, 0);
            if (r) tl.to(part.rotation, { x: r.x, y: r.y, z: r.z }, 0);
        } else {
            // demais ficam quase invisíveis
            eachMat(part, m => tl.to(m, { opacity: 0.06 }, 0));
        }
    });

    // move câmera
    tl.to(camera.position, camPos, 0);
}

/** Util: itera materiais de uma mesh */
function eachMat(mesh, fn) {
    if (!mesh.material) return;
    const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    arr.forEach(fn);
}

// ── 7. COLOR PICKER ──────────────────────
function setupColorPicker() {
    const btns = document.querySelectorAll('.color-btn');
    if (!btns.length) return;
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const c = new THREE.Color(btn.dataset.color);
            bodyMats.forEach(m => gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration: 0.5 }));
        });
    });
    btns[0]?.classList.add('active');
}

// ── 8. RESIZE ────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── 9. RENDER LOOP ───────────────────────
const clock = new THREE.Clock();

(function tick() {
    const t = clock.getElapsedTime();

    // idle rotation suave no Hero
    if (car) {
        car.rotation.y = Math.sin(t * 0.15) * 0.06;
    }

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
})();

console.log('✅ Render loop ativo');
