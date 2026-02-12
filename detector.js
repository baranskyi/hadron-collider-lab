// ============================================
// ATLAS/CMS-style Detector Geometry
// ============================================
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createDetector(scene) {
    const detector = new THREE.Group();
    detector.name = 'detector';

    // --- Beam Pipe ---
    const beamPipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 60, 16, 1, true);
    const beamPipeMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    });
    const beamPipe = new THREE.Mesh(beamPipeGeo, beamPipeMat);
    beamPipe.rotation.x = Math.PI / 2;
    detector.add(beamPipe);

    // Beam pipe wireframe
    const beamWireGeo = new THREE.CylinderGeometry(0.15, 0.15, 60, 16, 1, true);
    const beamWireMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.12,
    });
    const beamWire = new THREE.Mesh(beamWireGeo, beamWireMat);
    beamWire.rotation.x = Math.PI / 2;
    detector.add(beamWire);

    // --- Detector Layers (concentric cylinders) ---
    const layers = [
        { name: 'Inner Tracker',               abbr: 'TRACKER',  radius: 2,  length: 12, color: 0x00ffff, opacity: 0.035, wireOpacity: 0.10 },
        { name: 'Electromagnetic Calorimeter',  abbr: 'ECAL',     radius: 5,  length: 16, color: 0x00ff88, opacity: 0.02,  wireOpacity: 0.06 },
        { name: 'Hadronic Calorimeter',         abbr: 'HCAL',     radius: 8,  length: 18, color: 0xff8800, opacity: 0.015, wireOpacity: 0.05 },
        { name: 'Muon Spectrometer',            abbr: 'MUON',     radius: 12, length: 22, color: 0xff00ff, opacity: 0.012, wireOpacity: 0.035 },
    ];

    layers.forEach((layer) => {
        // Solid shell
        const shellGeo = new THREE.CylinderGeometry(layer.radius, layer.radius, layer.length, 32, 1, true);
        const shellMat = new THREE.MeshBasicMaterial({
            color: layer.color, transparent: true, opacity: layer.opacity, side: THREE.DoubleSide,
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.rotation.x = Math.PI / 2;
        shell.userData.layerName = layer.name;
        detector.add(shell);

        // Wireframe
        const wireGeo = new THREE.CylinderGeometry(layer.radius, layer.radius, layer.length, 32, 4, true);
        const wireMat = new THREE.MeshBasicMaterial({
            color: layer.color, wireframe: true, transparent: true, opacity: layer.wireOpacity,
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        wire.rotation.x = Math.PI / 2;
        detector.add(wire);

        // End caps (rings)
        for (const sign of [-1, 1]) {
            const ringGeo = new THREE.RingGeometry(layer.radius * 0.3, layer.radius, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: layer.color, transparent: true, opacity: layer.opacity * 1.5, side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.z = sign * (layer.length / 2);
            detector.add(ring);
        }

        // --- Layer name label (CSS2D at top of cylinder) ---
        const labelDiv = document.createElement('div');
        labelDiv.className = 'detector-layer-label';
        labelDiv.innerHTML = `<span class="layer-abbr">${layer.abbr}</span><span class="layer-full">${layer.name}</span>`;
        labelDiv.style.color = '#' + new THREE.Color(layer.color).getHexString();
        const labelObj = new CSS2DObject(labelDiv);
        labelObj.position.set(0, layer.radius + 0.3, 0);
        detector.add(labelObj);
    });

    // --- Solenoid Magnet indicator (dashed rings) ---
    const magnetRadius = 6.5;
    const ringCount = 8;
    for (let i = 0; i < ringCount; i++) {
        const z = -10 + (20 / (ringCount - 1)) * i;
        const curve = new THREE.EllipseCurve(0, 0, magnetRadius, magnetRadius, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(64);
        const geo = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, p.y, z))
        );
        const mat = new THREE.LineBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.08 });
        detector.add(new THREE.LineLoop(geo, mat));
    }

    // --- Collision point marker ---
    const markerGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.name = 'collision-point';
    detector.add(marker);

    // Crosshair lines at collision point
    const crosshairMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
    for (const axis of ['x', 'y', 'z']) {
        const pts = [new THREE.Vector3(), new THREE.Vector3()];
        pts[0][axis] = -0.5;
        pts[1][axis] = 0.5;
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        detector.add(new THREE.Line(geo, crosshairMat));
    }

    scene.add(detector);
    return detector;
}

// Flash the collision point on impact
export function flashCollisionPoint(detector) {
    const marker = detector.getObjectByName('collision-point');
    if (!marker) return;
    const original = marker.material.opacity;
    marker.material.opacity = 1;
    marker.scale.set(3, 3, 3);

    const start = performance.now();
    function animate() {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / 800, 1);
        marker.material.opacity = 1 - t * (1 - original);
        const s = 3 - t * 2.5;
        marker.scale.set(s, s, s);
        if (t < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}
