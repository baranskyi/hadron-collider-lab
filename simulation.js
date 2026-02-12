// ============================================
// Particle Simulation Engine
// ============================================
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PARTICLE_TYPES } from './particles.js';

const MAGNETIC_FIELD = 3.8;
const TRAIL_LENGTH = 150;

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.trailGroup = new THREE.Group();
        this.trailGroup.name = 'trails';
        scene.add(this.trailGroup);
        this.headGroup = new THREE.Group();
        this.headGroup.name = 'heads';
        scene.add(this.headGroup);
        this.labelGroup = new THREE.Group();
        this.labelGroup.name = 'labels';
        scene.add(this.labelGroup);
        this.time = 0;
        this.speed = 1;
        this.paused = false;
        this.onParticleCreated = null;

        // Shared geometries for head spheres
        this._headGeoSmall = new THREE.SphereGeometry(0.15, 10, 10);
        this._headGeoBig = new THREE.SphereGeometry(0.4, 12, 12);
    }

    clear() {
        for (const p of this.particles) this._removeParticleObjects(p);
        this.particles = [];
        this.time = 0;
    }

    _removeParticleObjects(p) {
        if (p.trailLine) {
            this.trailGroup.remove(p.trailLine);
            if (p.trailLine.geometry) p.trailLine.geometry.dispose();
            if (p.trailLine.material) p.trailLine.material.dispose();
        }
        if (p.headMesh) {
            this.headGroup.remove(p.headMesh);
            if (p.headMesh.material) p.headMesh.material.dispose();
        }
        if (p.labelObj) {
            this.labelGroup.remove(p.labelObj);
        }
    }

    spawnParticle(typeKey, origin, direction, energy, delay = 0) {
        const pDef = PARTICLE_TYPES[typeKey];
        if (!pDef) return null;

        const speed = this._calcSpeed(energy, pDef.mass);
        const vel = direction.clone().normalize().multiplyScalar(speed);
        const isBeam = pDef.trail === 'beam';

        const particle = {
            id: Math.random().toString(36).slice(2, 8),
            typeKey, def: pDef,
            position: origin.clone(),
            velocity: vel,
            energy, age: 0, delay,
            alive: true, decayed: false,
            maxAge: this._calcLifetime(pDef),
            trail: [],
            trailLine: null,
            headMesh: null,
            labelObj: null,
            isBeam,
        };

        // --- Trail line (standard THREE.Line — reliable) ---
        const maxPts = TRAIL_LENGTH;
        const positions = new Float32Array(maxPts * 3);
        const colors = new Float32Array(maxPts * 4);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        geo.setDrawRange(0, 0);

        let mat;
        if (pDef.trail === 'dashed') {
            mat = new THREE.LineDashedMaterial({
                vertexColors: true, transparent: true, opacity: 1,
                dashSize: 0.3, gapSize: 0.2,
            });
        } else {
            mat = new THREE.LineBasicMaterial({
                vertexColors: true, transparent: true, opacity: 1,
            });
        }
        const line = new THREE.Line(geo, mat);
        line.visible = false;
        this.trailGroup.add(line);
        particle.trailLine = line;

        // --- Head mesh (glowing sphere at tip) ---
        const headMat = new THREE.MeshBasicMaterial({
            color: pDef.color, transparent: true,
            opacity: isBeam ? 1 : 0.95,
        });
        const headMesh = new THREE.Mesh(isBeam ? this._headGeoBig : this._headGeoSmall, headMat);
        headMesh.position.copy(origin);
        headMesh.visible = false;
        this.headGroup.add(headMesh);
        particle.headMesh = headMesh;

        // --- Label (CSS2DObject — clean floating text) ---
        const labelDiv = document.createElement('div');
        labelDiv.className = isBeam ? 'beam-label-3d' : 'particle-label-3d';
        labelDiv.textContent = pDef.symbol;
        labelDiv.style.color = '#' + new THREE.Color(pDef.color).getHexString();
        const labelObj = new CSS2DObject(labelDiv);
        labelObj.position.copy(origin);
        labelObj.visible = false;
        this.labelGroup.add(labelObj);
        particle.labelObj = labelObj;

        this.particles.push(particle);
        if (this.onParticleCreated) this.onParticleCreated(particle);
        return particle;
    }

    update(dt) {
        if (this.paused) return;
        const sDt = dt * this.speed;
        this.time += sDt;

        for (const p of this.particles) {
            if (!p.alive) continue;

            // Delay countdown
            if (p.delay > 0) {
                p.delay -= sDt * 1000;
                if (p.delay <= 0) {
                    p.headMesh.visible = true;
                    p.labelObj.visible = true;
                }
                continue;
            }

            p.age += sDt;
            if (!p.headMesh.visible) {
                p.headMesh.visible = true;
                p.labelObj.visible = true;
            }

            // Magnetic field curvature for charged particles
            if (p.def.charge !== 0) {
                const curvature = this._magneticCurvature(p);
                const perp = new THREE.Vector3()
                    .crossVectors(p.velocity, new THREE.Vector3(0, 0, 1))
                    .normalize();
                p.velocity.add(perp.multiplyScalar(curvature * sDt));
            }

            // Move
            p.position.add(p.velocity.clone().multiplyScalar(sDt));

            // Energy loss in calorimeters
            const r = Math.sqrt(p.position.x ** 2 + p.position.y ** 2);
            if (p.def.trail === 'jet' && r > 5) {
                p.velocity.multiplyScalar(0.95);
                p.energy *= 0.95;
            }

            // Update head & label position
            p.headMesh.position.copy(p.position);
            p.labelObj.position.copy(p.position);

            // Trail
            p.trail.push(p.position.clone());
            if (p.trail.length > TRAIL_LENGTH) p.trail.shift();
            this._updateTrail(p);

            // Lifetime / bounds check
            if (p.age > p.maxAge || r > 16 || Math.abs(p.position.z) > 14) {
                p.alive = false;
                this._fadeOut(p);
            }
        }
    }

    _calcSpeed(energy, mass) {
        const base = 8 + Math.random() * 4;
        if (mass === 0) return base * 1.5;
        return base * (1 - mass / (energy + mass + 1));
    }

    _calcLifetime(def) {
        if (def.trail === 'beam') return 8;
        if (def.lifetime === 'stable') return 30;
        if (def.trail === 'short' || def.trail === 'flash') return 0.3 + Math.random() * 0.3;
        if (def.trail === 'jet') return 2 + Math.random();
        return 5 + Math.random() * 10;
    }

    _magneticCurvature(p) {
        const sign = p.def.charge > 0 ? 1 : -1;
        const momentum = p.velocity.length() * (p.def.mass + 0.1);
        const base = sign * MAGNETIC_FIELD * Math.abs(p.def.charge) / (momentum + 1);
        if (p.def.trail === 'helix_tight') return base * 3;
        if (p.def.trail === 'helix_wide') return base * 0.8;
        return base;
    }

    _updateTrail(p) {
        const len = p.trail.length;
        if (len < 2) { p.trailLine.visible = false; return; }
        p.trailLine.visible = true;

        const posArr = p.trailLine.geometry.attributes.position.array;
        const colArr = p.trailLine.geometry.attributes.color.array;
        const c = new THREE.Color(p.def.color);

        for (let i = 0; i < len; i++) {
            const pt = p.trail[i];
            posArr[i * 3] = pt.x;
            posArr[i * 3 + 1] = pt.y;
            posArr[i * 3 + 2] = pt.z;

            const t = i / (len - 1); // 0=old, 1=new
            const alpha = t * t * 0.9 + 0.1;
            colArr[i * 4] = c.r;
            colArr[i * 4 + 1] = c.g;
            colArr[i * 4 + 2] = c.b;
            colArr[i * 4 + 3] = alpha;
        }

        p.trailLine.geometry.attributes.position.needsUpdate = true;
        p.trailLine.geometry.attributes.color.needsUpdate = true;
        p.trailLine.geometry.setDrawRange(0, len);
        if (p.def.trail === 'dashed') p.trailLine.computeLineDistances();
    }

    _fadeOut(p) {
        const headMat = p.headMesh.material;
        const lineMat = p.trailLine.material;
        const labelEl = p.labelObj.element;
        const start = performance.now();
        const dur = 2000;

        const anim = () => {
            const t = Math.min((performance.now() - start) / dur, 1);
            headMat.opacity = (1 - t) * 0.95;
            lineMat.opacity = 1 - t;
            labelEl.style.opacity = String(1 - t);
            if (t < 1) requestAnimationFrame(anim);
            else this._removeParticleObjects(p);
        };
        requestAnimationFrame(anim);
    }
}

