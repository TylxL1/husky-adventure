// ========================================
// HUSKY DONJON GAME - Main Game File
// ========================================

class HuskyDonjonGame {
    constructor() {
        // Configuration du jeu
        this.config = {
            weapon: null,
            difficulty: null,
            currentLevel: 1,
            maxLevel: 4
        };

        // Stats du joueur
        this.player = {
            health: 100,
            maxHealth: 100,
            shield: 0,
            maxShield: 100,
            attackPower: 10,
            speed: 0.2,
            position: { x: 0, y: 1, z: 0 }
        };

        // Armes configuration
        this.weapons = {
            sword: {
                name: "Épée Courte",
                range: 2,
                damage: 15,
                attackSpeed: 0.5,
                chargeMultiplier: 2
            },
            spear: {
                name: "Lance Moyenne",
                range: 4,
                damage: 12,
                attackSpeed: 0.7,
                chargeMultiplier: 2.5
            },
            bow: {
                name: "Arc Long",
                range: 15,
                damage: 10,
                attackSpeed: 1.0,
                chargeMultiplier: 3
            }
        };

        // Multiplicateurs de difficulté
        this.difficultyMultipliers = {
            easy: { enemyHealth: 0.7, enemyDamage: 0.7, enemyCount: 0.8 },
            normal: { enemyHealth: 1.0, enemyDamage: 1.0, enemyCount: 1.0 },
            hard: { enemyHealth: 1.3, enemyDamage: 1.3, enemyCount: 1.2 },
            hardcore: { enemyHealth: 1.6, enemyDamage: 1.6, enemyCount: 1.5 },
            impossible: { enemyHealth: 2.0, enemyDamage: 2.0, enemyCount: 2.0 }
        };

        // État du jeu
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            enemies: [],
            artifacts: [],
            activeEffects: [],
            totalKills: 0,
            projectiles: [] // Pour les flèches de l'arc
        };

        // Contrôles
        this.keys = {};
        this.mouse = { x: 0, y: 0, sensitivity: 0.002 };
        this.isAttacking = false;
        this.chargeStartTime = 0;
        this.lastAttackTime = 0;

        // Caméra FPS
        this.cameraRotation = { horizontal: 0, vertical: 0 };

        // Références Babylon.js
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.playerMesh = null;

