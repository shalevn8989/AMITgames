import * as THREE from 'three';

// --- Configuration ---
const MATERIALS = {
    chocolate: {
        name: 'שוקולד חלב',
        formula: '',
        meltingPoint: 30,
        boilingPoint: 150,
        particleColor: 0x4A3728, // Brown
        particleCount: 800,
        stateDescriptions: {
            solid: 'במצב מוצק השוקולד קשה ומסודר במבנה גבישי. המולקולות צפופות ומסודרות, מה שנותן לשוקולד את הצורה והמרקם המוכרים שלו.',
            liquid: 'כשהשוקולד נמס, המולקולות מתחילות לנוע בחופשיות. השוקולד הופך לנוזלי וזורם, מה שמאפשר לנו להשתמש בו לציפוי או לאפייה.',
            gas: 'בטמפרטורות גבוהות מאוד השוקולד מתחיל להישרף ולהתאדות. ריח השוקולד באוויר מגיע מחלקיקים קטנטנים שהתאדו.'
        }
    },
    sugar: {
        name: 'סוכר',
        formula: '',
        meltingPoint: 160,
        boilingPoint: 186,
        particleColor: 0xFFFFFF, // White
        particleCount: 600,
        stateDescriptions: {
            solid: 'גבישי הסוכר המוצקים מסודרים במבנה גבישי מדויק. זו הצורה המוכרת של הסוכר שאנו מוסיפים לתה או לקפה.',
            liquid: 'כשהסוכר נמס, הגבישים המסודרים מתפרקים והופכים לנוזל צמיגי שקוף. זהו הבסיס להכנת קרמל.',
            gas: 'בחום גבוה מאוד הסוכר מתפרק ומתאדה. בשלב זה הוא עלול להישרף ולהפוך לשחור.'
        }
    },
    oil: {
        name: 'שמן זית',
        formula: '',
        meltingPoint: 2,
        boilingPoint: 190,
        particleColor: 0xC2B280, // Olive
        particleCount: 1000,
        stateDescriptions: {
            solid: 'בקור, מולקולות השמן מתארגנות במבנה מסודר והשמן מתקשה. זה קורה למשל כששמן זית מאוחסן במקרר.',
            liquid: 'בטמפרטורת החדר השמן נוזלי, והמולקולות נעות בחופשיות. זהו המצב הטבעי והשימושי ביותר של השמן.',
            gas: 'בחום גבוה מאוד השמן מתחיל להתאדות ולעשן. זהו מצב מסוכן שיש להימנע ממנו בבישול.'
        }
    },
    milk: {
        name: 'חלב',
        formula: '',
        meltingPoint: 0,
        boilingPoint: 100,
        particleColor: 0xFFFAFA, // Off-white
        particleCount: 900,
        stateDescriptions: {
            solid: 'כשהחלב קופא במקפיא, המים שבו הופכים לקרח והשומן מתקשה. המולקולות מסתדרות במבנה גבישי מסודר.',
            liquid: 'במצבו הרגיל, החלב הוא תערובת של מים, שומן, חלבונים וסוכרים. המולקולות נעות בחופשיות ויוצרות נוזל אחיד.',
            gas: 'בחימום, החלב מתאדה והופך לאדים. תהליך זה משמש בייצור אבקת חלב.'
        }
    }
};

// --- DOM Elements ---
const materialSelect = document.getElementById('material-select');
const temperatureSlider = document.getElementById('temperature-slider');
const currentTemperatureSpan = document.getElementById('current-temperature');
const currentStateSpan = document.getElementById('current-state');
const macroscopicView = document.getElementById('macroscopic-view');
const microscopicViewContainer = document.getElementById('microscopic-view');
const temperatureInput = document.getElementById('temperature-input');

// --- Three.js Variables ---
let scene, camera, renderer;
let particles;
let currentMaterialKey = 'chocolate'; // Changed from 'water' to 'chocolate'
let currentTemperature = 25;
let currentState = 'liquid';

// --- Particle Simulation Variables ---
let particlePositions, particleVelocities, particleAccelerations;
let particleGeometry, particleMaterial;
let particleSystem;

