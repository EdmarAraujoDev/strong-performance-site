/**
 * ═══════════════════════════════════════════════════════
 *  STRONG PERFORMANCE — 3D Interactive Engine v4.0
 *  Arquitetura limpa, modular e resiliente
 * ═══════════════════════════════════════════════════════
 *
 *  COMO TROCAR O MODELO 3D:
 *  1. Substitua a URL em CONFIG.modelUrl pelo caminho do seu .glb
 *  2. Atualize os arrays de nomes em CONFIG.partNames para corresponder
 *     aos nomes das meshes do seu modelo (use console.log para listá-las)
 *
 *  COMO MAPEAR NOVAS PARTES:
 *  1. Adicione o nome da mesh em CONFIG.partNames na categoria correta
 *  2. Crie um novo step no HTML com o ID correspondente
 *  3. Adicione uma entrada em setupSectionHighlights()
 *
 *  COMO AJUSTAR ANIMAÇÕES:
 *  1. Modifique CONFIG.animation para velocidade/intensidade
 *  2. Ajuste os ScrollTrigger start/end para timing
 *  3. Modifique as posições da câmera em cada timeline
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

console.log('🚗 Strong Performance 3D Engine v4.0 — Production Ready');

// ═══════════════════════════════════════════════════
// CONFIG — Todas as constantes editáveis em um só lugar
// ═══════════════════════════════════════════════════
const CONFIG = {
    modelUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb',
    dracoPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',

    camera: {
        fov: 45,
        near: 0.1,
        far: 100,
        startPos: { x: 5, y: 2.5, z: 7 },
    },

    car: {
        scale: 1.2,
        posY: -0.5,
    },

    // Nome das meshes no modelo para cada grupo
    partNames: {
        technical: ['wheel', 'rim', 'disc', 'brake', 'tire', 'suspension', 'caliper'],
        engine: ['engine', 'motor', 'transmission', 'exhaust', 'radiator', 'intake'],
        electrical: ['light', 'lamp', 'headlight', 'taillight', 'wire', 'battery'],
        body: ['body', 'door', 'hood', 'trunk', 'roof', 'bumper', 'fender', 'mirror', 'windshield'],
    },

    animation: {
        idleSpeed: 0.15,         // Rotação idle no Hero (rad/s)
        explodeForce: 3.5,       // Distância da explosão
        scrubSpeed: 1.5,         // Suavidade do scrub
        highlightOpacity: 0.08,  // Opacidade das peças não-destacadas
    },

    lighting: {
        hemisphere: { sky: 0xffffff, ground: 0x444444, intensity: 3.5 },
        ambient: { color: 0xffffff, intensity: 2.0 },
        main: { color: 0xffffff, intensity: 5.0, pos: { x: 5, y: 15, z: 10 } },
        fill: { color: 0xffffff, intensity: 2.5, pos: { x: -5, y: 5, z: -10 } },
        rim: { color: 0xD4AF37, intensity: 2.0, pos: { x: 0, y: 3, z: -8 } },
    },

    renderer: {
        maxPixelRatio: 1.5,
        exposure: 2.0,
    }
};

// ═══════════════════════════════════════════════════
// 1. RENDERER
// ═══════════════════════════════════════════════════
const canvas = document.querySelector('canvas.webgl');
if (!canvas) {
    console.error('❌ Canvas .webgl não encontrado no DOM');
    throw new Error('Canvas not found');
}

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.devicePixelRatio < 2,
    alpha: true,
    powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.renderer.exposure;
renderer.shadowMap.enabled = false;

// ═══════════════════════════════════════════════════
// 2. SCENE
// ═══════════════════════════════════════════════════
const scene = new THREE.Scene();
scene.background = null;
renderer.setClearColor(0x000000, 0);

// ═══════════════════════════════════════════════════
// 3. CAMERA
// ═══════════════════════════════════════════════════
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
);
camera.position.set(
    CONFIG.camera.startPos.x,
    CONFIG.camera.startPos.y,
    CONFIG.camera.startPos.z
);
cameraGroup.add(camera);

// Camera target para lookAt dinâmico
const cameraTarget = new THREE.Vector3(0, 0, 0);

// ═══════════════════════════════════════════════════
// 4. LIGHTING (100% físico, sem dependência externa)
// ═══════════════════════════════════════════════════
function setupLighting() {
    const { lighting } = CONFIG;

    // Hemisphere: simula céu + reflexo do chão
    const hemi = new THREE.HemisphereLight(
        lighting.hemisphere.sky,
        lighting.hemisphere.ground,
        lighting.hemisphere.intensity
    );
    scene.add(hemi);

    // Ambient: preenche sombras
    const ambient = new THREE.AmbientLight(lighting.ambient.color, lighting.ambient.intensity);
    scene.add(ambient);

    // Main directional: luz principal (sol)
    const mainLight = new THREE.DirectionalLight(lighting.main.color, lighting.main.intensity);
    mainLight.position.set(lighting.main.pos.x, lighting.main.pos.y, lighting.main.pos.z);
    scene.add(mainLight);

    // Fill: iluminação de preenchimento (traseira)
    const fillLight = new THREE.DirectionalLight(lighting.fill.color, lighting.fill.intensity);
    fillLight.position.set(lighting.fill.pos.x, lighting.fill.pos.y, lighting.fill.pos.z);
    scene.add(fillLight);

    // Rim: luz dourada para brilho premium
    const rimLight = new THREE.DirectionalLight(lighting.rim.color, lighting.rim.intensity);
    rimLight.position.set(lighting.rim.pos.x, lighting.rim.pos.y, lighting.rim.pos.z);
    scene.add(rimLight);

    console.log('💡 Lighting system initialized (Physical, No-HDR)');
}

setupLighting();

// ═══════════════════════════════════════════════════
// 5. MODEL LOADING & PART CLASSIFICATION
// ═══════════════════════════════════════════════════
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(CONFIG.dracoPath);
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Stores
let carModel = null;
let isModelLoaded = false;
const allParts = [];
const groups = {
    technical: [],
    engine: [],
    electrical: [],
    body: [],
};
const originalTransforms = new Map();
let bodyMaterials = [];

/**
 * Classifica uma mesh pelo nome em um dos grupos
 */
