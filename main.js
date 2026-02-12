// ============================================
// Hadron Collider Lab — Main Entry
// ============================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import { createDetector, flashCollisionPoint } from './detector.js';
import { PARTICLE_TYPES, EXPERIMENT_PRESETS } from './particles.js';
import { ParticleSystem, runExperiment } from './simulation.js';

// ---- Scene Setup ----
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0a0a1a, 1);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.012);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
camera.position.set(14, 8, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.target.set(0, 0, 0);

// ---- CSS2D Renderer ----
const css2dRenderer = new CSS2DRenderer();
css2dRenderer.domElement.style.position = 'absolute';
css2dRenderer.domElement.style.top = '0';
css2dRenderer.domElement.style.left = '0';
css2dRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(css2dRenderer.domElement);

// ---- Post-processing ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(800, 600), 1.2, 0.3, 0.75);
composer.addPass(bloomPass);

// ---- Lights ----
scene.add(new THREE.AmbientLight(0x222244, 0.5));
const pointLight = new THREE.PointLight(0x00ffff, 0.3, 40);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);
const flashLight = new THREE.PointLight(0xffffff, 0, 30);
flashLight.position.set(0, 0, 0);
scene.add(flashLight);

// ---- Background stars ----
const starsGeo = new THREE.BufferGeometry();
const starsPos = new Float32Array(3000);
for (let i = 0; i < 3000; i++) starsPos[i] = (Math.random() - 0.5) * 120;
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({
    color: 0x334466, size: 0.15, transparent: true, opacity: 0.6,
})));

// ---- Detector ----
const detector = createDetector(scene);

// ---- Particle System ----
const particleSystem = new ParticleSystem(scene);

// ============================================
// EVENT LOG SYSTEM
// ============================================
const logEntriesEl = document.getElementById('log-entries');
let logTimeOrigin = 0;

function logClear() {
    logEntriesEl.innerHTML = '';
    logTimeOrigin = performance.now();
}

function logEvent(type, message, color) {
    const elapsed = performance.now() - logTimeOrigin;
    const sec = (elapsed / 1000).toFixed(2);
    const timeStr = `T+${sec}s`;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const dot = color
        ? `<span class="log-color-dot" style="background:${color};box-shadow:0 0 4px ${color}"></span>`
        : '';

    entry.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-msg">${dot}${message}</span>`;
    logEntriesEl.appendChild(entry);
    logEntriesEl.scrollTop = logEntriesEl.scrollHeight;
}

// ---- Detector layer name mapping ----
const DETECTOR_LAYERS = [
    { radius: 2,  name: 'Inner Tracker' },
    { radius: 5,  name: 'ECAL' },
    { radius: 8,  name: 'HCAL' },
    { radius: 12, name: 'Muon Spectrometer' },
];
const DETECTOR_RADII = DETECTOR_LAYERS.map(l => l.radius);

function layerNameByRadius(r) {
    const l = DETECTOR_LAYERS.find(l => l.radius === r);
    return l ? l.name : 'Unknown';
}

// ============================================
// COLLISION EXPLOSION
// ============================================
const explosionGroup = new THREE.Group();
explosionGroup.name = 'explosion';
scene.add(explosionGroup);

function triggerExplosion() {
    const sphereGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 1, side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    explosionGroup.add(sphere);

    const ringGeo = new THREE.RingGeometry(0.1, 0.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    explosionGroup.add(ring);
    const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
    ring2.rotation.y = Math.PI / 2;
    explosionGroup.add(ring2);

    flashLight.intensity = 8;
    flashLight.color.set(0xffffff);

    const start = performance.now();
    function animateExplosion() {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / 800, 1);
        const scale = 0.3 + t * 4;
        sphere.scale.set(scale, scale, scale);
        sphereMat.opacity = (1 - t) * 0.8;
        const rs = 1 + t * 8;
        ring.scale.set(rs, rs, rs);
        ringMat.opacity = (1 - t) * 0.6;
        ring2.scale.set(rs, rs, rs);
        ring2.material.opacity = (1 - t) * 0.6;
        flashLight.intensity = 8 * (1 - t * t);
        if (t < 1) {
            requestAnimationFrame(animateExplosion);
        } else {
            explosionGroup.remove(sphere, ring, ring2);
            sphereGeo.dispose(); sphereMat.dispose();
            ringGeo.dispose(); ringMat.dispose();
            ring2.geometry.dispose(); ring2.material.dispose();
            flashLight.intensity = 0;
        }
    }
    requestAnimationFrame(animateExplosion);
}

