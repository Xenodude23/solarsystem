/**
 * 3D Animated Solar System
 * High-end Three.js implementation with:
 * - Sun with dynamic solar flares
 * - All 8 planets with textures, glow, and atmospheres
 * - Orbital lines, background stars, cosmic rays, shooting stars
 * - Smooth camera controls
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// GLOBAL VARIABLES
// ============================================================
let scene, camera, renderer, controls;
let sun, planets = [], orbits = [], labels = [];
let solarFlares = [];
let stars, cosmicRays = [], shootingStars = [];
let clock = new THREE.Clock();

// Animation controls
let orbitSpeedMultiplier = 1;
let rotationSpeedMultiplier = 1;
let showOrbits = true;
let showLabels = true;
let showFlares = true;
let showShootingStars = true;
let showCosmicRays = true;

// Raycaster for planet selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Planet data
const planetData = [
    { name: 'Mercury', radius: 0.4, distance: 10, orbitSpeed: 4.15, rotationSpeed: 0.017, color: 0x8c7853, atmosphereColor: 0x8c7853, atmosphereSize: 1.05, hasAtmosphere: false },
    { name: 'Venus', radius: 0.9, distance: 15, orbitSpeed: 1.62, rotationSpeed: -0.004, color: 0xffc649, atmosphereColor: 0xffd27f, atmosphereSize: 1.1, hasAtmosphere: true },
    { name: 'Earth', radius: 1, distance: 20, orbitSpeed: 1, rotationSpeed: 1, color: 0x6b93d6, atmosphereColor: 0x6b93d6, atmosphereSize: 1.08, hasAtmosphere: true },
    { name: 'Mars', radius: 0.53, distance: 28, orbitSpeed: 0.53, rotationSpeed: 0.97, color: 0xc1440e, atmosphereColor: 0xffa07a, atmosphereSize: 1.05, hasAtmosphere: true },
    { name: 'Jupiter', radius: 3, distance: 52, orbitSpeed: 0.084, rotationSpeed: 2.4, color: 0xd8ca9d, atmosphereColor: 0xd8ca9d, atmosphereSize: 1.08, hasAtmosphere: true },
    { name: 'Saturn', radius: 2.5, distance: 75, orbitSpeed: 0.034, rotationSpeed: 2.2, color: 0xead6b8, atmosphereColor: 0xf4e4c1, atmosphereSize: 1.1, hasAtmosphere: true, hasRings: true },
    { name: 'Uranus', radius: 1.6, distance: 100, orbitSpeed: 0.012, rotationSpeed: -1.4, color: 0xd1e7e7, atmosphereColor: 0xadd8e6, atmosphereSize: 1.12, hasAtmosphere: true },
    { name: 'Neptune', radius: 1.5, distance: 130, orbitSpeed: 0.006, rotationSpeed: 1.5, color: 0x5b5ddf, atmosphereColor: 0x7b7fff, atmosphereSize: 1.12, hasAtmosphere: true }
];

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(80, 60, 120);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 500;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.2;

    // Create scene elements
    createBackgroundStars();
    createSun();
    createPlanets();
    createOrbits();
    createCosmicRays();
    createShootingStars();
    createAmbientLight();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Setup UI controls
    setupUIControls();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2000);

    // Start animation
    animate();
}

// ============================================================
// SUN CREATION
// ============================================================
function createSun() {
    const sunGroup = new THREE.Group();

    // Main sun sphere with custom shader
    const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            colorA: { value: new THREE.Color(0xffdd00) },
            colorB: { value: new THREE.Color(0xff6600) },
            colorC: { value: new THREE.Color(0xff3300) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 colorA;
            uniform vec3 colorB;
            uniform vec3 colorC;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            // Simplex noise function
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }

            void main() {
                // Animated noise for surface
                float noise1 = snoise(vPosition * 0.5 + time * 0.2);
                float noise2 = snoise(vPosition * 1.0 + time * 0.3);
                float noise3 = snoise(vPosition * 2.0 + time * 0.4);

                float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

                // Color gradient based on noise
                vec3 color = mix(colorA, colorB, combinedNoise * 0.5 + 0.5);
                color = mix(color, colorC, pow(combinedNoise * 0.5 + 0.5, 2.0));

                // Edge glow
                float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                color += vec3(1.0, 0.5, 0.0) * fresnel * 0.5;

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.userData = { type: 'sun' };
    sunGroup.add(sunMesh);

    // Sun glow
    const glowGeometry = new THREE.SphereGeometry(6.5, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            viewVector: { value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying float intensity;
            void main() {
                vec3 glow = vec3(1.0, 0.6, 0.0) * intensity;
                gl_FragColor = vec4(glow, intensity * 0.6);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    sunGroup.add(sunGlow);

    // Corona effect
    const coronaGeometry = new THREE.SphereGeometry(8, 32, 32);
    const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                vec3 color = vec3(1.0, 0.3, 0.0) * intensity;
                float alpha = intensity * 0.3;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sunGroup.add(corona);

    // Point light from sun
    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.castShadow = true;
    sunGroup.add(sunLight);

    sun = sunGroup;
    sun.userData.material = sunMaterial;
    sun.userData.glowMaterial = glowMaterial;
    sun.userData.coronaMaterial = coronaMaterial;
    scene.add(sun);

    // Create solar flares
    createSolarFlares();
}

// ============================================================
// SOLAR FLARES
// ============================================================
function createSolarFlares() {
    const flareGroup = new THREE.Group();

    for (let i = 0; i < 50; i++) {
        const flareGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.3, 8, 8);
        const flareMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.3),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const flare = new THREE.Mesh(flareGeometry, flareMaterial);

        // Random position on sun surface
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 5.2 + Math.random() * 0.5;

        flare.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );

        flare.userData = {
            originalPos: flare.position.clone(),
            speed: 0.5 + Math.random() * 1.5,
            amplitude: 0.2 + Math.random() * 0.8,
            phase: Math.random() * Math.PI * 2,
            lifetime: Math.random() * 100,
            maxLifetime: 50 + Math.random() * 100
        };

        solarFlares.push(flare);
        flareGroup.add(flare);
    }

    scene.add(flareGroup);
}

function updateSolarFlares(time) {
    solarFlares.forEach((flare, index) => {
        flare.userData.lifetime += 0.016;

        // Animate flare movement
        const t = time * flare.userData.speed + flare.userData.phase;
        const originalPos = flare.userData.originalPos;
        const amplitude = flare.userData.amplitude;

        flare.position.x = originalPos.x + Math.sin(t) * amplitude;
        flare.position.y = originalPos.y + Math.cos(t * 1.3) * amplitude;
        flare.position.z = originalPos.z + Math.sin(t * 0.7) * amplitude;

        // Pulsing effect
        const scale = 1 + Math.sin(t * 2) * 0.3;
        flare.scale.setScalar(scale);

        // Opacity based on camera distance (more visible when closer)
        const distanceToCamera = camera.position.distanceTo(flare.position);
        const opacityMultiplier = Math.max(0.2, 1 - distanceToCamera / 100);
        flare.material.opacity = 0.3 + opacityMultiplier * 0.7;

        // Reset flare position periodically
        if (flare.userData.lifetime > flare.userData.maxLifetime) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 5.2 + Math.random() * 0.5;

            flare.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );

            flare.userData.originalPos = flare.position.clone();
            flare.userData.lifetime = 0;
            flare.userData.maxLifetime = 50 + Math.random() * 100;
        }
    });
}

// ============================================================
// PLANETS CREATION
// ============================================================
function createPlanets() {
    planetData.forEach((data, index) => {
        const planetGroup = new THREE.Group();

        // Create planet sphere with procedural texture
        const planetGeometry = new THREE.SphereGeometry(data.radius, 64, 64);
        const planetMaterial = createPlanetMaterial(data);

        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.userData = { type: 'planet', name: data.name.toLowerCase() };
        planetGroup.add(planet);

        // Add atmosphere glow
        if (data.hasAtmosphere) {
            const atmosphereGeometry = new THREE.SphereGeometry(data.radius * data.atmosphereSize, 32, 32);
            const atmosphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    atmosphereColor: { value: new THREE.Color(data.atmosphereColor) },
                    viewVector: { value: camera.position }
                },
                vertexShader: `
                    uniform vec3 viewVector;
                    varying float intensity;
                    void main() {
                        vec3 vNormal = normalize(normalMatrix * normal);
                        vec3 vNormel = normalize(normalMatrix * viewVector);
                        intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 atmosphereColor;
                    varying float intensity;
                    void main() {
                        vec3 glow = atmosphereColor * intensity * 0.8;
                        gl_FragColor = vec4(glow, intensity * 0.5);
                    }
                `,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            planetGroup.add(atmosphere);
            planetGroup.userData.atmosphereMaterial = atmosphereMaterial;
        }

        // Add rings for Saturn
        if (data.hasRings) {
            const rings = createSaturnRings(data.radius);
            planetGroup.add(rings);
        }

        // Position planet in orbit
        const angle = Math.random() * Math.PI * 2;
        planetGroup.position.x = Math.cos(angle) * data.distance;
        planetGroup.position.z = Math.sin(angle) * data.distance;

        // Store orbit data
        planetGroup.userData = {
            ...data,
            angle: angle,
            orbitAngle: angle
        };

        planets.push(planetGroup);
        scene.add(planetGroup);

        // Create label
        createPlanetLabel(data.name, planetGroup);
    });
}

function createPlanetMaterial(data) {
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            baseColor: { value: new THREE.Color(data.color) },
            seed: { value: Math.random() * 100 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 baseColor;
            uniform float seed;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            // Hash function for random
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            // Noise function
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                    f.y
                );
            }

            // FBM noise
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for(int i = 0; i < 5; i++) {
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                // Surface detail noise
                vec2 uv = vUv * 10.0 + seed;
                float n = fbm(uv + time * 0.01);

                // Surface variation
                vec3 color = baseColor;
                color = mix(color * 0.7, color * 1.3, n);

                // Lighting
                vec3 lightDir = normalize(-vPosition);
                float diff = max(dot(vNormal, lightDir), 0.0);
                color *= 0.3 + diff * 0.7;

                // Specular highlight
                vec3 viewDir = normalize(cameraPosition - vPosition);
                vec3 reflectDir = reflect(-lightDir, vNormal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                color += vec3(0.2) * spec;

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });
}

function createSaturnRings(planetRadius) {
    const innerRadius = planetRadius * 1.4;
    const outerRadius = planetRadius * 2.5;

    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

    // Create ring texture
    const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
            innerRadius: { value: innerRadius },
            outerRadius: { value: outerRadius }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float innerRadius;
            uniform float outerRadius;
            varying vec2 vUv;

            void main() {
                float dist = length(vUv - 0.5) * 2.0;

                // Ring bands
                float band = sin(dist * 50.0) * 0.5 + 0.5;
                float transparency = smoothstep(0.0, 0.1, dist) * smoothstep(1.0, 0.9, dist);

                vec3 color = mix(vec3(0.76, 0.70, 0.50), vec3(0.90, 0.85, 0.70), band);
                float alpha = transparency * (0.4 + band * 0.3);

                gl_FragColor = vec4(color, alpha);
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.NormalBlending
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    rings.rotation.y = 0.4; // Tilt

    return rings;
}

// ============================================================
// ORBITS CREATION
// ============================================================
function createOrbits() {
    planetData.forEach(data => {
        const orbitGeometry = new THREE.BufferGeometry();
        const points = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(
                Math.cos(angle) * data.distance,
                0,
                Math.sin(angle) * data.distance
            );
        }

        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x444466,
            transparent: true,
            opacity: 0.4,
            linewidth: 1
        });

        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        orbits.push(orbit);
        scene.add(orbit);
    });
}

// ============================================================
// PLANET LABELS
// ============================================================
function createPlanetLabel(name, planetGroup) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = name;
    labelDiv.style.display = 'block';
    document.body.appendChild(labelDiv);

    labels.push({
        element: labelDiv,
        planet: planetGroup
    });
}

function updateLabels() {
    labels.forEach(label => {
        if (!showLabels) {
            label.element.style.display = 'none';
            return;
        }

        const position = new THREE.Vector3();
        position.setFromMatrixPosition(label.planet.matrixWorld);
        position.y += label.planet.userData.radius + 1;

        const projected = position.clone().project(camera);

        // Check if label is in front of camera
        if (projected.z < 1) {
            const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

            label.element.style.left = `${x}px`;
            label.element.style.top = `${y}px`;
            label.element.style.display = 'block';
        } else {
            label.element.style.display = 'none';
        }
    });
}

// ============================================================
// BACKGROUND STARS
// ============================================================
function createBackgroundStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const starsVertices = [];
    const starColors = [];

    for (let i = 0; i < 15000; i++) {
        const x = (Math.random() - 0.5) * 4000;
        const y = (Math.random() - 0.5) * 4000;
        const z = (Math.random() - 0.5) * 4000;
        starsVertices.push(x, y, z);

        // Slight color variation
        const colorVariation = Math.random();
        if (colorVariation > 0.95) {
            // Blue-white stars
            starColors.push(0.7, 0.8, 1.0);
        } else if (colorVariation > 0.9) {
            // Yellow stars
            starColors.push(1.0, 0.95, 0.8);
        } else if (colorVariation > 0.85) {
            // Red stars
            starColors.push(1.0, 0.7, 0.7);
        } else {
            // White stars
            starColors.push(1.0, 1.0, 1.0);
        }
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

    starsMaterial.vertexColors = true;
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Add nebula background
    createNebulaBackground();
}

function createNebulaBackground() {
    // Create several nebula clouds
    for (let i = 0; i < 5; i++) {
        const nebulaGeometry = new THREE.PlaneGeometry(500, 500);
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color().setHSL(Math.random(), 0.5, 0.2) },
                color2: { value: new THREE.Color().setHSL(Math.random(), 0.5, 0.1) },
                seed: { value: Math.random() * 100 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float seed;
                varying vec2 vUv;

                float noise(vec2 p) {
                    return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
                }

                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for(int i = 0; i < 5; i++) {
                        value += amplitude * noise(p);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }

                void main() {
                    vec2 uv = vUv * 3.0;
                    float n = fbm(uv);
                    vec3 color = mix(color1, color2, n);
                    float alpha = n * 0.3;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        nebula.position.set(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            -800 - Math.random() * 500
        );
        nebula.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scene.add(nebula);
    }
}

// ============================================================
// COSMIC RAYS
// ============================================================
function createCosmicRays() {
    for (let i = 0; i < 20; i++) {
        const rayGeometry = new THREE.BufferGeometry();
        const length = 50 + Math.random() * 100;
        const vertices = new Float32Array([
            0, 0, 0,
            length, 0, 0
        ]);
        rayGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const rayMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.5, 0.7),
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        const ray = new THREE.Line(rayGeometry, rayMaterial);
        ray.position.set(
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 500
        );
        ray.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        ray.userData = {
            speed: 0.5 + Math.random() * 1,
            fadeIn: Math.random() > 0.5
        };

        cosmicRays.push(ray);
        scene.add(ray);
    }
}

function updateCosmicRays(delta) {
    if (!showCosmicRays) return;

    cosmicRays.forEach(ray => {
        ray.material.opacity += (ray.userData.fadeIn ? 0.01 : -0.01) * ray.userData.speed;

        if (ray.material.opacity >= 0.6) ray.userData.fadeIn = false;
        if (ray.material.opacity <= 0.1) ray.userData.fadeIn = true;

        ray.rotation.x += 0.001 * ray.userData.speed;
        ray.rotation.z += 0.0005 * ray.userData.speed;
    });
}

// ============================================================
// SHOOTING STARS
// ============================================================
function createShootingStars() {
    for (let i = 0; i < 10; i++) {
        createShootingStar();
    }
}

function createShootingStar() {
    const trailLength = 30;
    const positions = new Float32Array(trailLength * 3);

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });

    const shootingStar = new THREE.Line(trailGeometry, trailMaterial);

    // Random start position
    const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 600,
        200 + Math.random() * 200,
        (Math.random() - 0.5) * 600
    );

    const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -1,
        (Math.random() - 0.5) * 2
    ).normalize();

    shootingStar.userData = {
        active: false,
        startPos: startPos.clone(),
        position: startPos.clone(),
        direction: direction,
        speed: 2 + Math.random() * 3,
        trail: [],
        trailLength: trailLength,
        timer: Math.random() * 10,
        nextActivation: 5 + Math.random() * 15
    };

    shootingStars.push(shootingStar);
    scene.add(shootingStar);
}

function updateShootingStars(delta) {
    shootingStars.forEach(star => {
        if (!showShootingStars) {
            star.material.opacity = 0;
            return;
        }

        star.userData.timer += delta;

        if (!star.userData.active) {
            if (star.userData.timer > star.userData.nextActivation) {
                // Activate shooting star
                star.userData.active = true;
                star.userData.timer = 0;
                star.userData.position = star.userData.startPos.clone();
                star.userData.trail = [];

                // New random start position
                star.userData.startPos.set(
                    (Math.random() - 0.5) * 600,
                    200 + Math.random() * 200,
                    (Math.random() - 0.5) * 600
                );

                // New random direction
                star.userData.direction.set(
                    (Math.random() - 0.5) * 2,
                    -1,
                    (Math.random() - 0.5) * 2
                ).normalize();
            }
            return;
        }

        // Move shooting star
        star.userData.position.add(
            star.userData.direction.clone().multiplyScalar(star.userData.speed)
        );

        // Update trail
        star.userData.trail.unshift(star.userData.position.clone());
        if (star.userData.trail.length > star.userData.trailLength) {
            star.userData.trail.pop();
        }

        // Update geometry
        const positions = star.geometry.attributes.position.array;
        for (let i = 0; i < star.userData.trailLength; i++) {
            if (i < star.userData.trail.length) {
                positions[i * 3] = star.userData.trail[i].x;
                positions[i * 3 + 1] = star.userData.trail[i].y;
                positions[i * 3 + 2] = star.userData.trail[i].z;
            } else {
                positions[i * 3] = star.userData.position.x;
                positions[i * 3 + 1] = star.userData.position.y;
                positions[i * 3 + 2] = star.userData.position.z;
            }
        }
        star.geometry.attributes.position.needsUpdate = true;

        // Fade based on position
        const fadeProgress = 1 - (star.userData.startPos.y - star.userData.position.y) / 400;
        star.material.opacity = Math.max(0, (1 - fadeProgress) * 0.8);

        // Deactivate when too low or far
        if (star.userData.position.y < -100 || fadeProgress > 1) {
            star.userData.active = false;
            star.userData.timer = 0;
            star.userData.nextActivation = 5 + Math.random() * 15;
            star.material.opacity = 0;
        }
    });
}

// ============================================================
// AMBIENT LIGHTING
// ============================================================
function createAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
    scene.add(ambientLight);
}

// ============================================================
// ANIMATION LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Update sun shader
    if (sun && sun.userData.material) {
        sun.userData.material.uniforms.time.value = time;
    }

    // Update solar flares
    if (showFlares) {
        updateSolarFlares(time);
    }

    // Update planets
    planets.forEach((planet, index) => {
        const data = planet.userData;

        // Orbit around sun
        data.orbitAngle += delta * data.orbitSpeed * 0.1 * orbitSpeedMultiplier;
        planet.position.x = Math.cos(data.orbitAngle) * data.distance;
        planet.position.z = Math.sin(data.orbitAngle) * data.distance;

        // Self rotation
        planet.children[0].rotation.y += delta * data.rotationSpeed * 0.5 * rotationSpeedMultiplier;

        // Update planet shader time
        if (planet.children[0].material.uniforms) {
            planet.children[0].material.uniforms.time.value = time;
        }

        // Update atmosphere
        if (planet.userData.atmosphereMaterial) {
            planet.userData.atmosphereMaterial.uniforms.viewVector.value = camera.position;
        }
    });

    // Update sun glow
    if (sun && sun.userData.glowMaterial) {
        sun.userData.glowMaterial.uniforms.viewVector.value = camera.position;
    }

    // Slowly rotate stars
    if (stars) {
        stars.rotation.y += 0.00005;
    }

    // Update effects
    updateCosmicRays(delta);
    updateShootingStars(delta);
    updateLabels();

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
}

// ============================================================
// EVENT HANDLERS
// ============================================================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const planetMeshes = planets.map(p => p.children[0]);
    planetMeshes.push(sun.children[0]);

    const intersects = raycaster.intersectObjects(planetMeshes);

    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const planetMeshes = planets.map(p => p.children[0]);
    planetMeshes.push(sun.children[0]);

    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        if (object.userData.type === 'sun') {
            showSunInfo();
        } else if (object.userData.type === 'planet') {
            showPlanetInfo(object.userData.name);
        }
    }
}

// ============================================================
// UI FUNCTIONS
// ============================================================
function showPlanetInfo(planetName) {
    fetch(`/api/planet-info/${planetName}`)
        .then(response => response.json())
        .then(data => {
            if (data.name) {
                document.getElementById('planet-name').textContent = data.name;
                document.getElementById('info-diameter').textContent = data.diameter;
                document.getElementById('info-distance').textContent = data.distance_from_sun;
                document.getElementById('info-orbital').textContent = data.orbital_period;
                document.getElementById('info-day').textContent = data.day_length;
                document.getElementById('info-temp').textContent = data.temperature;
                document.getElementById('info-moons').textContent = data.moons;
                document.getElementById('info-desc').textContent = data.description;

                document.getElementById('info-panel').classList.add('visible');
                document.getElementById('info-panel').classList.remove('hidden');
            }
        });
}

function showSunInfo() {
    fetch('/api/sun-info')
        .then(response => response.json())
        .then(data => {
            document.getElementById('planet-name').textContent = data.name;
            document.getElementById('info-diameter').textContent = data.diameter;
            document.getElementById('info-distance').textContent = 'Center of Solar System';
            document.getElementById('info-orbital').textContent = data.type;
            document.getElementById('info-day').textContent = data.age;
            document.getElementById('info-temp').textContent = data.surface_temperature;
            document.getElementById('info-moons').textContent = data.composition;
            document.getElementById('info-desc').textContent = data.description;

            document.getElementById('info-panel').classList.add('visible');
            document.getElementById('info-panel').classList.remove('hidden');
        });
}

function focusOnPlanet(planetName) {
    const planet = planets.find(p => p.userData.name.toLowerCase() === planetName.toLowerCase());

    if (planet) {
        const targetPosition = planet.position.clone();
        const offset = planet.userData.radius * 8;

        // Animate camera to planet
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(
            targetPosition.x + offset,
            targetPosition.y + offset * 0.5,
            targetPosition.z + offset
        );

        const duration = 1500;
        const startTime = Date.now();

        function animateCamera() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            camera.position.lerpVectors(startPosition, endPosition, eased);
            controls.target.lerp(targetPosition, eased);

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        }

        animateCamera();
    } else if (planetName.toLowerCase() === 'sun') {
        // Focus on sun
        const endPosition = new THREE.Vector3(30, 20, 30);
        const startPosition = camera.position.clone();
        const duration = 1500;
        const startTime = Date.now();

        function animateCamera() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            camera.position.lerpVectors(startPosition, endPosition, eased);
            controls.target.set(0, 0, 0);

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        }

        animateCamera();
    }
}

function setupUIControls() {
    // Orbit speed slider
    document.getElementById('orbit-speed').addEventListener('input', (e) => {
        orbitSpeedMultiplier = parseFloat(e.target.value);
        document.getElementById('orbit-speed-value').textContent = orbitSpeedMultiplier.toFixed(1) + 'x';
    });

    // Rotation speed slider
    document.getElementById('rotation-speed').addEventListener('input', (e) => {
        rotationSpeedMultiplier = parseFloat(e.target.value);
        document.getElementById('rotation-speed-value').textContent = rotationSpeedMultiplier.toFixed(1) + 'x';
    });

    // Show orbits checkbox
    document.getElementById('show-orbits').addEventListener('change', (e) => {
        showOrbits = e.target.checked;
        orbits.forEach(orbit => orbit.visible = showOrbits);
    });

    // Show labels checkbox
    document.getElementById('show-labels').addEventListener('change', (e) => {
        showLabels = e.target.checked;
    });

    // Show flares checkbox
    document.getElementById('show-flares').addEventListener('change', (e) => {
        showFlares = e.target.checked;
        solarFlares.forEach(flare => flare.visible = showFlares);
    });

    // Show shooting stars checkbox
    document.getElementById('show-shooting-stars').addEventListener('change', (e) => {
        showShootingStars = e.target.checked;
    });

    // Show cosmic rays checkbox
    document.getElementById('show-cosmic-rays').addEventListener('change', (e) => {
        showCosmicRays = e.target.checked;
        cosmicRays.forEach(ray => ray.visible = showCosmicRays);
    });

    // Reset camera button
    document.getElementById('reset-camera').addEventListener('click', () => {
        const startPosition = camera.position.clone();
        const endPosition = new THREE.Vector3(80, 60, 120);
        const duration = 1000;
        const startTime = Date.now();

        function animateReset() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            camera.position.lerpVectors(startPosition, endPosition, eased);
            controls.target.set(0, 0, 0);

            if (progress < 1) {
                requestAnimationFrame(animateReset);
            }
        }

        animateReset();
    });

    // Fullscreen button
    document.getElementById('toggle-fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.getElementById('toggle-fullscreen').textContent = 'Exit Full';
        } else {
            document.exitFullscreen();
            document.getElementById('toggle-fullscreen').textContent = 'Fullscreen';
        }
    });

    // Close info panel
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.remove('visible');
        document.getElementById('info-panel').classList.add('hidden');
    });

    // Planet bar buttons
    document.querySelectorAll('.planet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const planetName = btn.dataset.planet;
            focusOnPlanet(planetName);

            if (planetName === 'sun') {
                showSunInfo();
            } else {
                showPlanetInfo(planetName);
            }

            // Update active state
            document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ============================================================
// START APPLICATION
// ============================================================
init();