function classifyPart(mesh) {
    const name = mesh.name.toLowerCase();
    for (const [group, keywords] of Object.entries(CONFIG.partNames)) {
        if (keywords.some(kw => name.includes(kw))) {
            groups[group].push(mesh);
            return group;
        }
    }
    // Partes não classificadas vão para "body" por padrão
    groups.body.push(mesh);
    return 'body';
}

/**
 * Salva o transform original de cada parte (para animações)
 */
function saveOriginalTransform(mesh) {
    originalTransforms.set(mesh, {
        pos: mesh.position.clone(),
        rot: mesh.rotation.clone(),
    });
}

/**
 * Carrega o modelo 3D
 */
function loadModel() {
    gltfLoader.load(
        CONFIG.modelUrl,
        (gltf) => {
            carModel = gltf.scene;
            carModel.scale.setScalar(CONFIG.car.scale);
            carModel.position.y = CONFIG.car.posY;

            // Percorre todas as meshes do modelo
            carModel.traverse((child) => {
                if (!child.isMesh) return;

                allParts.push(child);
                saveOriginalTransform(child);
                classifyPart(child);

                // Garante visibilidade total
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        mat.transparent = true;
                        mat.opacity = 1.0;
                        mat.depthWrite = true;
                        mat.needsUpdate = true;
                    });

                    // Coleta materiais do corpo para color picker
                    const matName = child.material.name ? child.material.name.toLowerCase() : '';
                    const meshName = child.name.toLowerCase();
                    if (matName.includes('body') || meshName.includes('body') || matName.includes('paint')) {
                        const mArr = Array.isArray(child.material) ? child.material : [child.material];
                        mArr.forEach(m => {
                            if (!bodyMaterials.includes(m)) bodyMaterials.push(m);
                        });
                    }
                }
            });

            scene.add(carModel);
            isModelLoaded = true;

            console.log(`🚗 Model loaded: ${allParts.length} meshes`);
            console.log(`   ├─ Technical: ${groups.technical.length}`);
            console.log(`   ├─ Engine: ${groups.engine.length}`);
            console.log(`   ├─ Electrical: ${groups.electrical.length}`);
            console.log(`   └─ Body: ${groups.body.length}`);

            // Inicializa animações GSAP
            initScrollAnimations();
            initColorPicker();
        },
        (progress) => {
            const pct = Math.round((progress.loaded / (progress.total || 1)) * 100);
            console.log(`📦 Loading model: ${pct}%`);
        },
        (error) => {
            console.error('❌ Model loading failed:', error);
        }
    );
}