// --- Initialization ---
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, microscopicViewContainer.clientWidth / microscopicViewContainer.clientHeight, 0.1, 1000);
    camera.position.z = 20;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(microscopicViewContainer.clientWidth, microscopicViewContainer.clientHeight);
    renderer.setClearColor(0x000000); // Black background for the scene
    microscopicViewContainer.appendChild(renderer.domElement);

    // Initial particles
    createParticles(MATERIALS[currentMaterialKey].particleCount, MATERIALS[currentMaterialKey].particleColor);

    // Event Listeners
    materialSelect.addEventListener('change', onMaterialChange);
    temperatureSlider.addEventListener('input', onTemperatureChange);
    temperatureInput.addEventListener('change', onTemperatureInputChange);
    document.querySelectorAll('.check-answer').forEach(button => {
        button.addEventListener('click', checkAnswer);
    });

    // Initial state update
    updateLabState(currentMaterialKey, currentTemperature);

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function createParticles(count, color) {
    if (particleSystem) {
        scene.remove(particleSystem);
        particleGeometry.dispose();
        particleMaterial.dispose();
    }

    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const accelerations = new Float32Array(count * 3);

    particlePositions = new Array(count).fill(0).map(() => new THREE.Vector3());
    particleVelocities = new Array(count).fill(0).map(() => new THREE.Vector3());
    particleAccelerations = new Array(count).fill(0).map(() => new THREE.Vector3());

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        particlePositions[i].set(x, y, z);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        velocities[i * 3] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleVelocities = Array.from({ length: count }, () => new THREE.Vector3());
    particleAccelerations = Array.from({ length: count }, () => new THREE.Vector3());

    particleMaterial = new THREE.PointsMaterial({
        color: color,
        size: 0.4,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9
    });

    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    updateParticles();
    renderer.render(scene, camera);
}

// --- Particle Update Logic ---
const maxSpeed = 0.05; // Base max speed for gas state
const liquidConfinement = 5; // Radius for liquid state
const solidJiggle = 0.005; // Max displacement for solid vibration