// ============================================
// DETECTOR HIT RIPPLES
// ============================================
const ripples = [];

function spawnRipple(position, color, radius) {
    const rippleGeo = new THREE.RingGeometry(0.05, 0.15, 16);
    const rippleMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.position.copy(position);
    ripple.lookAt(position.clone().multiplyScalar(2));
    scene.add(ripple);
    ripples.push({ mesh: ripple, mat: rippleMat, start: performance.now(), maxScale: 3 });
}

function updateRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const t = Math.min((performance.now() - r.start) / 600, 1);
        const s = 1 + t * r.maxScale;
        r.mesh.scale.set(s, s, s);
        r.mat.opacity = 0.8 * (1 - t);
        if (t >= 1) {
            scene.remove(r.mesh);
            r.mesh.geometry.dispose();
            r.mat.dispose();
            ripples.splice(i, 1);
        }
    }
}

const crossedLayers = new Map();
function checkDetectorHits() {
    for (const p of particleSystem.particles) {
        if (!p.alive || p.delay > 0 || p.isBeam) continue;
        const r = Math.sqrt(p.position.x ** 2 + p.position.y ** 2);
        if (!crossedLayers.has(p.id)) crossedLayers.set(p.id, new Set());
        const crossed = crossedLayers.get(p.id);
        for (const lr of DETECTOR_RADII) {
            if (!crossed.has(lr) && r >= lr - 0.3 && r <= lr + 0.3) {
                crossed.add(lr);
                spawnRipple(p.position.clone(), p.def.color, lr);
                const hex = '#' + new THREE.Color(p.def.color).getHexString();
                logEvent('detect', `${p.def.symbol} detected in ${layerNameByRadius(lr)}`, hex);
            }
        }
    }
}

// ============================================
// UI: PRESETS
// ============================================
let selectedPreset = EXPERIMENT_PRESETS[0];
let isRunning = false;

const presetList = document.getElementById('preset-list');
EXPERIMENT_PRESETS.forEach((preset, idx) => {
    const card = document.createElement('div');
    card.className = 'preset-card' + (idx === 0 ? ' active' : '');
    card.innerHTML = `
        <div class="preset-name">${preset.name}</div>
        <div class="preset-desc">${preset.description}</div>
        <div class="preset-energy">${preset.energy} · ${preset.rarity}</div>
    `;
    card.addEventListener('click', () => {
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedPreset = preset;
    });
    presetList.appendChild(card);
});

// ============================================
// UI: PARTICLE INFO
// ============================================
const particleListEl = document.getElementById('particle-list');
const detailEl = document.getElementById('particle-detail');
const detectedParticles = [];

particleSystem.onParticleCreated = (p) => {
    if (p.typeKey === 'proton') return;
    detectedParticles.push(p);
    renderParticleList();
    const hex = '#' + new THREE.Color(p.def.color).getHexString();
    logEvent('particle', `${p.def.symbol} ${p.def.name} produced (${p.energy.toFixed(0)} GeV)`, hex);
};