loadModel();

// ═══════════════════════════════════════════════════
// 6. GSAP + SCROLLTRIGGER ANIMATIONS
// ═══════════════════════════════════════════════════

function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // --- A) EXPLODED VIEW: Hero → Assembly spacer ---
    // O carro começa montado e se desmonta ao rolar
    setupExplodedView();

    // --- B) SECTION HIGHLIGHTS: destaca peças por seção ---
    setupSectionHighlights();

    // --- C) CANVAS FADE: esconde ao entrar nas seções institucionais ---
    setupInstitutionalFade();

    console.log('🎬 ScrollTrigger animations initialized');
}

/**
 * A) Exploded View — o carro desmonta progressivamente no scroll
 */
function setupExplodedView() {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '#servicos',
            start: 'top bottom',
            end: 'top top',
            scrub: CONFIG.animation.scrubSpeed,
        }
    });

    allParts.forEach((part) => {
        const original = originalTransforms.get(part);
        if (!original) return;

        // Calcula direção de explosão a partir do centro
        const dir = original.pos.clone().normalize();
        if (dir.length() < 0.01) {
            dir.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
        }

        const explodedPos = original.pos.clone().add(
            dir.multiplyScalar(CONFIG.animation.explodeForce + Math.random() * 2)
        );

        // Começa montado → desmonta
        tl.to(part.position, {
            x: explodedPos.x,
            y: explodedPos.y,
            z: explodedPos.z,
            ease: 'power2.out',
        }, 0);

        // Leve rotação aleatória
        tl.to(part.rotation, {
            x: original.rot.x + (Math.random() - 0.5) * Math.PI * 0.5,
            y: original.rot.y + (Math.random() - 0.5) * Math.PI * 0.5,
            ease: 'power2.out',
        }, 0);
    });

    // Move câmera para vista panorâmica
    tl.to(cameraGroup.position, { x: 0, y: 1, z: 0 }, 0);
}

/**
 * B) Section Highlights — cada seção destaca um grupo de peças
 */
function setupSectionHighlights() {

    // Helper: cria timeline para destacar um grupo
    function createHighlightTimeline(triggerId, highlightGroup, cameraPos, lookAt) {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerId,
                start: 'top center',
                end: 'bottom center',
                scrub: 0.5,
                onEnter: () => {
                    // Habilita transparência em todas as peças para o efeito X-Ray
                    allParts.forEach(p => {
                        if (p.material) {
                            const mats = Array.isArray(p.material) ? p.material : [p.material];
                            mats.forEach(m => { m.transparent = true; m.needsUpdate = true; });
                        }
                    });
                },
                onLeaveBack: () => {
                    // Restaura opacidade ao voltar
                    allParts.forEach(p => {
                        if (p.material) {
                            const mats = Array.isArray(p.material) ? p.material : [p.material];
                            mats.forEach(m => { m.opacity = 1; m.needsUpdate = true; });
                        }
                    });
                }
            }
        });

        // Reduz opacidade de tudo que NÃO é o grupo destacado
        allParts.forEach(part => {
            if (highlightGroup.includes(part)) return;
            const mats = Array.isArray(part.material) ? part.material : [part.material];
            mats.forEach(mat => {
                tl.to(mat, { opacity: CONFIG.animation.highlightOpacity }, 0);
            });
        });

        // Garante que o grupo destacado fica 100% visível
        highlightGroup.forEach(part => {
            const mats = Array.isArray(part.material) ? part.material : [part.material];
            mats.forEach(mat => {
                tl.to(mat, { opacity: 1 }, 0);
            });

            // Volta para posição original (remonta a peça destacada)
            const orig = originalTransforms.get(part);
            if (orig) {
                tl.to(part.position, { x: orig.pos.x, y: orig.pos.y, z: orig.pos.z }, 0);
                tl.to(part.rotation, { x: orig.rot.x, y: orig.rot.y, z: orig.rot.z }, 0);
            }
        });

        // Câmera foca na área
        tl.to(cameraGroup.position, cameraPos, 0);
        tl.to(cameraTarget, lookAt, 0);

        return tl;
    }

    // --- Suspensão e Freios ---
    createHighlightTimeline(
        '#step-brakes',
        groups.technical,
        { x: 2.5, y: 0.3, z: -3 },
        { x: 0.8, y: -0.3, z: -1.5 }
    );

    // --- Motor ---
    createHighlightTimeline(
        '#step-engine',
        groups.engine,
        { x: -1.5, y: 2, z: 3 },
        { x: 0, y: 0.5, z: 1 }
    );

    // --- Sistema Elétrico ---
    createHighlightTimeline(
        '#step-electrical',
        groups.electrical,
        { x: -2, y: 0.5, z: -3.5 },
        { x: -0.5, y: 0.2, z: -1.5 }
    );

    // --- Customizer: volta tudo ao normal ---
    const customTl = gsap.timeline({
        scrollTrigger: {
            trigger: '#step-customizer',
            start: 'top center',
            end: 'bottom center',
            scrub: 0.5,
        }
    });

    allParts.forEach(part => {
        const orig = originalTransforms.get(part);
        if (!orig) return;

        customTl.to(part.position, { x: orig.pos.x, y: orig.pos.y, z: orig.pos.z }, 0);
        customTl.to(part.rotation, { x: orig.rot.x, y: orig.rot.y, z: orig.rot.z }, 0);

        const mats = Array.isArray(part.material) ? part.material : [part.material];
        mats.forEach(mat => {
            customTl.to(mat, { opacity: 1 }, 0);
        });
    });

    customTl.to(cameraGroup.position, { x: 5.5, y: 0.5, z: -4 }, 0);
    customTl.to(cameraTarget, { x: 0, y: 0, z: 0 }, 0);
}

