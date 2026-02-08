// ========================================
// HUSKY DONJON GAME - 2D Top-Down Version
// ========================================

class HuskyDonjonGame2D {
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
            speed: 0.45, // Beaucoup plus rapide
            position: { x: 0, z: 0 },
            rotation: 0 // Rotation vers la souris
        };

        // Armes configuration
        this.weapons = {
            sword: {
                name: "Épée Courte",
                range: 3.5, // Ajusté pour nouvelles tailles
                width: 1.5, // Largeur de la zone d'attaque
                damage: 15,
                attackSpeed: 0.2, // Réduit pour attaquer plus vite
                chargeMultiplier: 2
            },
            spear: {
                name: "Lance Moyenne",
                range: 5.0, // Ajusté pour nouvelles tailles
                width: 2,
                damage: 12,
                attackSpeed: 0.3, // Réduit pour attaquer plus vite
                chargeMultiplier: 2.5
            },
            bow: {
                name: "Arc Long",
                range: 15,
                damage: 10,
                attackSpeed: 0.4, // Réduit pour attaquer plus vite
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
            projectiles: [],
            activeEffects: [],
            totalKills: 0
        };

        // Contrôles
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldZ: 0 };
        this.isAttacking = false;
        this.chargeStartTime = 0;
        this.lastAttackTime = 0;

        // Références Babylon.js
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.playerMesh = null;

        this.init();
    }

    init() {
        console.log("Initialisation du jeu 2D...");
        this.setupMenuListeners();
        this.setupCanvas();
    }

    setupCanvas() {
        try {
            this.canvas = document.getElementById('renderCanvas');

            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });

            // Créer la scène
            this.createScene();

            // Démarrer la boucle de rendu
            this.engine.runRenderLoop(() => {
                if (this.gameState.isPlaying && !this.gameState.isPaused) {
                    this.update();
                }
                this.scene.render();
            });

            // Gestion du redimensionnement
            window.addEventListener('resize', () => {
                this.engine.resize();
            });
        } catch (error) {
            console.error("Erreur setupCanvas:", error);
        }
    }

    createScene() {
        try {
            // Créer la scène
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color3(0.15, 0.15, 0.2);

            // Lumière ambiante
            const light = new BABYLON.HemisphericLight(
                "light",
                new BABYLON.Vector3(0, 1, 0),
                this.scene
            );
            light.intensity = 1.5;

            // Créer le sol (plan 2D)
            this.createGround();

            // Créer la caméra vue du dessus
            this.createTopDownCamera();

            console.log("Scène 2D créée avec succès");
        } catch (error) {
            console.error("Erreur createScene:", error);
        }
    }

    createGround() {
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 120, height: 120 },
            this.scene
        );

        // Matériau du sol
        const groundMat = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.25);
        groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
        ground.material = groundMat;

        // Bordures de la zone de jeu
        this.createBorders();
    }

    createBorders() {
        const borderMat = new BABYLON.StandardMaterial("borderMat", this.scene);
        borderMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);

        const borderHeight = 0.5;
        const arenaSize = 120;

        // Nord
        const borderN = BABYLON.MeshBuilder.CreateBox("borderN", {
            width: arenaSize,
            height: borderHeight,
            depth: 1
        }, this.scene);
        borderN.position = new BABYLON.Vector3(0, borderHeight / 2, arenaSize / 2);
        borderN.material = borderMat;

        // Sud
        const borderS = BABYLON.MeshBuilder.CreateBox("borderS", {
            width: arenaSize,
            height: borderHeight,
            depth: 1
        }, this.scene);
        borderS.position = new BABYLON.Vector3(0, borderHeight / 2, -arenaSize / 2);
        borderS.material = borderMat;

        // Est
        const borderE = BABYLON.MeshBuilder.CreateBox("borderE", {
            width: 1,
            height: borderHeight,
            depth: arenaSize
        }, this.scene);
        borderE.position = new BABYLON.Vector3(arenaSize / 2, borderHeight / 2, 0);
        borderE.material = borderMat;

        // Ouest
        const borderW = BABYLON.MeshBuilder.CreateBox("borderW", {
            width: 1,
            height: borderHeight,
            depth: arenaSize
        }, this.scene);
        borderW.position = new BABYLON.Vector3(-arenaSize / 2, borderHeight / 2, 0);
        borderW.material = borderMat;
    }

    createTopDownCamera() {
        // Caméra orthographique vue du dessus
        this.camera = new BABYLON.FreeCamera(
            "camera",
            new BABYLON.Vector3(0, 50, 0),
            this.scene
        );

        // Regarder vers le bas
        this.camera.setTarget(BABYLON.Vector3.Zero());

        // Mode orthographique pour une vraie vue 2D
        this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

        const orthoSize = 35; // Augmenté pour voir plus loin
        const aspect = this.engine.getRenderWidth() / this.engine.getRenderHeight();
        this.camera.orthoLeft = -orthoSize * aspect;
        this.camera.orthoRight = orthoSize * aspect;
        this.camera.orthoTop = orthoSize;
        this.camera.orthoBottom = -orthoSize;
    }

    createPlayer() {
        // Triangle pour le joueur PLUS GROS (pointe vers le haut)
        const size = 2.0; // Beaucoup plus gros
        const trianglePoints = [
            new BABYLON.Vector3(0, 0, size),           // Pointe avant
            new BABYLON.Vector3(-size * 0.7, 0, -size * 0.5), // Arrière gauche
            new BABYLON.Vector3(size * 0.7, 0, -size * 0.5)   // Arrière droit
        ];

        const triangle = BABYLON.MeshBuilder.CreateLines("playerTriangle", {
            points: [...trianglePoints, trianglePoints[0]], // Fermer le triangle
            updatable: false
        }, this.scene);

        triangle.color = new BABYLON.Color3(0.2, 0.8, 1); // Bleu cyan vif

        // Remplissage du triangle
        const triangleFill = BABYLON.MeshBuilder.CreatePolygon("playerFill", {
            shape: trianglePoints.map(v => new BABYLON.Vector2(v.x, v.z)),
            depth: 0.2
        }, this.scene);
        triangleFill.rotation.x = -Math.PI / 2;
        triangleFill.position.y = 0.1;

        const playerMat = new BABYLON.StandardMaterial("playerMat", this.scene);
        playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1);
        playerMat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.5);
        triangleFill.material = playerMat;

        // Grouper les deux meshes
        this.playerMesh = new BABYLON.TransformNode("player", this.scene);
        triangle.parent = this.playerMesh;
        triangleFill.parent = this.playerMesh;

        this.playerMesh.position = new BABYLON.Vector3(0, 0.1, 0);

        console.log("Joueur (triangle) créé");
    }

    setupMenuListeners() {
        // Sélection d'arme
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.config.weapon = btn.getAttribute('data-weapon');
                this.checkStartButton();
            });
        });

        // Sélection de difficulté
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
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

        // Boutons restart
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

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

    startGame() {
        console.log(`Démarrage du jeu 2D - Arme: ${this.config.weapon}, Difficulté: ${this.config.difficulty}`);

        // Cacher le menu, afficher le HUD
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameHUD').classList.remove('hidden');

        // Créer le joueur
        this.createPlayer();

        // Configurer les contrôles
        this.setupControls();

        // Démarrer le niveau 1
        this.gameState.isPlaying = true;
        this.startLevel(1);

        // Mettre à jour l'affichage
        this.updateHUD();
    }

    setupControls() {
        // Éviter de créer plusieurs listeners
        if (this.controlsSetup) return;
        this.controlsSetup = true;

        // Clavier
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            // Touche F pour attaquer
            if (key === 'f' && this.gameState.isPlaying && !this.isAttacking) {
                this.startAttack();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;

            // Relâcher F pour libérer l'attaque
            if (key === 'f' && this.gameState.isPlaying && this.isAttacking) {
                this.releaseAttack();
            }
        });

        // Suivi de la souris pour rotation du joueur
        this.canvas.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        });

        // Attaque avec la touche F
        // Note: startAttack et releaseAttack sont déjà gérés dans keydown/keyup
    }

    onMouseMove(e) {
        if (!this.gameState.isPlaying) return;

        // Obtenir la position de la souris dans l'espace 2D
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;

        // Convertir en coordonnées monde
        const pickResult = this.scene.pick(this.mouse.x, this.mouse.y);
        if (pickResult.hit) {
            this.mouse.worldX = pickResult.pickedPoint.x;
            this.mouse.worldZ = pickResult.pickedPoint.z;
        }

        // Calculer la rotation du joueur vers la souris
        if (this.playerMesh) {
            const dx = this.mouse.worldX - this.playerMesh.position.x;
            const dz = this.mouse.worldZ - this.playerMesh.position.z;
            this.player.rotation = Math.atan2(dx, dz);
            this.playerMesh.rotation.y = this.player.rotation;
        }
    }

    update() {
        if (this.gameState.isPaused) return;

        this.handlePlayerMovement();
        this.updateProjectiles();
        this.updateEnemies();
        this.updateHUD();
    }

    handlePlayerMovement() {
        const speed = this.player.speed;
        let moveX = 0;
        let moveZ = 0;

        // ZQSD - déplacement 2D simple (vue du dessus)
        if (this.keys['z'] || this.keys['w']) {
            moveZ -= 1; // Haut de l'écran = Z négatif
        }
        if (this.keys['s']) {
            moveZ += 1; // Bas de l'écran = Z positif
        }
        if (this.keys['d']) {
            moveX -= 1; // Droite
        }
        if (this.keys['q'] || this.keys['a']) {
            moveX += 1; // Gauche
        }

        // Normaliser pour mouvement diagonal
        if (moveX !== 0 || moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX = (moveX / length) * speed;
            moveZ = (moveZ / length) * speed;

            // Calculer nouvelle position
            const newX = this.playerMesh.position.x + moveX;
            const newZ = this.playerMesh.position.z + moveZ;

            // Limites strictes de la zone (murs)
            const limit = 57; // Bien en dessous de 60 pour empêcher de passer

            // Appliquer les limites avec clamping strict
            this.playerMesh.position.x = Math.max(-limit, Math.min(limit, newX));
            this.playerMesh.position.z = Math.max(-limit, Math.min(limit, newZ));
        }
    }

    // Attaque
    startAttack() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.chargeStartTime = Date.now();
    }

    releaseAttack() {
        if (!this.isAttacking) return;

        const now = Date.now();
        const weaponConfig = this.weapons[this.config.weapon];
        const cooldown = weaponConfig.attackSpeed * 1000;

        if (now - this.lastAttackTime < cooldown) {
            this.isAttacking = false;
            return;
        }

        const chargeTime = (now - this.chargeStartTime) / 1000;
        const chargeMultiplier = 1 + Math.min(chargeTime, 1) * (weaponConfig.chargeMultiplier - 1);
        const damage = weaponConfig.damage * this.player.attackPower / 10 * chargeMultiplier;

        if (this.config.weapon === 'bow') {
            this.shootArrow(damage);
        } else {
            this.meleeAttack(weaponConfig, damage);
        }

        this.lastAttackTime = now;
        this.isAttacking = false;
    }

    shootArrow(damage) {
        // Créer un projectile rond très visible
        const arrow = BABYLON.MeshBuilder.CreateSphere("arrow", {
            diameter: 1.2,
            segments: 16
        }, this.scene);

        const mat = new BABYLON.StandardMaterial("arrowMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 1, 0);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
        mat.specularColor = new BABYLON.Color3(1, 1, 1);
        arrow.material = mat;

        arrow.position = this.playerMesh.position.clone();
        arrow.position.y = 0.5;

        // Direction vers la souris
        const dx = this.mouse.worldX - arrow.position.x;
        const dz = this.mouse.worldZ - arrow.position.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const direction = {
            x: dx / length,
            z: dz / length
        };

        this.gameState.projectiles.push({
            mesh: arrow,
            direction: direction,
            speed: 0.8,
            damage: damage,
            lifetime: 5000,
            createdAt: Date.now(),
            isEnemy: false
        });
    }

    meleeAttack(weaponConfig, damage) {
        // Détecter ennemis touchés IMMÉDIATEMENT
        this.dealDamageInCircle(this.playerMesh.position, weaponConfig.range, damage);

        // PUIS créer le cercle d'attaque rouge (juste le contour) pour l'effet visuel
        const radius = weaponConfig.range;

        // Créer les points du cercle
        const points = [];
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new BABYLON.Vector3(
                Math.cos(theta) * radius,
                0,
                Math.sin(theta) * radius
            ));
        }

        // Créer le cercle avec CreateLines (juste le contour)
        const zone = BABYLON.MeshBuilder.CreateLines("attackZone", {
            points: points
        }, this.scene);

        zone.color = new BABYLON.Color3(1, 0, 0); // Rouge vif

        // Positionner le cercle autour du joueur
        zone.position = this.playerMesh.position.clone();
        zone.position.y = 0.2;

        // Supprimer le cercle après 30ms (très très court)
        setTimeout(() => {
            zone.dispose();
        }, 30);
    }

    dealDamageInCircle(center, radius, damage) {
        // Détecter collision avec ennemis dans le cercle
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = this.gameState.enemies[i];
            const dist = BABYLON.Vector3.Distance(
                new BABYLON.Vector3(center.x, 0, center.z),
                new BABYLON.Vector3(enemy.mesh.position.x, 0, enemy.mesh.position.z)
            );

            if (dist <= radius) {
                enemy.health -= damage;

                // Effet visuel de hit
                const originalColor = enemy.mesh.material.diffuseColor.clone();
                enemy.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
                setTimeout(() => {
                    if (enemy.mesh && enemy.mesh.material) {
                        enemy.mesh.material.diffuseColor = originalColor;
                    }
                }, 100);

                if (enemy.health <= 0) {
                    this.killEnemy(i);
                }
            }
        }
    }

    updateProjectiles() {
        const now = Date.now();

        for (let i = this.gameState.projectiles.length - 1; i >= 0; i--) {
            const proj = this.gameState.projectiles[i];

            // Vérifier lifetime
            if (now - proj.createdAt > proj.lifetime) {
                proj.mesh.dispose();
                this.gameState.projectiles.splice(i, 1);
                continue;
            }

            // Déplacer le projectile
            proj.mesh.position.x += proj.direction.x * proj.speed;
            proj.mesh.position.z += proj.direction.z * proj.speed;

            // Vérifier collision avec ennemis (projectiles du joueur)
            if (!proj.isEnemy) {
                for (let j = this.gameState.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.gameState.enemies[j];
                    const dist = BABYLON.Vector3.Distance(proj.mesh.position, enemy.mesh.position);

                    // Distance de collision adaptée à la taille de l'ennemi
                    let collisionDist = 2.0; // Sbires (réduit)
                    if (enemy.type === 'lieutenant') collisionDist = 2.3;
                    if (enemy.type === 'boss') collisionDist = 4.0;

                    if (dist < collisionDist) {
                        enemy.health -= proj.damage;

                        // Effet visuel de hit
                        const originalColor = enemy.mesh.material.diffuseColor.clone();
                        enemy.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
                        setTimeout(() => {
                            if (enemy.mesh && enemy.mesh.material) {
                                enemy.mesh.material.diffuseColor = originalColor;
                            }
                        }, 100);

                        if (enemy.health <= 0) {
                            this.killEnemy(j);
                        }

                        // Supprimer le projectile
                        proj.mesh.dispose();
                        this.gameState.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
            // Vérifier collision avec joueur (projectiles ennemis)
            else {
                const dist = BABYLON.Vector3.Distance(proj.mesh.position, this.playerMesh.position);

                if (dist < 2.0) {
                    this.damagePlayer(proj.damage);

                    // Supprimer le projectile
                    proj.mesh.dispose();
                    this.gameState.projectiles.splice(i, 1);
                }
            }

            // Vérifier limites de la zone
            if (Math.abs(proj.mesh.position.x) > 65 || Math.abs(proj.mesh.position.z) > 65) {
                proj.mesh.dispose();
                this.gameState.projectiles.splice(i, 1);
            }
        }
    }

    updateEnemies() {
        for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = this.gameState.enemies[i];

            // Calculer direction vers le joueur
            const dx = this.playerMesh.position.x - enemy.mesh.position.x;
            const dz = this.playerMesh.position.z - enemy.mesh.position.z;
            const distToPlayer = Math.sqrt(dx * dx + dz * dz);

            // Rotation vers le joueur
            enemy.rotation = Math.atan2(dx, dz);
            enemy.mesh.rotation.y = enemy.rotation;

            // Garder les ennemis dans la zone de jeu
            const limit = 57;
            enemy.mesh.position.x = Math.max(-limit, Math.min(limit, enemy.mesh.position.x));
            enemy.mesh.position.z = Math.max(-limit, Math.min(limit, enemy.mesh.position.z));

            // Comportement selon l'arme - IA AMÉLIORÉE
            if (enemy.weapon === 'bow') {
                // Les archers - IA intelligente avec esquive
                const idealDistance = 10;
                const now = Date.now();

                if (distToPlayer > idealDistance + 2) {
                    // S'approcher avec mouvement latéral
                    const sideMove = Math.sin(now / 500 + enemy.id) * 0.4;
                    enemy.mesh.position.x += (dx / distToPlayer) * enemy.speed * 0.7 + sideMove * (-dz / distToPlayer);
                    enemy.mesh.position.z += (dz / distToPlayer) * enemy.speed * 0.7 + sideMove * (dx / distToPlayer);
                } else if (distToPlayer < idealDistance - 2) {
                    // Reculer en esquivant
                    const sideMove = Math.sin(now / 400 + enemy.id) * 0.5;
                    enemy.mesh.position.x -= (dx / distToPlayer) * enemy.speed * 0.8 + sideMove * (-dz / distToPlayer);
                    enemy.mesh.position.z -= (dz / distToPlayer) * enemy.speed * 0.8 + sideMove * (dx / distToPlayer);
                } else {
                    // À bonne distance - mouvement circulaire autour du joueur
                    const circleSpeed = enemy.speed * 0.6;
                    enemy.mesh.position.x += (-dz / distToPlayer) * circleSpeed;
                    enemy.mesh.position.z += (dx / distToPlayer) * circleSpeed;
                }

                // Tirer plus fréquemment
                if (now - enemy.lastAttackTime > enemy.attackCooldown * 0.8) {
                    this.enemyShootArrow(enemy);
                    enemy.lastAttackTime = now;
                }
            } else {
                // Mêlée - IA agressive avec feintes
                const minDistance = 2.5;
                const attackRange = 4.0;
                const now = Date.now();

                if (distToPlayer > attackRange) {
                    // Charge rapide avec zigzag
                    const zigzag = Math.sin(now / 300 + enemy.id * 3) * 0.4;
                    enemy.mesh.position.x += (dx / distToPlayer) * enemy.speed * 1.2 + zigzag * (-dz / distToPlayer);
                    enemy.mesh.position.z += (dz / distToPlayer) * enemy.speed * 1.2 + zigzag * (dx / distToPlayer);
                } else if (distToPlayer < minDistance) {
                    // Reculer rapidement pour feinter
                    enemy.mesh.position.x -= (dx / distToPlayer) * enemy.speed * 0.5;
                    enemy.mesh.position.z -= (dz / distToPlayer) * enemy.speed * 0.5;
                } else {
                    // Zone d'attaque - tourner autour du joueur
                    const shouldAttack = (now - enemy.lastAttackTime) > enemy.attackCooldown;

                    if (shouldAttack) {
                        // Attaquer et reculer
                        this.enemyMeleeAttack(enemy);
                        enemy.lastAttackTime = now;
                        // Petit recul après attaque
                        enemy.mesh.position.x -= (dx / distToPlayer) * enemy.speed * 0.3;
                        enemy.mesh.position.z -= (dz / distToPlayer) * enemy.speed * 0.3;
                    } else {
                        // Tourner autour en attendant
                        const circleSpeed = enemy.speed * 0.7;
                        enemy.mesh.position.x += (-dz / distToPlayer) * circleSpeed;
                        enemy.mesh.position.z += (dx / distToPlayer) * circleSpeed;
                    }
                }
            }
        }

        // Vérifier si tous les ennemis sont morts
        if (this.gameState.enemies.length === 0 && this.gameState.isPlaying) {
            this.levelComplete();
        }
    }

    enemyShootArrow(enemy) {
        const arrow = BABYLON.MeshBuilder.CreateSphere("enemyArrow", {
            diameter: 1.2,
            segments: 16
        }, this.scene);

        const mat = new BABYLON.StandardMaterial("enemyArrowMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 0.5, 1); // BLEU
        mat.emissiveColor = new BABYLON.Color3(0, 0.5, 1); // BLEU
        mat.specularColor = new BABYLON.Color3(0.5, 0.7, 1);
        arrow.material = mat;

        arrow.position = enemy.mesh.position.clone();
        arrow.position.y = 0.5;

        // Direction vers le joueur
        const dx = this.playerMesh.position.x - arrow.position.x;
        const dz = this.playerMesh.position.z - arrow.position.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const direction = {
            x: dx / length,
            z: dz / length
        };

        this.gameState.projectiles.push({
            mesh: arrow,
            direction: direction,
            speed: 0.5,
            damage: enemy.damage,
            lifetime: 5000,
            createdAt: Date.now(),
            isEnemy: true
        });
    }

    enemyMeleeAttack(enemy) {
        // Dégâts en mêlée (ajusté pour nouvelles tailles)
        const distToPlayer = BABYLON.Vector3.Distance(enemy.mesh.position, this.playerMesh.position);
        if (distToPlayer < 4.0) {
            this.damagePlayer(enemy.damage);
        }
    }

    damagePlayer(damage) {
        // Utiliser d'abord le bouclier
        if (this.player.shield > 0) {
            this.player.shield -= damage;
            if (this.player.shield < 0) {
                this.player.health += this.player.shield; // Le reste en vie
                this.player.shield = 0;
            }
        } else {
            this.player.health -= damage;
        }

        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    killEnemy(index) {
        const enemy = this.gameState.enemies[index];
        if (enemy.mesh) {
            enemy.mesh.dispose();
        }
        this.gameState.enemies.splice(index, 1);
        this.gameState.totalKills++;
    }

    startLevel(level) {
        console.log(`Niveau ${level} démarré`);
        this.config.currentLevel = level;
        this.gameState.enemies = [];

        // Générer ennemis selon le niveau
        this.generateEnemies(level);
    }

    generateEnemies(level) {
        const diff = this.difficultyMultipliers[this.config.difficulty];

        // Nombre d'ennemis selon le niveau (augmenté)
        let minions = Math.floor((8 + level * 4) * diff.enemyCount);
        let lieutenants = Math.floor((2 + level * 2) * diff.enemyCount);
        let bosses = Math.floor((0.5 + level * 0.5) * diff.enemyCount); // Au moins 1 dès le niveau 1

        // Créer les sbires (carrés)
        for (let i = 0; i < minions; i++) {
            this.createEnemy('minion', diff);
        }

        // Créer les lieutenants (losanges)
        for (let i = 0; i < lieutenants; i++) {
            this.createEnemy('lieutenant', diff);
        }

        // Créer le(s) boss (étoile)
        for (let i = 0; i < bosses; i++) {
            this.createEnemy('boss', diff);
        }

        console.log(`Niveau ${level}: ${minions} sbires, ${lieutenants} lieutenants, ${bosses} boss`);
    }

    createEnemy(type, diffMultiplier) {
        const id = Date.now() + Math.random();

        // Configuration selon le type
        let mesh, health, damage, speed, color;

        if (type === 'minion') {
            // CARRÉ pour les sbires - rouge vif (plus petit)
            mesh = BABYLON.MeshBuilder.CreateBox("minion_" + id, {
                width: 2.0,
                height: 0.4,
                depth: 2.0
            }, this.scene);
            health = 30 * diffMultiplier.enemyHealth;
            damage = 5 * diffMultiplier.enemyDamage;
            speed = 0.15; // Plus rapide
            color = new BABYLON.Color3(1, 0, 0); // ROUGE PUR VIF
        } else if (type === 'lieutenant') {
            // LOSANGE pour les lieutenants - orange vif (carré tourné à 45°)
            mesh = BABYLON.MeshBuilder.CreateBox("lieutenant_" + id, {
                width: 2.8,
                height: 0.4,
                depth: 2.8
            }, this.scene);
            mesh.rotation.y = Math.PI / 4; // Rotation de 45° pour faire un losange

            health = 60 * diffMultiplier.enemyHealth;
            damage = 10 * diffMultiplier.enemyDamage;
            speed = 0.12; // Plus rapide
            color = new BABYLON.Color3(1, 0.5, 0); // ORANGE VIF
        } else { // boss
            // ÉTOILE pour le boss - violet/magenta vif
            mesh = this.createStarMesh("boss_" + id);
            health = 150 * diffMultiplier.enemyHealth;
            damage = 20 * diffMultiplier.enemyDamage;
            speed = 0.10; // Plus rapide
            color = new BABYLON.Color3(0.8, 0, 1); // VIOLET/MAGENTA VIF
        }

        // Matériau avec couleurs vives
        const mat = new BABYLON.StandardMaterial("enemyMat_" + id, this.scene);
        mat.diffuseColor = color;
        mat.emissiveColor = color.scale(0.5); // Plus émissif pour mieux voir
        mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

        // Appliquer le matériau (gérer le cas des TransformNode pour les boss)
        if (type === 'boss') {
            // Pour le boss (étoile), appliquer aux enfants
            const children = mesh.getChildMeshes();
            children.forEach(child => {
                if (child.name.includes('_center')) {
                    child.material = mat;
                } else if (child.name.includes('_outline')) {
                    child.color = color;
                }
            });
        } else {
            mesh.material = mat;
        }

        // Position aléatoire (loin du joueur pour éviter l'encerclement)
        const angle = Math.random() * Math.PI * 2;
        const distance = 25 + Math.random() * 25; // Entre 25 et 50 unités du joueur
        mesh.position = new BABYLON.Vector3(
            Math.cos(angle) * distance,
            0.2,
            Math.sin(angle) * distance
        );

        // Arme aléatoire
        const weapons = ['sword', 'spear', 'bow'];
        const weapon = weapons[Math.floor(Math.random() * weapons.length)];

        const enemy = {
            id: id,
            type: type,
            mesh: mesh,
            health: health,
            maxHealth: health,
            damage: damage,
            speed: speed,
            weapon: weapon,
            rotation: 0,
            lastAttackTime: Date.now() - Math.random() * 2000,
            attackCooldown: weapon === 'bow' ? 2000 : 1500
        };

        this.gameState.enemies.push(enemy);
    }

    createStarMesh(name) {
        // Créer une étoile à 5 branches avec CreateLines (contour visible)
        const points = [];
        const branches = 5;
        const outerRadius = 3.5; // Plus petit
        const innerRadius = 1.5;

        // Créer les points de l'étoile
        for (let i = 0; i <= branches * 2; i++) {
            const angle = (i * Math.PI) / branches - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            points.push(new BABYLON.Vector3(
                Math.cos(angle) * radius,
                0.2,
                Math.sin(angle) * radius
            ));
        }

        // Créer le contour de l'étoile
        const starOutline = BABYLON.MeshBuilder.CreateLines(name + "_outline", {
            points: points
        }, this.scene);

        // Créer un cylindre aplati au centre pour donner du volume
        const starCenter = BABYLON.MeshBuilder.CreateCylinder(name + "_center", {
            diameter: outerRadius * 1.5,
            height: 0.4
        }, this.scene);
        starCenter.position.y = 0.2;

        // Grouper les meshes
        const starGroup = new BABYLON.TransformNode(name, this.scene);
        starOutline.parent = starGroup;
        starCenter.parent = starGroup;

        return starGroup;
    }

    applyUpgrade(upgrade) {
        console.log(`Amélioration appliquée: ${upgrade}`);

        if (upgrade === 'health') {
            this.player.maxHealth += 20;
            this.player.health = this.player.maxHealth; // Soigner complètement
        } else if (upgrade === 'shield') {
            this.player.maxShield += 20;
            this.player.shield = this.player.maxShield; // Remplir complètement
        } else if (upgrade === 'attack') {
            this.player.attackPower *= 1.15; // +15%
        }
    }

    nextLevel() {
        document.getElementById('upgradeMenu').classList.add('hidden');
        document.getElementById('gameHUD').classList.remove('hidden');

        this.config.currentLevel++;

        if (this.config.currentLevel > this.config.maxLevel) {
            this.victory();
        } else {
            this.gameState.isPlaying = true;
            this.startLevel(this.config.currentLevel);
        }
    }

    levelComplete() {
        console.log("Niveau terminé!");
        this.gameState.isPlaying = false;

        // Soigner un peu le joueur
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);

        // Afficher le menu d'amélioration
        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('upgradeMenu').classList.remove('hidden');
    }

    gameOver() {
        console.log("Game Over");
        this.gameState.isPlaying = false;

        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.remove('hidden');

        document.getElementById('gameOverLevel').textContent = this.config.currentLevel;
        document.getElementById('gameOverKills').textContent = this.gameState.totalKills;
    }

    victory() {
        console.log("Victoire!");
        this.gameState.isPlaying = false;

        document.getElementById('gameHUD').classList.add('hidden');
        document.getElementById('victoryMenu').classList.remove('hidden');

        const difficultyNames = {
            easy: 'Facile',
            normal: 'Normal',
            hard: 'Difficile',
            hardcore: 'Hardcore',
            impossible: 'Impossible'
        };

        document.getElementById('victoryDifficulty').textContent = difficultyNames[this.config.difficulty];
        document.getElementById('victoryKills').textContent = this.gameState.totalKills;
    }

    restartGame() {
        location.reload();
    }

    updateHUD() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthBar').style.width = healthPercent + '%';
        document.getElementById('healthText').textContent = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        const shieldPercent = (this.player.shield / this.player.maxShield) * 100;
        document.getElementById('shieldBar').style.width = shieldPercent + '%';
        document.getElementById('shieldText').textContent = `${Math.ceil(this.player.shield)}/${this.player.maxShield}`;

        document.getElementById('currentLevel').textContent = this.config.currentLevel;
        document.getElementById('enemyCount').textContent = this.gameState.enemies.length;
    }
}

// Démarrage du jeu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new HuskyDonjonGame2D();
    });
} else {
    window.game = new HuskyDonjonGame2D();
}