        this.init();
    }

    // ========================================
    // INITIALISATION
    // ========================================

    init() {
        console.log("Initialisation du jeu...");
        this.log("Init: Démarrage");

        try {
            this.setupMenuListeners();
            this.log("Init: Menu listeners OK");

            this.setupCanvas();
            this.log("Init: Canvas OK");
        } catch (error) {
            this.log("ERREUR Init: " + error.message);
            console.error(error);
        }
    }

    log(message) {
        const debugDiv = document.getElementById('debugInfo');
        if (debugDiv) {
            debugDiv.innerHTML += '<br>' + message;
        }
        console.log(message);
    }

    setupCanvas() {
        try {
            this.canvas = document.getElementById('renderCanvas');
            this.log("Canvas trouvé: " + (this.canvas ? "OUI" : "NON"));

            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });
            this.log("Moteur Babylon créé: OUI");

            // Créer la scène
            this.createScene();
            this.log("Scène créée: OUI");

            // Démarrer la boucle de rendu (même avant le début du jeu)
            this.engine.runRenderLoop(() => {
                if (this.gameState.isPlaying && !this.gameState.isPaused) {
                    this.update();
                }
                this.scene.render();
            });
            this.log("Boucle de rendu démarrée: OUI");

            // Gestion du redimensionnement
            window.addEventListener('resize', () => {
                this.engine.resize();
            });
        } catch (error) {
            this.log("ERREUR setupCanvas: " + error.message);
            console.error(error);
        }
    }

    setupMenuListeners() {
        // Sélection d'arme
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.config.weapon = btn.getAttribute('data-weapon');
                this.checkStartButton();
            });
        });

        // Sélection de difficulté
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.config.difficulty = btn.getAttribute('data-difficulty');
                this.checkStartButton();
            });
        });

        // Bouton de démarrage
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Menu d'amélioration
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const upgrade = btn.getAttribute('data-upgrade');
                this.applyUpgrade(upgrade);
                this.nextLevel();
            });
        });

        // Bouton restart (Game Over)
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        // Bouton rejouer (Victoire)
        document.getElementById('victoryRestartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    checkStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        if (this.config.weapon && this.config.difficulty) {
            startBtn.disabled = false;
        }
    }

    // ========================================
    // CRÉATION DE LA SCÈNE 3D
    // ========================================

    createScene() {
        try {
            // Créer la scène
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);
            this.log("Scene: Scène de base OK");

            // Gravité pour le réalisme
            this.scene.gravity = new BABYLON.Vector3(0, -0.5, 0);
            this.scene.collisionsEnabled = true;

            // Lumières
            const ambientLight = new BABYLON.HemisphericLight(
                "ambientLight",
                new BABYLON.Vector3(0, 1, 0),
                this.scene
            );
            ambientLight.intensity = 0.6;

            const dirLight = new BABYLON.DirectionalLight(
                "dirLight",
                new BABYLON.Vector3(-1, -2, -1),
                this.scene
            );
            dirLight.intensity = 0.7;
            this.log("Scene: Lumières OK");

            // Créer le sol
            this.createGround();
            this.log("Scene: Sol OK");

            // Créer l'environnement (tour)
            this.createTowerEnvironment();
            this.log("Scene: Tour OK");

            // Créer le joueur
            this.createPlayer();
            this.log("Scene: Joueur OK");

            // Créer la caméra (3ème personne)
            this.createCamera();
            this.log("Scene: Caméra OK");

            console.log("Scène créée avec succès");
        } catch (error) {
            this.log("ERREUR createScene: " + error.message);
            console.error(error);
        }
    }

    createGround() {
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 50, height: 50 },
            this.scene
        );

        // Matériau du sol (style pixel art - damier)
        const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);

        // Texture procédurale pour un effet pixel art
        const groundTexture = new BABYLON.DynamicTexture("groundTexture", 512, this.scene);
        const ctx = groundTexture.getContext();

        // Dessiner un damier pixel art
        const tileSize = 32;
        for (let x = 0; x < 512; x += tileSize) {
            for (let y = 0; y < 512; y += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                ctx.fillStyle = isEven ? '#2a4a3a' : '#1a3a2a';
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
        groundTexture.update();

        groundMat.diffuseTexture = groundTexture;
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
        ground.material = groundMat;

        ground.checkCollisions = true;
        ground.receiveShadows = true;
    }

    createTowerEnvironment() {
        // Murs de la tour (4 murs formant une salle)
        const wallHeight = 10;
        const roomSize = 50;

        // Matériau des murs (pierre pixel art)
        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
        wallMat.specularColor = new BABYLON.Color3(0, 0, 0);

        // Mur Nord
        const wallNorth = BABYLON.MeshBuilder.CreateBox("wallNorth", {
            width: roomSize,
            height: wallHeight,
            depth: 1
        }, this.scene);
        wallNorth.position.z = roomSize / 2;
        wallNorth.position.y = wallHeight / 2;
        wallNorth.material = wallMat;
        wallNorth.checkCollisions = true;

        // Mur Sud
        const wallSouth = BABYLON.MeshBuilder.CreateBox("wallSouth", {
            width: roomSize,
            height: wallHeight,
            depth: 1
        }, this.scene);
        wallSouth.position.z = -roomSize / 2;
        wallSouth.position.y = wallHeight / 2;
        wallSouth.material = wallMat;
        wallSouth.checkCollisions = true;

        // Mur Est
        const wallEast = BABYLON.MeshBuilder.CreateBox("wallEast", {
            width: 1,
            height: wallHeight,
            depth: roomSize
        }, this.scene);
        wallEast.position.x = roomSize / 2;
        wallEast.position.y = wallHeight / 2;
        wallEast.material = wallMat;
        wallEast.checkCollisions = true;

        // Mur Ouest
        const wallWest = BABYLON.MeshBuilder.CreateBox("wallWest", {
            width: 1,
            height: wallHeight,
            depth: roomSize
        }, this.scene);
        wallWest.position.x = -roomSize / 2;
        wallWest.position.y = wallHeight / 2;
        wallWest.material = wallMat;
        wallWest.checkCollisions = true;

        // Plafond
        const ceiling = BABYLON.MeshBuilder.CreateGround("ceiling", {
            width: roomSize,
            height: roomSize
        }, this.scene);
        ceiling.position.y = wallHeight;
        ceiling.rotation.z = Math.PI;
        const ceilingMat = new BABYLON.StandardMaterial("ceilingMat", this.scene);
        ceilingMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
        ceilingMat.specularColor = new BABYLON.Color3(0, 0, 0);
        ceiling.material = ceilingMat;
    }

    createPlayer() {
        // Pour l'instant, un simple cube représente le joueur
        this.playerMesh = BABYLON.MeshBuilder.CreateBox("player", {
            width: 1,
            height: 2,
            depth: 1
        }, this.scene);

        // Position du joueur : y=1 car le cube fait 2 unités de haut (de 0 à 2)
        // Mais on va le baisser un peu pour qu'il touche vraiment le sol
        this.playerMesh.position.y = 0.95; // Légèrement enfoncé dans le sol pour éviter l'effet flottant
        this.playerMesh.position.x = 0;
        this.playerMesh.position.z = 0;

        // Matériau du joueur (couleur différente selon l'arme choisie)
        const playerMat = new BABYLON.StandardMaterial("playerMat", this.scene);
        playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0); // Bleu par défaut
        playerMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
        this.playerMesh.material = playerMat;

        this.playerMesh.checkCollisions = true;
        this.playerMesh.ellipsoid = new BABYLON.Vector3(0.6, 1, 0.6); // Un peu plus large pour mieux détecter
        this.playerMesh.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0);

        // En mode FPS, cacher le corps du joueur (on ne se voit pas soi-même)
        this.playerMesh.visibility = 0;

        // L'arme sera créée plus tard quand le joueur choisira son arme
        this.weaponMesh = null;
    }

    createWeaponMesh() {
        // Vérifier qu'une arme a été choisie
        if (!this.config.weapon) {
            console.log("Aucune arme choisie, création ignorée");
            return;
        }

        if (this.weaponMesh) {
            this.weaponMesh.dispose();
        }

        const weaponConfig = this.weapons[this.config.weapon];
        let weaponMesh;

        // Créer l'arme selon le type
        switch (this.config.weapon) {
            case 'sword':
                // Épée courte (petit rectangle)
                weaponMesh = BABYLON.MeshBuilder.CreateBox("weapon", {
                    width: 0.2,
                    height: 1.2,
                    depth: 0.1
                }, this.scene);
                weaponMesh.material = this.createWeaponMaterial(new BABYLON.Color3(0.7, 0.7, 0.8));
                break;

            case 'spear':
                // Lance (cylindre long)
                weaponMesh = BABYLON.MeshBuilder.CreateCylinder("weapon", {
                    height: 2,
                    diameter: 0.15
                }, this.scene);
                weaponMesh.rotation.x = Math.PI / 2;
                weaponMesh.material = this.createWeaponMaterial(new BABYLON.Color3(0.6, 0.4, 0.2));
                break;

            case 'bow':
                // Arc (forme incurvée simple)
                weaponMesh = BABYLON.MeshBuilder.CreateBox("weapon", {
                    width: 0.15,
                    height: 1.5,
                    depth: 0.3
                }, this.scene);
                weaponMesh.material = this.createWeaponMaterial(new BABYLON.Color3(0.4, 0.3, 0.2));
                break;
        }

        // Positionner l'arme devant le joueur
        weaponMesh.parent = this.playerMesh;
        weaponMesh.position = new BABYLON.Vector3(0.5, 0, 1);

        this.weaponMesh = weaponMesh;
        this.log("Arme créée: " + this.config.weapon);
    }

    createWeaponMaterial(color) {
        const mat = new BABYLON.StandardMaterial("weaponMat", this.scene);
        mat.diffuseColor = color;
        mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        return mat;
    }

    createCamera() {
        // Caméra FPS - À la hauteur des yeux du joueur
        this.camera = new BABYLON.UniversalCamera(
            "camera",
            new BABYLON.Vector3(0, 1.6, 0),
            this.scene
        );

        // La caméra est enfant du joueur (bouge avec lui)
        this.camera.parent = this.playerMesh;
        this.camera.position = new BABYLON.Vector3(0, 0.65, 0); // Hauteur des yeux (joueur fait 2 unités, yeux à 1.6)

        // Désactiver les contrôles par défaut de la caméra
        this.camera.keysUp = [];
        this.camera.keysDown = [];
        this.camera.keysLeft = [];
        this.camera.keysRight = [];

        // Limiter la rotation verticale (ne pas regarder trop haut ou trop bas)
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = (Math.PI / 2) - 0.1;
    }

    // ========================================
    // CONTRÔLES
    // ========================================

    setupControls() {
        // Éviter de créer plusieurs listeners si appelé plusieurs fois
        if (this.controlsSetup) {
            console.log("Contrôles déjà configurés");
            return;
        }
        this.controlsSetup = true;
        console.log("Configuration des contrôles...");

        // Clavier
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Souris pour la rotation
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });

        // Attaque - utiliser window au lieu de canvas pour capturer même avec pointer lock
        window.addEventListener('mousedown', (e) => {
            console.log("Mousedown détecté, button:", e.button, "isPlaying:", this.gameState.isPlaying);
            if (e.button === 0 && this.gameState.isPlaying) { // Clic gauche
                console.log("Tentative d'attaque...");
                this.startAttack();
            }
        });

        window.addEventListener('mouseup', (e) => {
            console.log("Mouseup détecté, button:", e.button, "isPlaying:", this.gameState.isPlaying);
            if (e.button === 0 && this.gameState.isPlaying) {
                console.log("Relâchement d'attaque...");
                this.releaseAttack();
            }
        });

        // Ramasser artefact (touche E)
        window.addEventListener('keypress', (e) => {
            if (e.key.toLowerCase() === 'e') {
                this.pickupArtifact();
            }
        });
    }

    onMouseMove(e) {
        if (!this.gameState.isPlaying) return;

        // Rotation horizontale = tourner le JOUEUR (pas juste la caméra)
        this.playerMesh.rotation.y -= e.movementX * this.mouse.sensitivity;

        // Rotation verticale = tourner la CAMÉRA (haut/bas)
        this.camera.rotation.x -= e.movementY * this.mouse.sensitivity;

        // Limiter la rotation verticale (ne pas regarder trop haut ou trop bas)
        this.camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.camera.rotation.x));
    }

    // ========================================
    // BOUCLE DE JEU
    // ========================================

    startGame() {
        console.log(`Démarrage du jeu - Arme: ${this.config.weapon}, Difficulté: ${this.config.difficulty}`);
        this.log(`Jeu: Démarrage - ${this.config.weapon} / ${this.config.difficulty}`);

        // Cacher le menu, afficher le HUD
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameHUD').classList.remove('hidden');
        this.log("Jeu: Menu caché, HUD affiché");

        // Créer l'arme maintenant que le choix est fait
        this.createWeaponMesh();

        // Configurer les contrôles
        this.setupControls();
        this.log("Jeu: Contrôles configurés");

        // Démarrer le niveau 1
        this.gameState.isPlaying = true;
        this.startLevel(1);
        this.log("Jeu: Niveau 1 démarré");

        // Mettre à jour l'affichage
        this.updateHUD();
        this.log("Jeu: HUD mis à jour");
        this.log("✅ JEU PRÊT! Cliquez sur l'écran pour verrouiller la souris");
    }

    update() {
        if (this.gameState.isPaused) return;

        // Gérer le mouvement du joueur
        this.handlePlayerMovement();

        // Gérer les effets actifs
        this.updateEffects();

        // Mettre à jour les ennemis
        this.updateEnemies();

        // Mettre à jour les projectiles (flèches)
        this.updateProjectiles();

        // Vérifier les collisions d'attaque
        this.checkAttackCollisions();

        // Mettre à jour le HUD
        this.updateHUD();
    }

    updateProjectiles() {
        const now = Date.now();

        for (let i = this.gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.gameState.projectiles[i];

            // Vérifier si le projectile a expiré
            if (now - projectile.createdAt > projectile.lifetime) {
                projectile.mesh.dispose();
                this.gameState.projectiles.splice(i, 1);
                continue;
            }

            // Déplacer le projectile
            const movement = projectile.direction.scale(projectile.speed);
            projectile.mesh.position.addInPlace(movement);

            // Vérifier les collisions
            let hit = false;

            if (projectile.isEnemyProjectile) {
                // Flèche ennemie : vérifier collision avec le joueur
                const distance = BABYLON.Vector3.Distance(
                    projectile.mesh.position,
                    this.playerMesh.position
                );

                if (distance < 1.5) {
                    this.damagePlayer(projectile.damage);
                    hit = true;
                }
            } else {
                // Flèche du joueur : vérifier collision avec les ennemis
                this.gameState.enemies.forEach(enemy => {
                    if (enemy.health <= 0) return;

                    const distance = BABYLON.Vector3.Distance(
                        projectile.mesh.position,
                        enemy.mesh.position
                    );

                    // Si la flèche touche un ennemi (distance < 1.5)
                    if (distance < 1.5) {
                        this.damageEnemy(enemy, projectile.damage);
                        hit = true;
                    }
                });
            }

            // Si la flèche a touché, la détruire
            if (hit) {
                projectile.mesh.dispose();
                this.gameState.projectiles.splice(i, 1);
                continue;
            }

            // Vérifier si la flèche sort de la salle
            const pos = projectile.mesh.position;
            if (Math.abs(pos.x) > 25 || Math.abs(pos.z) > 25 || pos.y < 0 || pos.y > 10) {
                projectile.mesh.dispose();
                this.gameState.projectiles.splice(i, 1);
            }
        }
    }

    handlePlayerMovement() {
        const speed = this.player.speed;
        let forward = 0;
        let right = 0;

        // ZQSD (WASD) - relatif à la direction de la caméra
        if (this.keys['z'] || this.keys['w']) {
            forward = 1;
        }
        if (this.keys['s']) {
            forward = -1;
        }
        if (this.keys['d']) {
            right = 1;
        }
        if (this.keys['q'] || this.keys['a']) {
            right = -1;
        }

        // Si aucun mouvement, ne rien faire
        if (forward === 0 && right === 0) {
            return;
        }

        // Calcul FPS classique : mouvement basé sur l'orientation du JOUEUR
        const angle = this.playerMesh.rotation.y;

        // Forward/backward selon la direction du joueur
        const forwardX = Math.sin(angle) * forward;
        const forwardZ = Math.cos(angle) * forward;

        // Strafe left/right (perpendiculaire à la direction)
        const strafeX = Math.sin(angle + Math.PI / 2) * right;
        const strafeZ = Math.cos(angle + Math.PI / 2) * right;

        // Combiner les mouvements
        const moveX = forwardX + strafeX;
        const moveZ = forwardZ + strafeZ;

        const moveDirection = new BABYLON.Vector3(moveX, 0, moveZ);
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }

        // Déplacer le joueur (PAS DE ROTATION DU CORPS ICI - seule la souris fait tourner)
        this.playerMesh.moveWithCollisions(moveDirection.scale(speed));

        // Empêcher le joueur de sortir de la salle
        const limit = 23;
        if (this.playerMesh.position.x > limit) this.playerMesh.position.x = limit;
        if (this.playerMesh.position.x < -limit) this.playerMesh.position.x = -limit;
        if (this.playerMesh.position.z > limit) this.playerMesh.position.z = limit;
        if (this.playerMesh.position.z < -limit) this.playerMesh.position.z = -limit;

        // Empêcher le joueur de tomber sous le sol
        if (this.playerMesh.position.y < 0.95) this.playerMesh.position.y = 0.95;
    }

    // ========================================
    // SYSTÈME DE COMBAT
    // ========================================

    startAttack() {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.chargeStartTime = Date.now();

        console.log("Attaque commencée (maintenir pour charger)");
        this.log("⚔️ Attaque en charge...");
    }

    releaseAttack() {
        if (!this.isAttacking) return;

        const now = Date.now();
        const weaponConfig = this.weapons[this.config.weapon];

        // Cooldown basé sur l'arme (en millisecondes)
        const cooldown = weaponConfig.attackSpeed * 1000;

        // Vérifier si le cooldown est passé
        if (now - this.lastAttackTime < cooldown) {
            console.log("Attaque en cooldown!");
            this.log("⏱️ Attaque en cooldown...");
            this.isAttacking = false;
            return;
        }

        const chargeTime = (now - this.chargeStartTime) / 1000; // en secondes

        // Calculer le multiplicateur de charge (max 1 seconde de charge)
        const chargeMultiplier = 1 + Math.min(chargeTime, 1) * (weaponConfig.chargeMultiplier - 1);
        const damage = weaponConfig.damage * this.player.attackPower / 10 * chargeMultiplier;

        console.log(`Attaque relâchée! Charge: ${chargeTime.toFixed(2)}s, Dégâts: ${damage.toFixed(1)}`);

        // Arc = projectile, autres armes = mêlée
        if (this.config.weapon === 'bow') {
            // Tirer une flèche
            this.shootArrow(damage);
        } else {
            // Animation d'attaque mêlée
            this.performAttackAnimation();

            // Détecter les ennemis touchés
            this.dealDamageInRange(weaponConfig.range, damage);
        }

        // Enregistrer le temps de cette attaque
        this.lastAttackTime = now;

        this.isAttacking = false;
    }

    shootArrow(damage) {
        console.log("Tir de flèche!");
        this.log("🏹 Flèche tirée!");

        // Créer une flèche plus grosse et visible (sphère allongée)
        const arrow = BABYLON.MeshBuilder.CreateSphere("arrow", {
            diameterX: 0.3,
            diameterY: 0.3,
            diameterZ: 1.2, // Allongée dans une direction
            segments: 8
        }, this.scene);

        // Matériau de la flèche (jaune brillant très visible)
        const arrowMat = new BABYLON.StandardMaterial("arrowMat", this.scene);
        arrowMat.diffuseColor = new BABYLON.Color3(1, 1, 0.3); // Jaune vif
        arrowMat.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.2); // Lumineux
        arrowMat.specularColor = new BABYLON.Color3(1, 1, 0.5);
        arrow.material = arrowMat;

        // Position de départ : devant la caméra
        // Obtenir la position globale de la caméra
        const cameraWorldPos = this.camera.getAbsolutePosition();
        arrow.position = cameraWorldPos.clone();

        // Direction de tir = direction dans laquelle regarde la caméra
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
        const shootDirection = forward.clone();
        shootDirection.normalize();

        // Placer la flèche un peu devant la caméra
        arrow.position.addInPlace(shootDirection.scale(2));

        // Orientation de la flèche dans la direction du tir
        const horizontalAngle = Math.atan2(shootDirection.x, shootDirection.z);
        const verticalAngle = Math.asin(shootDirection.y);

        arrow.rotation.y = horizontalAngle;
        arrow.rotation.x = -verticalAngle;

        // Créer l'objet projectile
        const projectile = {
            mesh: arrow,
            direction: shootDirection,
            speed: 1.8, // Plus rapide
            damage: damage,
            lifetime: 5000,
            createdAt: Date.now()
        };

        this.gameState.projectiles.push(projectile);
    }

    performAttackAnimation() {
        if (!this.weaponMesh) return;

        // Animation simple de l'arme
        const originalPos = this.weaponMesh.position.clone();

        // Mouvement vers l'avant
        BABYLON.Animation.CreateAndStartAnimation(
            "attackAnim",
            this.weaponMesh,
            "position.z",
            60,
            10,
            originalPos.z,
            originalPos.z + 1,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Retour
        setTimeout(() => {
            BABYLON.Animation.CreateAndStartAnimation(
                "attackReturn",
                this.weaponMesh,
                "position.z",
                60,
                10,
                this.weaponMesh.position.z,
                originalPos.z,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }, 167); // 10 frames à 60fps
    }

    dealDamageInRange(range, damage) {
        console.log(`Recherche d'ennemis dans un rayon de ${range}. Ennemis total: ${this.gameState.enemies.length}`);

        let hitCount = 0;
        // Pour chaque ennemi, vérifier la distance
        this.gameState.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;

            const distance = BABYLON.Vector3.Distance(
                this.playerMesh.position,
                enemy.mesh.position
            );

            console.log(`Ennemi à distance: ${distance.toFixed(2)} (portée: ${range})`);

            if (distance <= range) {
                this.damageEnemy(enemy, damage);
                hitCount++;
            }
        });

        if (hitCount === 0) {
            console.log("Aucun ennemi touché");
            this.log("❌ Attaque ratée - aucun ennemi à portée");
        } else {
            this.log(`✅ ${hitCount} ennemi(s) touché(s)!`);
        }
    }

    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        console.log(`Ennemi touché! HP restants: ${enemy.health}`);

        // Flash rouge sur l'ennemi
        const originalColor = enemy.mesh.material.diffuseColor.clone();
        enemy.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);

        setTimeout(() => {
            if (enemy.mesh) {
                enemy.mesh.material.diffuseColor = originalColor;
            }
        }, 100);

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        console.log("Ennemi éliminé!");

        // Incrémenter le compteur de kills
        this.gameState.totalKills++;

        // Retirer l'ennemi de la liste
        const index = this.gameState.enemies.indexOf(enemy);
        if (index > -1) {
            this.gameState.enemies.splice(index, 1);
        }

        // Supprimer le mesh et l'arme
        if (enemy.weaponMesh) {
            enemy.weaponMesh.dispose();
        }
        if (enemy.mesh) {
            enemy.mesh.dispose();
        }

        // Vérifier si le niveau est terminé
        this.checkLevelComplete();
    }

    // ========================================
    // ENNEMIS (Placeholder pour l'instant)
    // ========================================

    updateEnemies() {
        const now = Date.now();

        this.gameState.enemies.forEach((enemy, index) => {
            if (enemy.health <= 0) return;

            const distance = BABYLON.Vector3.Distance(
                this.playerMesh.position,
                enemy.mesh.position
            );

            // Comportement selon l'arme
            if (enemy.weapon === 'bow') {
                // Les archers gardent leurs distances et tirent
                if (distance < 8) {
                    // Trop proche, reculer
                    const direction = enemy.mesh.position.subtract(this.playerMesh.position);
                    direction.y = 0;
                    direction.normalize();

                    // Ajouter variation latérale
                    const variation = Math.sin(now / 1000 + enemy.moveVariation) * 0.3;
                    direction.x += variation;
                    direction.normalize();

                    enemy.mesh.position.addInPlace(direction.scale(enemy.speed));
                } else if (distance > 15) {
                    // Trop loin, s'approcher
                    const direction = this.playerMesh.position.subtract(enemy.mesh.position);
                    direction.y = 0;
                    direction.normalize();
                    enemy.mesh.position.addInPlace(direction.scale(enemy.speed));
                }

                // Tirer à distance (toutes les 2 secondes)
                if (distance <= enemy.attackRange && (!enemy.lastShootTime || now - enemy.lastShootTime > 2000)) {
                    this.enemyShootArrow(enemy);
                    enemy.lastShootTime = now;
                }
            } else {
                // Ennemis de mêlée (épée, lance)
                const engageDistance = enemy.attackRange;

                if (distance < engageDistance) {
                    // Assez proche pour attaquer
                    if (!enemy.lastAttackTime || (now - enemy.lastAttackTime) > 1000) {
                        this.damagePlayer(enemy.damage);
                        enemy.lastAttackTime = now;
                    }

                    // Légère variation de position pour éviter d'être statique
                    const variation = Math.sin(now / 500 + enemy.moveVariation) * 0.02;
                    enemy.mesh.position.x += variation;
                } else {
                    // S'approcher du joueur avec variation de mouvement
                    const direction = this.playerMesh.position.subtract(enemy.mesh.position);
                    direction.y = 0;

                    // Ajouter variation sinusoïdale pour mouvement moins robotique
                    const time = now / 1000;
                    const waveOffset = Math.sin(time * 2 + enemy.moveVariation) * 0.2;
                    const perpendicularX = -direction.z * waveOffset;
                    const perpendicularZ = direction.x * waveOffset;

                    direction.x += perpendicularX;
                    direction.z += perpendicularZ;
                    direction.normalize();

                    enemy.mesh.position.addInPlace(direction.scale(enemy.speed));
                }
            }

            // Empêcher les ennemis de sortir de la salle
            const limit = 24;
            if (enemy.mesh.position.x > limit) enemy.mesh.position.x = limit;
            if (enemy.mesh.position.x < -limit) enemy.mesh.position.x = -limit;
            if (enemy.mesh.position.z > limit) enemy.mesh.position.z = limit;
            if (enemy.mesh.position.z < -limit) enemy.mesh.position.z = -limit;

            // Orienter l'ennemi vers le joueur
            const lookDirection = this.playerMesh.position.subtract(enemy.mesh.position);
            enemy.mesh.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);

            // Séparer les ennemis entre eux
            this.separateEnemyFromOthers(enemy, index);
        });
    }

    enemyShootArrow(enemy) {
        // Créer une flèche ennemie (sphère rouge)
        const arrow = BABYLON.MeshBuilder.CreateSphere("enemyArrow", {
            diameterX: 0.3,
            diameterY: 0.3,
            diameterZ: 1.0,
            segments: 8
        }, this.scene);

        const arrowMat = new BABYLON.StandardMaterial("enemyArrowMat", this.scene);
        arrowMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2); // Rouge vif
        arrowMat.emissiveColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Lumineux
        arrowMat.specularColor = new BABYLON.Color3(1, 0.3, 0.3);
        arrow.material = arrowMat;

        // Position de départ
        arrow.position = enemy.mesh.position.clone();
        arrow.position.y += 1;

        // Direction vers le joueur (viser la hauteur des yeux)
        const targetPos = this.playerMesh.position.clone();
        targetPos.y += 1.5;
        const direction = targetPos.subtract(arrow.position);
        direction.normalize();

        // Orientation
        const horizontalAngle = Math.atan2(direction.x, direction.z);
        const verticalAngle = Math.asin(direction.y);
        arrow.rotation.y = horizontalAngle;
        arrow.rotation.x = -verticalAngle;

        // Créer le projectile ennemi
        const projectile = {
            mesh: arrow,
            direction: direction,
            speed: 1.0, // Plus rapide
            damage: enemy.damage,
            lifetime: 5000,
            createdAt: Date.now(),
            isEnemyProjectile: true
        };

        this.gameState.projectiles.push(projectile);
    }

    separateEnemyFromOthers(enemy, currentIndex) {
        const separationDistance = 2.5; // Distance minimale entre ennemis (augmentée)
        const separationForce = 0.2; // Force de répulsion (augmentée)

        this.gameState.enemies.forEach((otherEnemy, otherIndex) => {
            // Ne pas se comparer à soi-même et ignorer les ennemis morts
            if (currentIndex === otherIndex || otherEnemy.health <= 0) return;

            const distance = BABYLON.Vector3.Distance(
                enemy.mesh.position,
                otherEnemy.mesh.position
            );

            // Si trop proche d'un autre ennemi, s'éloigner
            if (distance < separationDistance && distance > 0.1) {
                const pushDirection = enemy.mesh.position.subtract(otherEnemy.mesh.position);
                pushDirection.y = 0;
                pushDirection.normalize();

                // Pousser l'ennemi dans la direction opposée avec plus de force
                const pushAmount = (separationDistance - distance) * separationForce;
                enemy.mesh.position.addInPlace(pushDirection.scale(pushAmount));
            }
        });
    }

    damagePlayer(damage) {
        // D'abord, enlever le bouclier
        if (this.player.shield > 0) {
            const shieldDamage = Math.min(damage, this.player.shield);
            this.player.shield -= shieldDamage;
            damage -= shieldDamage;
        }

        // Ensuite, enlever la vie
        if (damage > 0) {
            this.player.health -= damage;
            console.log(`Joueur touché! HP: ${this.player.health}/${this.player.maxHealth}`);

            // Flash rouge sur l'écran
            this.flashDamage();

            // Vérifier si le joueur est mort
            if (this.player.health <= 0) {
                this.gameOver();
            }
        }

        this.updateHUD();
    }

    flashDamage() {
        // Créer un flash rouge rapide
        const flashDiv = document.createElement('div');
        flashDiv.style.position = 'fixed';
        flashDiv.style.top = '0';
        flashDiv.style.left = '0';
        flashDiv.style.width = '100%';
        flashDiv.style.height = '100%';
        flashDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        flashDiv.style.pointerEvents = 'none';
        flashDiv.style.zIndex = '150';
        document.body.appendChild(flashDiv);

        setTimeout(() => {
            flashDiv.remove();
        }, 100);
    }

    gameOver() {
        this.gameState.isPlaying = false;
        this.gameState.isPaused = true;

        console.log("Game Over!");

        // Afficher les statistiques
        document.getElementById('gameOverLevel').textContent = this.config.currentLevel;
        document.getElementById('gameOverKills').textContent = this.gameState.totalKills;

        // Cacher le HUD et afficher l'écran Game Over
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.remove('hidden');

        // Déverrouiller le curseur
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    restartGame() {
        console.log("Redémarrage du jeu...");

        // Réinitialiser tous les états
        this.config.currentLevel = 1;
        this.player.health = this.player.maxHealth;
        this.player.shield = 0;
        this.player.attackPower = 10;
        this.gameState.totalKills = 0;
        this.gameState.activeEffects = [];

        // Supprimer tous les ennemis et leurs armes
        this.gameState.enemies.forEach(e => {
            if (e.weaponMesh) e.weaponMesh.dispose();
            if (e.mesh) e.mesh.dispose();
        });
        this.gameState.enemies = [];

        // Supprimer tous les artefacts
        this.gameState.artifacts.forEach(a => {
            if (a.mesh) a.mesh.dispose();
        });
        this.gameState.artifacts = [];

        // Supprimer tous les projectiles
        this.gameState.projectiles.forEach(p => {
            if (p.mesh) p.mesh.dispose();
        });
        this.gameState.projectiles = [];

        // Réinitialiser la position du joueur
        this.playerMesh.position.set(0, 0.95, 0);
        this.playerMesh.rotation.y = 0;

        // Réinitialiser la caméra FPS
        this.camera.rotation.x = 0;
        this.camera.rotation.y = 0;

        // Masquer tous les menus et afficher le menu de départ
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('victoryMenu').classList.add('hidden');
        document.getElementById('upgradeMenu').classList.add('hidden');
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('startMenu').classList.remove('hidden');

        // Réinitialiser les sélections
        document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
        this.config.weapon = null;
        this.config.difficulty = null;
        document.getElementById('startGameBtn').disabled = true;

        // Arrêter le jeu
        this.gameState.isPlaying = false;
        this.gameState.isPaused = false;

        this.log("🔄 Jeu réinitialisé - Choisissez vos options");
    }

    // ========================================
    // SYSTÈME D'ARTEFACTS
    // ========================================

    pickupArtifact() {
        // Chercher un artefact proche
        const pickupRange = 3;

        for (let i = this.gameState.artifacts.length - 1; i >= 0; i--) {
            const artifact = this.gameState.artifacts[i];
            const distance = BABYLON.Vector3.Distance(
                this.playerMesh.position,
                artifact.mesh.position
            );

            if (distance <= pickupRange) {
                this.applyArtifactEffect(artifact);
                artifact.mesh.dispose();
                this.gameState.artifacts.splice(i, 1);
                console.log(`Artefact récupéré: ${artifact.type}`);
                break;
            }
        }
    }

    applyArtifactEffect(artifact) {
        const duration = 10000; // 10 secondes

        switch (artifact.type) {
            case 'speed':
                this.player.speed *= 1.5;
                this.addEffect('Vitesse', duration, () => {
                    this.player.speed /= 1.5;
                });
                break;

            case 'shield':
                this.player.shield = Math.min(this.player.maxShield, this.player.shield + 50);
                this.addEffect('Bouclier', duration, () => {
                    // Le bouclier diminue naturellement
                });
                break;

            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                break;
        }

        this.updateHUD();
    }

    addEffect(name, duration, onEnd) {
        const effect = {
            name: name,
            endTime: Date.now() + duration,
            onEnd: onEnd
        };

        this.gameState.activeEffects.push(effect);
        this.updateEffectsDisplay();
    }

    updateEffects() {
        const now = Date.now();

        for (let i = this.gameState.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.gameState.activeEffects[i];

            if (now >= effect.endTime) {
                effect.onEnd();
                this.gameState.activeEffects.splice(i, 1);
                this.updateEffectsDisplay();
            }
        }
    }

    updateEffectsDisplay() {
        const container = document.getElementById('activeEffects');
        container.innerHTML = '';

        this.gameState.activeEffects.forEach(effect => {
            const timeLeft = Math.ceil((effect.endTime - Date.now()) / 1000);
            const effectDiv = document.createElement('div');
            effectDiv.className = 'effect-icon';
            effectDiv.innerHTML = `<strong>${effect.name}</strong><br>${timeLeft}s`;
            container.appendChild(effectDiv);
        });
    }

    // ========================================
    // SYSTÈME DE NIVEAUX
    // ========================================

    startLevel(levelNumber) {
        console.log(`Démarrage du niveau ${levelNumber}`);
        this.config.currentLevel = levelNumber;

        // Nettoyer les ennemis précédents
        this.gameState.enemies.forEach(e => e.mesh.dispose());
        this.gameState.enemies = [];

        // Générer les ennemis pour ce niveau
        this.spawnEnemiesForLevel(levelNumber);

        this.updateHUD();
    }

    spawnEnemiesForLevel(level) {
        // Calculer le nombre d'ennemis selon le niveau et la difficulté
        const difficulty = this.difficultyMultipliers[this.config.difficulty];
        const baseCount = 10 + (level * 5); // 15, 20, 25, 30 ennemis de base
        const enemyCount = Math.floor(baseCount * difficulty.enemyCount);

        console.log(`Génération de ${enemyCount} ennemis`);

        // Répartir les ennemis en cercle autour du joueur pour éviter qu'ils soient tous au même endroit
        const radius = 15 + (level * 3); // Plus le niveau est élevé, plus ils sont loin au départ

        for (let i = 0; i < enemyCount; i++) {
            // Position en cercle avec un peu d'aléatoire
            const angle = (i / enemyCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const distance = radius + (Math.random() - 0.5) * 5;

            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            this.spawnEnemy('minion', x, z, level);
        }

        // Ajouter quelques lieutenants pour les niveaux supérieurs
        if (level >= 2) {
            const lieutenantCount = 3 + level;
            for (let i = 0; i < lieutenantCount; i++) {
                const angle = (i / lieutenantCount) * Math.PI * 2;
                const distance = radius - 5;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                this.spawnEnemy('lieutenant', x, z, level);
            }
        }

        // Boss au niveau 4
        if (level === 4) {
            this.spawnEnemy('boss', 0, 25, level);
        }
    }

    spawnEnemy(type, x, z, level) {
        const difficulty = this.difficultyMultipliers[this.config.difficulty];

        // Choisir une arme aléatoire pour l'ennemi
        const weapons = ['sword', 'spear', 'bow'];
        const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];

        let enemy = {
            type: type,
            level: level,
            health: 0,
            maxHealth: 0,
            damage: 0,
            speed: 0.05,
            mesh: null,
            weapon: randomWeapon,
            weaponMesh: null,
            attackRange: 0,
            lastShootTime: 0,
            moveVariation: Math.random() * Math.PI * 2 // Pour variation de mouvement
        };

        // Configuration selon le type
        switch (type) {
            case 'minion':
                enemy.maxHealth = 30 * level * difficulty.enemyHealth;
                enemy.damage = 5 * difficulty.enemyDamage;
                enemy.mesh = BABYLON.MeshBuilder.CreateBox("enemy", { size: 1.5 }, this.scene);
                enemy.mesh.material = this.createEnemyMaterial(new BABYLON.Color3(0.8, 0.2, 0.2));
                break;

            case 'lieutenant':
                enemy.maxHealth = 60 * level * difficulty.enemyHealth;
                enemy.damage = 10 * difficulty.enemyDamage;
                enemy.speed = 0.07;
                enemy.mesh = BABYLON.MeshBuilder.CreateBox("enemy", { size: 2 }, this.scene);
                enemy.mesh.material = this.createEnemyMaterial(new BABYLON.Color3(0.8, 0.4, 0.1));
                break;

            case 'boss':
                enemy.maxHealth = 200 * difficulty.enemyHealth;
                enemy.damage = 20 * difficulty.enemyDamage;
                enemy.speed = 0.08;
                enemy.mesh = BABYLON.MeshBuilder.CreateBox("enemy", { size: 3 }, this.scene);
                enemy.mesh.material = this.createEnemyMaterial(new BABYLON.Color3(0.5, 0.1, 0.8));
                break;
        }

        // Définir la portée selon l'arme
        switch (randomWeapon) {
            case 'sword':
                enemy.attackRange = 2;
                break;
            case 'spear':
                enemy.attackRange = 4;
                break;
            case 'bow':
                enemy.attackRange = 12;
                break;
        }

        enemy.health = enemy.maxHealth;
        enemy.mesh.position = new BABYLON.Vector3(x, enemy.mesh.scaling.y / 2, z);
        enemy.mesh.checkCollisions = true;

        // Créer l'arme visible pour l'ennemi
        this.createEnemyWeapon(enemy);

        this.gameState.enemies.push(enemy);
    }

    createEnemyWeapon(enemy) {
        let weapon;
        const size = enemy.mesh.getBoundingInfo().boundingBox.extendSize.x;

        switch (enemy.weapon) {
            case 'sword':
                weapon = BABYLON.MeshBuilder.CreateBox("enemyWeapon", {
                    width: 0.15,
                    height: 0.8,
                    depth: 0.08
                }, this.scene);
                weapon.material = this.createWeaponMaterial(new BABYLON.Color3(0.7, 0.7, 0.8));
                weapon.position = new BABYLON.Vector3(size * 0.7, 0, size * 0.5);
                break;

            case 'spear':
                weapon = BABYLON.MeshBuilder.CreateCylinder("enemyWeapon", {
                    height: 1.5,
                    diameter: 0.1
                }, this.scene);
                weapon.rotation.x = Math.PI / 2;
                weapon.material = this.createWeaponMaterial(new BABYLON.Color3(0.6, 0.4, 0.2));
                weapon.position = new BABYLON.Vector3(size * 0.5, 0, size * 0.8);
                break;

            case 'bow':
                weapon = BABYLON.MeshBuilder.CreateBox("enemyWeapon", {
                    width: 0.12,
                    height: 1.2,
                    depth: 0.25
                }, this.scene);
                weapon.material = this.createWeaponMaterial(new BABYLON.Color3(0.4, 0.3, 0.2));
                weapon.position = new BABYLON.Vector3(size * 0.7, 0, size * 0.3);
                break;
        }

        weapon.parent = enemy.mesh;
        enemy.weaponMesh = weapon;
    }

    createEnemyMaterial(color) {
        const mat = new BABYLON.StandardMaterial("enemyMat", this.scene);
        mat.diffuseColor = color;
        mat.emissiveColor = color.scale(0.2);
        return mat;
    }

    checkLevelComplete() {
        // Vérifier que le joueur est toujours vivant avant de célébrer la victoire !
        if (this.player.health <= 0) {
            return; // Le joueur est mort, ne pas continuer
        }

        if (this.gameState.enemies.length === 0) {
            console.log("Niveau terminé!");
            this.log("🎉 Niveau terminé!");

            if (this.config.currentLevel < this.config.maxLevel) {
                // Afficher le menu d'amélioration
                this.showUpgradeMenu();
            } else {
                // Victoire finale!
                this.showVictoryScreen();
            }
        }
    }

    showUpgradeMenu() {
        this.gameState.isPaused = true;
        document.getElementById('upgradeMenu').classList.remove('hidden');
    }

    applyUpgrade(upgrade) {
        switch (upgrade) {
            case 'health':
                this.player.maxHealth += 20;
                this.player.health = this.player.maxHealth;
                break;
            case 'shield':
                this.player.maxShield += 20;
                break;
            case 'attack':
                this.player.attackPower *= 1.15;
                break;
        }

        console.log(`Amélioration appliquée: ${upgrade}`);
    }

    nextLevel() {
        document.getElementById('upgradeMenu').classList.add('hidden');
        this.gameState.isPaused = false;
        this.startLevel(this.config.currentLevel + 1);
    }

    showVictoryScreen() {
        this.gameState.isPlaying = false;
        this.gameState.isPaused = true;

        console.log("Victoire!");
        this.log("🎉 VICTOIRE!");

        // Afficher les statistiques
        const difficultyNames = {
            easy: 'Facile',
            normal: 'Normal',
            hard: 'Difficile',
            hardcore: 'Hardcore',
            impossible: 'Impossible'
        };
        document.getElementById('victoryDifficulty').textContent = difficultyNames[this.config.difficulty];
        document.getElementById('victoryKills').textContent = this.gameState.totalKills;

        // Cacher le HUD et afficher l'écran de victoire
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('victoryMenu').classList.remove('hidden');

        // Déverrouiller le curseur
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    checkAttackCollisions() {
        // Placeholder pour la prochaine version
    }

    // ========================================
    // INTERFACE UTILISATEUR
    // ========================================

    updateHUD() {
        // Barres de vie et bouclier
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        const shieldPercent = (this.player.shield / this.player.maxShield) * 100;

        document.getElementById('healthBar').style.width = healthPercent + '%';
        document.getElementById('healthText').textContent =
            `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        document.getElementById('shieldBar').style.width = shieldPercent + '%';
        document.getElementById('shieldText').textContent =
            `${Math.ceil(this.player.shield)}/${this.player.maxShield}`;

        // Niveau et ennemis
        document.getElementById('currentLevel').textContent = this.config.currentLevel;
        document.getElementById('enemyCount').textContent = this.gameState.enemies.length;
    }
}

// ========================================
// DÉMARRAGE DU JEU
// ========================================

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new HuskyDonjonGame();
    });
} else {
    window.game = new HuskyDonjonGame();
}