function renderParticleList() {
    particleListEl.innerHTML = '';
    const counts = {};
    for (const p of detectedParticles) {
        if (!counts[p.typeKey]) counts[p.typeKey] = { def: p.def, count: 0 };
        counts[p.typeKey].count++;
    }
    for (const [key, val] of Object.entries(counts)) {
        const entry = document.createElement('div');
        entry.className = 'particle-entry';
        const c = new THREE.Color(val.def.color);
        entry.innerHTML = `
            <div class="particle-dot" style="background:#${c.getHexString()};box-shadow:0 0 6px #${c.getHexString()}"></div>
            <span class="particle-symbol">${val.def.symbol}</span>
            <span class="particle-label">${val.def.name} ×${val.count}</span>
        `;
        entry.addEventListener('click', () => showParticleDetail(val.def));
        particleListEl.appendChild(entry);
    }
    document.getElementById('hud-particles').textContent = `${detectedParticles.length} particles`;
}

function showParticleDetail(def) {
    detailEl.classList.remove('hidden');
    document.getElementById('detail-name').textContent = `${def.symbol} ${def.name}`;
    document.getElementById('detail-name').style.color = '#' + new THREE.Color(def.color).getHexString();
    document.getElementById('detail-mass').textContent = def.mass === 0 ? '0 (massless)' : `${def.mass} GeV/c²`;
    document.getElementById('detail-charge').textContent = def.charge === 0 ? '0' : (def.charge > 0 ? `+${def.charge}` : `${def.charge}`);
    document.getElementById('detail-spin').textContent = def.spin;
    document.getElementById('detail-lifetime').textContent = def.lifetime;
    document.getElementById('detail-type').textContent = def.type.charAt(0).toUpperCase() + def.type.slice(1);
}

// ============================================
// UI: CONTROLS
// ============================================
const btnCollide = document.getElementById('btn-collide');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const speedSlider = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-display');

btnCollide.addEventListener('click', () => {
    if (isRunning) return;
    startCollision();
});

btnPause.addEventListener('click', () => {
    particleSystem.paused = !particleSystem.paused;
    btnPause.textContent = particleSystem.paused ? '▶' : '⏸';
    btnPause.classList.toggle('active', particleSystem.paused);
});

btnReset.addEventListener('click', () => {
    particleSystem.clear();
    crossedLayers.clear();
    detectedParticles.length = 0;
    particleListEl.innerHTML = '';
    detailEl.classList.add('hidden');
    isRunning = false;
    btnCollide.classList.remove('running');
    btnCollide.textContent = 'COLLIDE!';
    document.getElementById('hud-particles').textContent = '0 particles';
    flashLight.intensity = 0;
    logClear();
    logEvent('system', 'System reset. Select experiment and press COLLIDE!');
});

speedSlider.addEventListener('input', () => {
    const val = parseFloat(speedSlider.value);
    particleSystem.speed = val;
    speedDisplay.textContent = val.toFixed(2) + 'x';
    document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
});

document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
        const val = parseFloat(btn.dataset.speed);
        particleSystem.speed = val;
        speedSlider.value = val;
        speedDisplay.textContent = val.toFixed(2) + 'x';
        document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ============================================