function updateParticles() {
    const positions = particleSystem.geometry.attributes.position.array;
    const count = particlePositions.length; // Use the array of Vector3 for logic

    const tempFactor = (currentTemperature - MATERIALS[currentMaterialKey].meltingPoint) /
                       (MATERIALS[currentMaterialKey].boilingPoint - MATERIALS[currentMaterialKey].meltingPoint);
    let motionFactor = 0; // Ranges from 0 (solid) to 1 (gas)
    let vibrationIntensity = 0;
    let cohesionFactor = 0;

    if (currentState === 'solid') {
        motionFactor = 0;
        vibrationIntensity = Math.min(1, Math.max(0, (currentTemperature - MATERIALS[currentMaterialKey].meltingPoint + 50) / 100)); // Jiggle increases near melting
        cohesionFactor = 0; // Strong cohesion
    } else if (currentState === 'liquid') {
        motionFactor = Math.min(1, Math.max(0, tempFactor * 0.5 + 0.5)); // Some motion, more chaotic than solid
        vibrationIntensity = 0.5; // Constant jiggle
        cohesionFactor = 0.02; // Weaker cohesion, particles can slide
    } else if (currentState === 'gas') {
        motionFactor = 1; // Full random motion
        vibrationIntensity = 0; // No "jiggle" as they're free moving
        cohesionFactor = 1; // No cohesion, particles repel/collide
    }

    for (let i = 0; i < count; i++) {
        const p = particlePositions[i]; // Get current Vector3 position
        const v = particleVelocities[i];
        const a = particleAccelerations[i];

        // Apply forces based on state
        if (currentState === 'solid') {
            // Very slight random jiggle around original fixed position
            v.set(
                (Math.random() - 0.5) * solidJiggle * vibrationIntensity,
                (Math.random() - 0.5) * solidJiggle * vibrationIntensity,
                (Math.random() - 0.5) * solidJiggle * vibrationIntensity
            );
            // Limit movement to stay near original position
            p.add(v);
            const originalPos = new THREE.Vector3(
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            );
            const displacement = p.distanceTo(originalPos);
            if (displacement > 0.5) { // Arbitrary limit
                p.sub(v.clone().multiplyScalar(0.5)); // Pull back
            }

            // A tiny amount of 'drift' for visual interest
            p.x += (Math.random() - 0.5) * 0.0001;
            p.y += (Math.random() - 0.5) * 0.0001;
            p.z += (Math.random() - 0.5) * 0.0001;


        } else if (currentState === 'liquid') {
            // Apply slight random walk
            v.x += (Math.random() - 0.5) * 0.002;
            v.y += (Math.random() - 0.5) * 0.002;
            v.z += (Math.random() - 0.5) * 0.002;

            // Simple "cohesion" - pull towards center if too far
            if (p.length() > liquidConfinement) {
                a.copy(p).negate().setLength(0.005);
            } else {
                a.set(0, 0, 0);
            }

            // Random repulsion from other particles (simplified for performance)
            for (let j = i + 1; j < count; j += 10) { // Check only a subset for performance
                const otherP = particlePositions[j];
                const distance = p.distanceTo(otherP);
                if (distance < 1.0) { // If too close
                    const repulsion = p.clone().sub(otherP).normalize().multiplyScalar(0.001 / (distance + 0.1));
                    a.add(repulsion);
                }
            }

            v.add(a).multiplyScalar(0.98); // Apply acceleration and friction
            v.clampLength(-maxSpeed * 0.5, maxSpeed * 0.5); // Clamp speed
            p.add(v);

            // Bounce off "walls" of the confinement area
            if (Math.abs(p.x) > 10 || Math.abs(p.y) > 10 || Math.abs(p.z) > 10) {
                 p.x *= 0.9; p.y *= 0.9; p.z *= 0.9; // Pull back towards center
                 v.multiplyScalar(-0.5); // Reverse velocity
            }


        } else if (currentState === 'gas') {
            // Completely random walk, high speed
            v.x += (Math.random() - 0.5) * 0.02;
            v.y += (Math.random() - 0.5) * 0.02;
            v.z += (Math.random() - 0.5) * 0.02;

            // Repulsion and collisions
            for (let j = i + 1; j < count; j += 10) { // Check only a subset for performance
                const otherP = particlePositions[j];
                const distance = p.distanceTo(otherP);
                if (distance < 0.8) { // If very close, apply strong repulsion
                    const repulsion = p.clone().sub(otherP).normalize().multiplyScalar(0.005 / (distance + 0.1));
                    a.add(repulsion);
                }
            }

            v.add(a).multiplyScalar(0.99); // Apply acceleration and slight friction
            v.clampLength(-maxSpeed, maxSpeed); // Clamp speed
            p.add(v);

            // Bounce off "walls" of the container
            if (Math.abs(p.x) > 10) v.x *= -1;
            if (Math.abs(p.y) > 10) v.y *= -1;
            if (Math.abs(p.z) > 10) v.z *= -1;
            p.x = THREE.MathUtils.clamp(p.x, -10, 10);
            p.y = THREE.MathUtils.clamp(p.y, -10, 10);
            p.z = THREE.MathUtils.clamp(p.z, -10, 10);
        }

        // Update BufferGeometry positions
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
}


// --- Event Handlers ---
function onMaterialChange(event) {
    currentMaterialKey = event.target.value;
    const materialData = MATERIALS[currentMaterialKey];
    
    // Update temperature slider min/max based on new material's properties
    // This makes the slider more relevant to the material's typical temperature range
    temperatureSlider.min = materialData.meltingPoint - 200;
    temperatureSlider.max = materialData.boilingPoint + 300;
    
    // Reset temperature to a sensible default or within the new range
    if (currentTemperature < temperatureSlider.min || currentTemperature > temperatureSlider.max) {
        currentTemperature = Math.round((materialData.meltingPoint + materialData.boilingPoint) / 2);
        currentTemperature = Math.max(temperatureSlider.min, Math.min(temperatureSlider.max, currentTemperature));
        temperatureSlider.value = currentTemperature;
    }

    createParticles(materialData.particleCount, materialData.particleColor);
    updateLabState(currentMaterialKey, currentTemperature);
    updateTemperatureDisplay(); // Ensure temperature display updates immediately
}

function onTemperatureChange(event) {
    currentTemperature = parseInt(event.target.value, 10);
    temperatureInput.value = currentTemperature; // Update the number input
    updateLabState(currentMaterialKey, currentTemperature);
    updateTemperatureDisplay();
}

function onTemperatureInputChange(event) {
    const value = parseInt(event.target.value);
    if (value >= temperatureSlider.min && value <= temperatureSlider.max) {
        temperatureSlider.value = value;
        currentTemperature = value;
        updateLabState(currentMaterialKey, currentTemperature);
        updateTemperatureDisplay();
    }
}

function checkAnswer(event) {
    const button = event.target;
    const question = button.closest('.question');
    const input = question.querySelector('.answer-input');
    const feedback = question.querySelector('.feedback');
    const correctAnswer = button.dataset.correct;

    let isCorrect = false;
    if (input.type === 'number') {
        const value = parseInt(input.value);
        // Allow for a margin of error of ±2 degrees
        isCorrect = Math.abs(value - parseInt(correctAnswer)) <= 2;
    } else {
        isCorrect = input.value === correctAnswer;
    }

    feedback.textContent = isCorrect ? 'נכון מאוד!' : 'נסה שוב';
    feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        button.disabled = true;
        input.disabled = true;
    }
}