/**
 * C) Fade do canvas ao entrar nas seções institucionais
 */
function setupInstitutionalFade() {
    gsap.to(canvas, {
        scrollTrigger: {
            trigger: '#sobre',
            start: 'top 80%',
            end: 'top 30%',
            scrub: true,
        },
        opacity: 0,
    });

    // Restaura ao voltar ao topo
    gsap.to(canvas, {
        scrollTrigger: {
            trigger: '#servicos',
            start: 'top bottom',
            end: 'top top',
            scrub: true,
        },
        opacity: 1,
    });
}

// ═══════════════════════════════════════════════════
// 7. COLOR PICKER
// ═══════════════════════════════════════════════════
function initColorPicker() {
    const buttons = document.querySelectorAll('.color-btn');
    if (!buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const hex = e.currentTarget.getAttribute('data-color');
            const newColor = new THREE.Color(hex);

            bodyMaterials.forEach(mat => {
                gsap.to(mat.color, {
                    r: newColor.r,
                    g: newColor.g,
                    b: newColor.b,
                    duration: 0.6,
                    ease: 'power2.out',
                });
            });
        });
    });

    // Ativa o primeiro botão
    if (buttons[0]) buttons[0].classList.add('active');
    console.log(`🎨 Color picker initialized (${bodyMaterials.length} materials)`);
}

// ═══════════════════════════════════════════════════
// 8. RESPONSIVIDADE
// ═══════════════════════════════════════════════════
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio));
});

// Parallax suave com o mouse
const cursor = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
    cursor.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
    cursor.y = (e.clientY / window.innerHeight - 0.5) * 0.5;
}, { passive: true });

// ═══════════════════════════════════════════════════
// 9. RENDER LOOP
// ═══════════════════════════════════════════════════
const clock = new THREE.Clock();

function tick() {
    const elapsed = clock.getElapsedTime();

    // Idle rotation no Hero (apenas quando o canvas está visível)
    if (carModel && canvas.style.opacity !== '0') {
        // Rotação automática suave baseada no scroll
        const scrollProgress = window.scrollY / window.innerHeight;
        if (scrollProgress < 0.3) {
            // Apenas no Hero: rotação idle
            carModel.rotation.y = Math.sin(elapsed * CONFIG.animation.idleSpeed) * 0.08;
        }
    }

    // Parallax suave da câmera com o mouse
    cameraGroup.position.x += (cursor.x * 0.3 - cameraGroup.position.x * 0.01) * 0.05;
    cameraGroup.position.y += (-cursor.y * 0.2 - cameraGroup.position.y * 0.01) * 0.05;

    // Camera lookAt dinâmico
    camera.lookAt(cameraTarget);

    // Render
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}

tick();
console.log('✅ Render loop started');