// COLLISION SEQUENCE WITH COUNTDOWN + LOG
// ============================================
function startCollision() {
    isRunning = true;
    btnCollide.classList.add('running');
    btnCollide.textContent = 'RUNNING...';
    detectedParticles.length = 0;
    crossedLayers.clear();
    particleListEl.innerHTML = '';
    detailEl.classList.add('hidden');

    logClear();

    const preset = selectedPreset;
    const spd = particleSystem.speed;
    const collisionMs = 1300; // matches simulation.js collisionDelay

    // --- Phase 1: Countdown ---
    logEvent('system', `Experiment: ${preset.name}`);
    logEvent('system', `Beam energy: ${preset.energy} per beam`);
    logEvent('beam', 'Initializing beam injection sequence...');

    const step = 400 / spd;

    setTimeout(() => logEvent('beam', 'Beam 1 (p⁺) injected → accelerating to 6.8 TeV'), step);
    setTimeout(() => logEvent('beam', 'Beam 2 (p⁺) injected → accelerating to 6.8 TeV'), step * 2);
    setTimeout(() => logEvent('system', 'Beams stable. Focusing magnets aligned.'), step * 3);
    setTimeout(() => {
        logEvent('countdown', '3');
    }, step * 4);
    setTimeout(() => {
        logEvent('countdown', '2');
    }, step * 5);
    setTimeout(() => {
        logEvent('countdown', '1');
    }, step * 6);

    // --- Phase 2: Launch simulation after countdown ---
    const launchDelay = step * 7;

    setTimeout(() => {
        logEvent('countdown', 'COLLIDE!');

        // Actually start the particle simulation now
        const realCollisionDelay = runExperiment(particleSystem, preset);

        // --- Phase 3: Collision event at impact ---
        const impactDelay = realCollisionDelay / spd;

        setTimeout(() => {
            flashCollisionPoint(detector);
            triggerExplosion();
            logEvent('collision', 'COLLISION! Center-of-mass energy: ' + preset.energy);
            logEvent('energy', 'Energy released: converting mass to particles via E=mc²');

            // Log decay chain description
            if (preset.decayChain.length > 0) {
                const firstProducts = preset.decayChain[0].products.map(k => PARTICLE_TYPES[k]?.symbol || k).join(' + ');
                const parentSym = preset.decayChain[0].parent ? PARTICLE_TYPES[preset.decayChain[0].parent]?.symbol : 'pp';
                setTimeout(() => {
                    logEvent('decay', `Primary: ${parentSym} → ${firstProducts}`);
                }, 200 / spd);
            }

            // Log cascade decays
            for (let i = 1; i < preset.decayChain.length; i++) {
                const step = preset.decayChain[i];
                const parentSym = step.parent ? (PARTICLE_TYPES[step.parent]?.symbol || step.parent) : '?';
                const prodSyms = step.products.map(k => PARTICLE_TYPES[k]?.symbol || k).join(' + ');
                const delay = (step.delay || 200) / spd;
                setTimeout(() => {
                    logEvent('decay', `Cascade: ${parentSym} → ${prodSyms}`);
                }, delay + 300 / spd);
            }

            // Summary after products appear
            setTimeout(() => {
                const totalProducts = preset.decayChain.reduce((sum, s) => sum + s.products.length, 0)
                    + (preset.secondaryParticles?.length || 0);
                logEvent('energy', `Total particles produced: ${totalProducts}`);
                logEvent('system', 'Collecting detector data...');
            }, 800 / spd);

        }, impactDelay);

        // --- Phase 4: Re-enable button ---
        setTimeout(() => {
            isRunning = false;
            btnCollide.classList.remove('running');
            btnCollide.textContent = 'COLLIDE!';
            logEvent('system', 'Event complete. Ready for next collision.');
        }, impactDelay + 5000 / spd);

    }, launchDelay);
}

// ============================================
// RESIZE
// ============================================
function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    css2dRenderer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

// ============================================
// ANIMATION LOOP
// ============================================
let frameCount = 0;
let lastFpsTime = performance.now();
const fpsEl = document.getElementById('hud-fps');
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;

    controls.update();
    particleSystem.update(dt);
    checkDetectorHits();
    updateRipples();
    composer.render();
    css2dRenderer.render(scene, camera);

    frameCount++;
    if (now - lastFpsTime >= 500) {
        fpsEl.textContent = `${Math.round(frameCount / ((now - lastFpsTime) / 1000))} FPS`;
        frameCount = 0;
        lastFpsTime = now;
    }
}

animate();

// Initial log message
logEvent('system', 'Hadron Collider Lab initialized');
logEvent('system', 'Select experiment and press COLLIDE!');

// Energy display
const energyEl = document.getElementById('hud-energy');
setInterval(() => { energyEl.textContent = selectedPreset.energy; }, 1000);
