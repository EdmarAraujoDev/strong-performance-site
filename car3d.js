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
const cameraTarget = new THREE.Vector3(0, 0, 0);
camera.lookAt(cameraTarget);
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

// Luz fotorealista dedicada para o Motor (desligada por padrão)
// Vai acender e criar reflexos no metal bruto do Golf
const motorLight = new THREE.PointLight(0xffeedd, 0, 8);
motorLight.position.set(0, 1, 1.5); // Fica literalmente em cima do cofre do motor
scene.add(motorLight);

// Luz dedicada para a Parte Elétrica (meio do painel/cabine)
const elecLight = new THREE.PointLight(0xe0f7ff, 0, 8);
elecLight.position.set(0, 0.8, -0.5);
scene.add(elecLight);

console.log('💡 Luzes OK');

// ── 5. CARREGAMENTO DO MODELO ────────────
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

let car = null;
const allParts = [];
const techParts = [];
const engineParts = [];
const elecParts = [];
const bodyParts = [];
const bodyMats = [];
const extraSuspParts = [];
const extraElecParts = [];

const homePos = new Map();
const homeRot = new Map();

function classifyAndForce(mesh, forcedCategory) {
    const n = mesh.name.toLowerCase();
    const matName = (mesh.material && mesh.material.name) ? mesh.material.name.toLowerCase() : '';

    // As peças que vêm dos arquivos extras nunca se misturam com as rodas/fios originais do Golf
    if (forcedCategory === 'tech') return extraSuspParts.push(mesh);
    if (forcedCategory === 'elec') return extraElecParts.push(mesh);

    if (/wheel|rim|disc|brake|tire|caliper|spring|shock|suspension|damper|strut|arm|wishbone|coil|axle|shaft/i.test(n) || /alloy|metal/i.test(matName)) {
        techParts.push(mesh);
    } else if (/engine|motor|exhaust|transmission|radiator|interior|seat|leather|trim/i.test(n) || /interior|leather/i.test(matName)) {
        engineParts.push(mesh);
    } else if (/light|lamp|wire|battery|glass|lens/i.test(n) || /glass|lens|light/i.test(matName)) {
        elecParts.push(mesh);
    } else {
        bodyParts.push(mesh);
    }
}