// ============================================
// Experiment Runner
// ============================================
export function runExperiment(system, preset) {
    system.clear();
    // Collision delay — time for beams to reach center
    const collisionDelay = 1300;

    // Beam protons approach from both sides
    system.spawnParticle('proton', new THREE.Vector3(0, 0, -25), new THREE.Vector3(0, 0, 1), 6800, 0);
    system.spawnParticle('proton', new THREE.Vector3(0, 0, 25), new THREE.Vector3(0, 0, -1), 6800, 0);

    // Primary decay chain — spawned after collision
    for (const step of preset.decayChain) {
        for (const productKey of step.products) {
            const angle = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            const dir = new THREE.Vector3(
                Math.cos(angle) * Math.cos(phi),
                Math.sin(phi),
                Math.sin(angle) * Math.cos(phi)
            );
            const energy = 20 + Math.random() * 80;
            system.spawnParticle(productKey, new THREE.Vector3(0, 0, 0), dir, energy,
                collisionDelay + (step.delay || 0));
        }
    }

    // Secondary background particles
    if (preset.secondaryParticles) {
        for (const key of preset.secondaryParticles) {
            const angle = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI * 0.8;
            const dir = new THREE.Vector3(
                Math.cos(angle) * Math.cos(phi),
                Math.sin(phi),
                Math.sin(angle) * Math.cos(phi)
            );
            const energy = 5 + Math.random() * 30;
            const delay = collisionDelay + 100 + Math.random() * 400;
            system.spawnParticle(key, new THREE.Vector3(0, 0, 0), dir, energy, delay);
        }
    }

    return collisionDelay;
}
