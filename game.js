   // game.js
   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
   const renderer = new THREE.WebGLRenderer();
   renderer.setSize(window.innerWidth, window.innerHeight);
   document.body.appendChild(renderer.domElement);

   // Add ambient light
   const light = new THREE.AmbientLight(0x404040); // soft white light
   scene.add(light);

   // Add directional light
   const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
   directionalLight.position.set(5, 5, 5);
   scene.add(directionalLight);

   // Load the GLTF model
   const loader = new THREE.GLTFLoader();
   loader.load('assets/models/bedroom.glb', function (gltf) {
       console.log('Model loaded successfully');
       const model = gltf.scene;
       scene.add(model);
       model.position.set(0, 0, 0); // Adjust the position as needed
       
       // Position the camera inside the room after the model is loaded
       camera.position.set(0, 1.7, 0); // Set height to average human height (1.7 meters)
       camera.rotation.y = Math.PI; // Face forward into the room
   }, undefined, function (error) {
       console.error('Error loading model:', error);
   });

   // Meters logic
   let sleepValue = 100;
   let wellnessValue = 100;

   function updateMeters() {
       const sleepMeter = document.getElementById('sleep-meter');
       const wellnessMeter = document.getElementById('wellness-meter');
       if (sleepMeter && wellnessMeter) {
           sleepMeter.style.width = sleepValue + 'px';
           wellnessMeter.style.width = wellnessValue + 'px';
       } else {
           console.error('Meters not found in the DOM');
       }
   }

   setInterval(() => {
       sleepValue = Math.max(0, sleepValue - 1);
       updateMeters();
   }, 1000);

   const controls = new THREE.PointerLockControls(camera, document.body);

   // Movement variables
   let moveForward = false;
   let moveBackward = false;
   let moveLeft = false;
   let moveRight = false;
   const moveSpeed = 0.02; // Further reduced movement speed for more precise control

   // Room boundaries (adjusted for smaller room)
   const roomBounds = {
       minX: -1.3,  // Left wall
       maxX: 2,   // Right wall
       minZ: -2,  // Back wall
       maxZ: 2,   // Front wall
       minY: 0,   // Floor
       maxY: 2    // Ceiling
   };

   // Handle keyboard events
   document.addEventListener('click', function() {
       controls.lock();
   });

   document.addEventListener('keydown', function(event) {
       switch (event.code) {
           case 'ArrowUp':
           case 'KeyW':
               moveForward = true;
               break;
           case 'ArrowDown':
           case 'KeyS':
               moveBackward = true;
               break;
           case 'ArrowLeft':
           case 'KeyA':
               moveLeft = true;
               break;
           case 'ArrowRight':
           case 'KeyD':
               moveRight = true;
               break;
       }
   });

   document.addEventListener('keyup', function(event) {
       switch (event.code) {
           case 'ArrowUp':
           case 'KeyW':
               moveForward = false;
               break;
           case 'ArrowDown':
           case 'KeyS':
               moveBackward = false;
               break;
           case 'ArrowLeft':
           case 'KeyA':
               moveLeft = false;
               break;
           case 'ArrowRight':
           case 'KeyD':
               moveRight = false;
               break;
       }
   });

   // Character management
   const characters = {
       models: {},
       animations: {},
       currentState: {}
   };

   // Load character models
   function loadCharacter(name, modelPath, animations = {}) {
       const loader = new THREE.GLTFLoader();
       loader.load(modelPath, function (gltf) {
           const model = gltf.scene;
           model.visible = false; // Start hidden
           scene.add(model);
           
           // Store the model
           characters.models[name] = model;
           
           // Store animations if any
           if (gltf.animations.length > 0) {
               characters.animations[name] = gltf.animations;
           }
           
           // Initialize state
           characters.currentState[name] = {
               visible: false,
               currentAnimation: null,
               position: new THREE.Vector3(),
               rotation: new THREE.Euler()
           };
           
           console.log(`Character ${name} loaded successfully`);
       });
   }

   // Show/hide character
   function toggleCharacter(name, visible, position = null, rotation = null) {
       if (characters.models[name]) {
           characters.models[name].visible = visible;
           characters.currentState[name].visible = visible;
           
           if (position) {
               characters.models[name].position.copy(position);
               characters.currentState[name].position.copy(position);
           }
           
           if (rotation) {
               characters.models[name].rotation.copy(rotation);
               characters.currentState[name].rotation.copy(rotation);
           }
       }
   }

   // Play character animation
   function playCharacterAnimation(name, animationName) {
       if (characters.animations[name] && characters.models[name]) {
           const mixer = new THREE.AnimationMixer(characters.models[name]);
           const animation = characters.animations[name].find(clip => clip.name === animationName);
           
           if (animation) {
               const action = mixer.clipAction(animation);
               action.play();
               characters.currentState[name].currentAnimation = action;
           }
       }
   }

   // Example story events
   const storyEvents = {
       triggerEvent1: function() {
           toggleCharacter('character1', true, new THREE.Vector3(0, 0, 0));
           playCharacterAnimation('character1', 'idle');
       },
       
       triggerEvent2: function() {
           // Hide character
           toggleCharacter('character1', false);
       }
   };

   // Update character animations
   const mixers = [];

   function updateCharacters(deltaTime) {
       mixers.forEach(mixer => mixer.update(deltaTime));
   }

   // Modify the animate function to include character updates
   let clock = new THREE.Clock();

   function animate() {
       requestAnimationFrame(animate);
       
       const deltaTime = clock.getDelta();

       if (controls.isLocked) {
           if (moveForward) controls.moveForward(moveSpeed);
           if (moveBackward) controls.moveForward(-moveSpeed);
           if (moveLeft) controls.moveRight(-moveSpeed);
           if (moveRight) controls.moveRight(moveSpeed);
           checkCollision();
       }

       updateCharacters(deltaTime);
       renderer.render(scene, camera);
   }

   animate();

   // Handle user interactions
   window.addEventListener('keydown', (event) => {
       if (event.key === ' ') { // Example interaction
           wellnessValue = Math.max(0, wellnessValue - 10);
           updateMeters();
       }
   });

   renderer.domElement.addEventListener('click', function(event) {
       // Example: Log the click event
       console.log('Scene clicked');
   });

   function checkCollision() {
       const cameraPosition = camera.position;
       
       // Check wall collisions
       if (cameraPosition.x < roomBounds.minX) {
           cameraPosition.x = roomBounds.minX;
       } else if (cameraPosition.x > roomBounds.maxX) {
           cameraPosition.x = roomBounds.maxX;
       }
       
       if (cameraPosition.z < roomBounds.minZ) {
           cameraPosition.z = roomBounds.minZ;
       } else if (cameraPosition.z > roomBounds.maxZ) {
           cameraPosition.z = roomBounds.maxZ;
       }
       
       // Keep player at constant height
       cameraPosition.y = 1.7;
   }

   // Example usage:
   // Load your character models
   loadCharacter('character1', 'assets/models/character1.glb');
   loadCharacter('character2', 'assets/models/character2.glb');

   // Trigger story events (example)
   // You can call these based on player position, time, or other triggers
   // storyEvents.triggerEvent1();
   // storyEvents.triggerEvent2();

   // Example: Show character when player enters a specific area
   function checkPlayerPosition() {
       if (camera.position.distanceTo(new THREE.Vector3(0, 1.7, 0)) < 2) {
           storyEvents.triggerEvent1();
       }
   }