async function loadModels() {
    try {
        const [gltfCar, gltfSusp, gltfElec] = await Promise.all([
            loader.loadAsync('golf.glb'),
            loader.loadAsync('suspensao.glb').catch(() => null),
            loader.loadAsync('parteeletrica.glb').catch(() => null)
        ]);

        car = new THREE.Group();

        // Adiciona e extrai mecânica de base do Golf
        const baseCar = gltfCar.scene;
        car.add(baseCar);

        // --- SISTEMA DE AUTO-ESCALA E AUTO-ALINHAMENTO (Calculado puramente pelo Golf) ---
        const box = new THREE.Box3().setFromObject(baseCar);
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 4.5 / maxDim;
        car.scale.setScalar(scaleFactor);

        const finalBox = new THREE.Box3().setFromObject(baseCar);
        // Aplica o scaleFactor no min.y para alinhar perfeitamente no chao PÓS-escala
        car.position.y = -(finalBox.min.y * scaleFactor) - 0.5;

        // Adiciona suspensao extra se existir - Auto-Fit
        let extraSusp;
        if (gltfSusp) {
            extraSusp = gltfSusp.scene;
            const sizeS = new THREE.Box3().setFromObject(extraSusp).getSize(new THREE.Vector3());
            const maxS = Math.max(sizeS.x, sizeS.y, sizeS.z);
            if (maxS > 0) extraSusp.scale.setScalar((maxDim * 0.4) / maxS); // Reduzido mais ainda a pedido do usuario
            car.add(extraSusp);
        }

        // Adiciona parteeletrica extra se existir - Auto-Fit
        let extraElec;
        if (gltfElec) {
            extraElec = gltfElec.scene;

            // ✅ CORREÇÃO DE ORIENTAÇÃO (vira de frente)
            extraElec.rotation.y = Math.PI;

            const sizeE = new THREE.Box3().setFromObject(extraElec).getSize(new THREE.Vector3());
            const maxE = Math.max(sizeE.x, sizeE.y, sizeE.z);
            if (maxE > 0) extraElec.scale.setScalar((maxDim * 0.9) / maxE);

            car.add(extraElec);
        }

        scene.add(car);

        // --- FILTRAGEM ---
        car.traverse(child => {
            if (!child.isMesh) return;

            child.castShadow = true;
            child.receiveShadow = true;

            allParts.push(child);
            homePos.set(child, child.position.clone());
            homeRot.set(child, child.rotation.clone());

            // Verifica de quem essa malha é filha para forçar a classificação!
            let forced = null;
            if (extraElec && extraElec.children && isChildOf(child, extraElec)) forced = 'elec';
            else if (extraSusp && extraSusp.children && isChildOf(child, extraSusp)) forced = 'tech';

            classifyAndForce(child, forced);

            // garante visibilidade inicial sem destruir reflexos PBR
            const mats = Array.isArray(child.material) ? child.material : [child.material];

            mats.forEach(m => {
                // Se for as peças extras de dentro, começa invisível para não poluir o exterior do carro!
                if (forced === 'tech' || forced === 'elec') {
                    m.transparent = true;
                    m.opacity = 0;
                    m.depthWrite = false;
                    m.needsUpdate = true;
                }

                // coleta materiais de pintura filtrados
                const matName = (m.name || '').toLowerCase();
                const meshName = child.name.toLowerCase();

                let isPaint = matName.includes('paint') || matName.includes('body') || matName.includes('carrosserie') || matName.includes('color');
                if (!isPaint && meshName.includes('body')) {
                    isPaint = true;
                }

                if (matName.includes('glass') || matName.includes('plastic') || matName.includes('chrome') ||
                    matName.includes('window') || matName.includes('tire') || matName.includes('wheel') ||
                    matName.includes('black') || matName.includes('grill') || matName.includes('light')) {
                    isPaint = false;
                }

                if (isPaint && !bodyMats.includes(m)) {
                    bodyMats.push(m);
                }
            });
        });

        console.log(`🚗 Modelo Combinado carregado — ${allParts.length} meshes`);
        console.log(` -> Elétrica extra detectada: ${gltfElec ? 'Sim' : 'Não'}`);
        console.log(` -> Suspensão extra detectada: ${gltfSusp ? 'Sim' : 'Não'}`);
        setupGSAP();
        setupColorPicker();

    } catch (err) {
        console.error('Erro ao baixar GLB:', err);
    }
}

// Auxiliar para verificação de parentesco longo na Arvore 3D
function isChildOf(child, parentGroup) {
    let current = child;
    while (current && current !== scene) {
        if (current === parentGroup) return true;
        current = current.parent;
    }
    return false;
}

loadModels();