function updateTemperatureDisplay() {
    currentTemperatureSpan.textContent = currentTemperature;
}

function updateLabState(materialKey, temperature) {
    const material = MATERIALS[materialKey];
    let newState;

    if (temperature <= material.meltingPoint) {
        newState = 'solid';
    } else if (temperature >= material.boilingPoint) {
        newState = 'gas';
    } else {
        newState = 'liquid';
    }

    if (newState !== currentState) {
        currentState = newState;
        currentStateSpan.textContent = getHebrewStateName(currentState);
        
        // Update state description
        const stateDescription = document.getElementById('state-description');
        stateDescription.textContent = material.stateDescriptions[currentState];

        // Optionally, reset particle positions slightly for a visual "jump" to new state
        if (currentState === 'solid') {
            for (let i = 0; i < particlePositions.length; i++) {
                // Initial solid positions, slightly structured
                const p = particlePositions[i];
                const gridX = Math.floor(i / 100);
                const gridY = Math.floor((i % 100) / 10);
                const gridZ = i % 10;
                p.set(
                    (gridX - 2.5) * 2 + (Math.random() - 0.5) * 0.5,
                    (gridY - 2.5) * 2 + (Math.random() - 0.5) * 0.5,
                    (gridZ - 2.5) * 2 + (Math.random() - 0.5) * 0.5
                );
                particleVelocities[i].set(0,0,0);
            }
        } else if (currentState === 'liquid') {
             for (let i = 0; i < particlePositions.length; i++) {
                // Scatter them randomly within a liquid "beaker" shape (sphere)
                const p = particlePositions[i];
                const radius = 8; // Confinement radius for liquid
                const phi = Math.acos(2 * Math.random() - 1); // For spherical distribution
                const theta = Math.random() * Math.PI * 2;
                p.set(
                    radius * Math.sin(phi) * Math.cos(theta) * (Math.random() * 0.8 + 0.2),
                    radius * Math.sin(phi) * Math.sin(theta) * (Math.random() * 0.8 + 0.2),
                    radius * Math.cos(phi) * (Math.random() * 0.8 + 0.2)
                );
                particleVelocities[i].set((Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01);
            }
        } else if (currentState === 'gas') {
             for (let i = 0; i < particlePositions.length; i++) {
                // Scatter them randomly throughout the whole container
                const p = particlePositions[i];
                p.set(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );
                particleVelocities[i].set((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1);
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true; // Crucial for Three.js
    }
}

function getHebrewStateName(state) {
    switch (state) {
        case 'solid': return 'מוצק';
        case 'liquid': return 'נוזל';
        case 'gas': return 'גז';
        default: return 'לא ידוע';
    }
}

// --- Window Resizing ---
function onWindowResize() {
    camera.aspect = microscopicViewContainer.clientWidth / microscopicViewContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(microscopicViewContainer.clientWidth, microscopicViewContainer.clientHeight);
}

// --- Start the Lab ---
init();