// ── 6. ANIMAÇÕES (GSAP) ───────────────────
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

    // --- B) SEÇÃO: Suspensão e Freios (Isolada pros arquivos do usuario) ---
    // Box Right -> Car Left -> target.x = 1.0
    createXRay('#step-brakes', extraSuspParts,
        { x: 4.5, y: -0.2, z: -3 }, // camPos
        { x: 1.0, y: -0.5, z: 0 },  // target
        null
    );

    // --- C) SEÇÃO: Motor ---
    // Box Left -> Car Right -> target.x = -1.2
    createXRay('#step-engine', engineParts,
        { x: -1.0, y: 1.5, z: 3.5 }, // camPos
        { x: -0.5, y: 0.2, z: 0 }    // target


    );

    // --- D) SEÇÃO: Elétrica (Isolada pros arquivos do usuario) ---
    // Box Right -> Car Left -> target.x = 1.2
    createXRay('#step-electrical', extraElecParts,
        { x: -2, y: 0.5, z: -3.5 }, // camPos
        { x: 1.2, y: 0.2, z: 0 }    // target
    );

    // --- E) SEÇÃO: Customizer (remonta tudo) ---
    const tlCustom = gsap.timeline({
        scrollTrigger: {
            trigger: '#step-customizer',
            start: 'top 60%',
            end: 'bottom center',
            scrub: 1.5,
        }
    });

    // Centraliza câmera e target
    tlCustom.to(camera.position, { x: -3.5, y: 1, z: 3.5 }, 0);
    tlCustom.to(cameraTarget, { x: 0, y: 0, z: 0 }, 0);

    allParts.forEach(part => {
        const p = homePos.get(part);
        const r = homeRot.get(part);
        tlCustom.to(part.position, { x: p.x, y: p.y, z: p.z }, 0);
        tlCustom.to(part.rotation, { x: r.x, y: r.y, z: r.z }, 0);
        eachMat(part, m => {
            // Remonta 100% de opacidade A MENOS QUE seja as partes internas (senão furam a lataria!)
            if (extraElecParts.includes(part) || extraSuspParts.includes(part)) {
                tlCustom.to(m, { opacity: 0, onStart: () => m.transparent = true }, 0);
            } else {
                tlCustom.to(m, { opacity: 1, onStart: () => { m.depthWrite = true; m.transparent = true; } }, 0);
            }
            // Restaura brilho metálico se foi alterado
            tlCustom.to(m.color, { r: 1, g: 1, b: 1 }, 0);
        });
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

/** Cria um efeito X-Ray: grupo highlighted, resto transparente e câmera alinhada */
function createXRay(trigger, highlightGroup, camPos, lookAtPos) {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger,
            start: 'top 70%',    // A peça começa a se formar assim que o box do texto sobe da barra inferior
            end: 'center center',// Termina EXACTAMENTE quando o texto atinge o equador do celular (meio do caminho)
            scrub: 1.0,          // Mais rápido e responsivo
        }
    });

    // Se o grupo estiver vazio, reverte pra esconder tudo (fallback)
    const activeGroup = highlightGroup;

    allParts.forEach(part => {
        if (activeGroup.includes(part)) {
            // Este grupo que o usuario enviou fica 100% visível
            eachMat(part, m => {
                tl.to(m, { opacity: 1, onStart: () => { m.depthWrite = true; m.transparent = true; } }, 0);
            });
            const p = homePos.get(part);
            const r = homeRot.get(part);
            if (p) tl.to(part.position, { x: p.x, y: p.y, z: p.z }, 0);
            if (r) tl.to(part.rotation, { x: r.x, y: r.y, z: r.z }, 0);
        } else {
            // Demais peças evapóram completamente (opacity 0)
            eachMat(part, m => {
                tl.to(m, { opacity: 0, onStart: () => { m.depthWrite = false; m.transparent = true; } }, 0);
            });
        }
    });

    // move câmera e alinha o eixo central (target) focando longe do texto
    tl.to(camera.position, camPos, 0);
    if (lookAtPos) tl.to(cameraTarget, lookAtPos, 0);

    // Sistema de Iluminação natural: Acende foco de estúdio em cima da peça na seção correspondente!
    if (highlightGroup === engineParts) {
        tl.to(motorLight, { intensity: 20 }, 0); // Estoura uma luz cinematográfica no motor
        tl.to(elecLight, { intensity: 0 }, 0);
    } else if (highlightGroup === elecParts || highlightGroup === extraElecParts) {
        tl.to(motorLight, { intensity: 0 }, 0);
        tl.to(elecLight, { intensity: 20 }, 0); // Acende holofote na elétrica
    } else if (highlightGroup === techParts || highlightGroup === extraSuspParts) {
        tl.to(motorLight, { intensity: 10 }, 0); // Luz suave para suspensão
        tl.to(elecLight, { intensity: 0 }, 0);
    } else {
        tl.to(motorLight, { intensity: 0 }, 0);
        tl.to(elecLight, { intensity: 0 }, 0);
    }
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
    if (car && window.scrollY < 200) {
        car.rotation.y = Math.sin(t * 0.15) * 0.05;
    }

    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
})();

console.log('✅ Render loop ativo');
