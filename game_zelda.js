// ========================================
// HUSKY ZELDA GAME - Version 3.7 avec Intérieur des Maisons
// ========================================

class ZeldaGame {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Configuration - Haute résolution
        this.tileSize = 48; // Augmenté de 32 à 48 pour plus de détails
        this.viewportTilesX = 20; // Gardé pour bonne vue
        this.viewportTilesY = 15; // Gardé pour bonne vue

        this.canvas.width = this.tileSize * this.viewportTilesX; // 960px
        this.canvas.height = this.tileSize * this.viewportTilesY; // 720px

        // Joueur avec physique réaliste
        this.player = {
            x: 40,
            y: 22,
            velocityX: 0,
            velocityY: 0,
            acceleration: 0.03, // Réduit davantage
            maxSpeed: 0.05, // Réduit davantage
            friction: 0.88,
            momentum: 0.95,
            size: 36, // Taille pour tuile 48px (environ 75% de la tuile)
            isJumping: false,
            jumpHeight: 0,
            jumpSpeed: 0,
            direction: 'down',
            animFrame: 0,
            animTimer: 0,
            health: 12,
            maxHealth: 12,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            gems: 0,
            // Combat
            isAttacking: false,
            attackTimer: 0,
            attackDuration: 20, // Frames d'animation d'attaque
            attackDamage: 2,
            invincible: false,
            invincibleTimer: 0,
            isBlocking: false,
            shieldDurability: 100, // Durabilité du bouclier (0-100)
            shieldMaxDurability: 100,
            shieldBroken: false, // Le bouclier est-il cassé ?
            shieldRegenTimer: 0 // Timer pour régénération
        };

        // Ennemis
        this.enemies = [];

        // Système d'introduction
        this.introActive = true;
        this.introPhase = 0; // 0 = dialogue, 1 = terminé
        this.introDialogueIndex = 0;
        this.introDialogues = [
            "Ah, you're finally awake...",
            "I am the Elder of this village. I knew your father well.",
            "Before he passed away, he entrusted me with something for you.",
            "He told me about a treasure he hid on this island...",
            "This key opens the chest where he kept it.",
            "The chest is located at one of the island's edges.",
            "But be careful... dangerous creatures guard it.",
            "Here, take this key. Your father wanted you to have it.",
            "Good luck, young one. May your father's spirit guide you."
        ];
        this.introTimer = 0;
        this.introKeyReceived = false;

        // Coffre au trésor
        this.treasureChest = null;
        this.treasureFound = false;

        // Caméra
        this.camera = {
            x: 0,
            y: 0,
            smoothing: 0.12
        };

        // Mini-map
        this.showMinimap = false;

        // Page d'aide (touches)
        this.showHelp = false;

        // Contrôles
        this.keys = {};

        // Map
        this.mapWidth = 90;
        this.mapHeight = 60;
        this.map = [];
        this.houses = [];
        this.npcs = [];
        this.boats = [];
        this.portLocation = null; // Sera défini après création des bordures
        this.waterDirection = null; // Direction de l'eau par rapport au port
        this.desertDockLocation = null; // Position du dock sur l'île désertique

        // Système d'îles
        this.currentIsland = 'main'; // 'main' ou 'desert'
        this.savedMainIsland = null; // Pour sauvegarder l'île principale
        this.savedMainPlayer = null; // Position du joueur sur l'île principale
        this.nearBoat = null; // Bateau le plus proche

        // Système de maisons
        this.insideHouse = null; // Maison dans laquelle on se trouve (null si dehors)
        this.houseInterior = null; // Intérieur de la maison actuelle
        this.nearHouse = null; // Maison la plus proche

        // Système de dialogue
        this.nearNPC = null; // PNJ le plus proche pour interaction
        this.currentDialogue = null; // Dialogue en cours d'affichage
        this.dialogueTimer = 0; // Timer pour affichage du dialogue

        // Système d'inventaire et économie
        this.inventory = {};  // Objets généraux
        this.food = {};  // Nourriture/Ressources consommables
        this.money = 100;  // Argent de départ
        this.showInventory = false;  // Afficher ou non l'inventaire
        this.shopMode = false;  // Mode achat activé ou non
        this.currentShop = null;  // Boutique actuelle

        // Système d'armes
        this.weapons = {};  // Armes possédées: {nom: {icon: X}}
        this.equippedWeapon = null;  // Arme équipée actuellement

        // Système de niveau
        this.levelUpChoice = false;  // Afficher le choix de récompense
        this.levelUpOptions = ['heart', 'gems'];  // Choix disponibles

        // Système de potions et effets actifs
        this.activeEffects = {
            speed: { active: false, duration: 0, maxDuration: 600 }, // 10 secondes (60 fps * 10)
            invisibility: { active: false, duration: 0, maxDuration: 480 }, // 8 secondes
            strength: { active: false, duration: 0, maxDuration: 600, bonus: 1.5 }, // +50% de force
            invincibility: { active: false, hitsRemaining: 0, maxHits: 2 } // 2 coups
        };

        this.createMap();
        this.createNPCs();
        this.createBoats();
        this.createEnemies();
        this.createTreasureChest();
        this.init();
    }

    init() {
        this.setupControls();
        this.startIntro();
        this.startGameLoop();
    }

    startIntro() {
        // Trouver la maison du joueur
        const playerHouse = this.houses.find(h => h.type === 'player');
        if (playerHouse) {
            // Sauvegarder l'état extérieur (comme enterHouse le fait)
            this.savedOutdoorState = {
                map: JSON.parse(JSON.stringify(this.map)),
                npcs: JSON.parse(JSON.stringify(this.npcs)),
                mapWidth: this.mapWidth,
                mapHeight: this.mapHeight
            };
            this.savedOutdoorPosition = {
                x: playerHouse.x + 1,
                y: playerHouse.y + 3
            };

            // Entrer dans la maison du joueur pour l'intro
            this.insideHouse = playerHouse;
            this.createHouseInterior('player');

            // Positionner le joueur dans la maison
            this.player.x = 9;
            this.player.y = 10;

            // Ajouter l'ancien pour l'intro (il sera près de l'entrée)
            this.introElder = {
                x: 9,
                y: 6,
                type: 'elder',
                direction: 'down',
                animFrame: 0,
                animTimer: 0
            };
        }
    }

    createTreasureChest() {
        // Placer le coffre au trésor sur une extrémité de l'île (nord-est)
        // Chercher une position valide près du bord
        let chestX = this.mapWidth - 12;
        let chestY = 8;

        // Vérifier que c'est une position valide (pas dans l'eau)
        while (this.map[chestY] && this.map[chestY][chestX] === 4) {
            chestX--;
            if (chestX < this.mapWidth - 20) {
                chestY++;
                chestX = this.mapWidth - 12;
            }
        }

        this.treasureChest = {
            x: chestX,
            y: chestY,
            opened: false
        };

        // Ajouter des ennemis puissants autour du coffre
        const guardPositions = [
            { x: chestX - 3, y: chestY },
            { x: chestX + 3, y: chestY },
            { x: chestX, y: chestY - 3 },
            { x: chestX, y: chestY + 3 },
            { x: chestX - 2, y: chestY - 2 },
            { x: chestX + 2, y: chestY + 2 }
        ];

        guardPositions.forEach(pos => {
            this.enemies.push({
                x: pos.x,
                y: pos.y,
                type: 'goblin', // Goblins plus forts
                health: 8,
                maxHealth: 8,
                damage: 3,
                speed: 0.025,
                direction: 'down',
                animFrame: 0,
                animTimer: 0,
                moveTimer: Math.random() * 60,
                aggroRange: 5,
                isAggro: false,
                knockbackX: 0,
                knockbackY: 0,
                xpReward: 40
            });
        });
    }

    advanceIntro() {
        this.introDialogueIndex++;

        if (this.introDialogueIndex >= this.introDialogues.length) {
            // Fin de l'intro
            this.introActive = false;
            this.introElder = null;

            // Donner la clef au joueur
            this.inventory['Treasure Key'] = 1;
            this.currentDialogue = '🔑 You received the Treasure Key!';
            this.dialogueTimer = 0;
        }
    }

    createMap() {
        this.map = [];

        // Initialiser avec herbe
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = 0;
            }
        }

        // Bordures organiques
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                const leftBorder = 3 + Math.sin(y * 0.25) * 2.5;
                if (x < leftBorder) {
                    this.map[y][x] = 4;
                }

                const rightBorder = this.mapWidth - 3 - Math.sin(y * 0.2) * 2.5;
                if (x > rightBorder) {
                    this.map[y][x] = 4;
                }

                const topBorder = 3 + Math.cos(x * 0.25) * 2.5;
                if (y < topBorder) {
                    this.map[y][x] = 4;
                }

                const bottomBorder = this.mapHeight - 3 - Math.cos(x * 0.2) * 2.5;
                if (y > bottomBorder) {
                    this.map[y][x] = 4;
                }
            }
        }

        // Placer les maisons 3x3 avec types - Disposition organique avec bon espacement
        this.houses = [];
        const housePositions = [
            // Zone Nord-Ouest (résidentiel)
            { x: 15, y: 10, type: 'player' },       // Maison du joueur
            { x: 25, y: 12, type: 'villager1' },    // Villageois 1

            // Zone Nord-Est
            { x: 55, y: 10, type: 'villager2' },    // Villageois 2
            { x: 68, y: 14, type: 'farmer' },       // Fermier

            // Zone Est (commercial)
            { x: 75, y: 25, type: 'merchant' },     // Marchand
            { x: 70, y: 35, type: 'fisher' },       // Poissonnier

            // Zone Sud-Est
            { x: 60, y: 46, type: 'doctor' },       // Médecin
            { x: 48, y: 48, type: 'elder' },        // Ancien

            // Zone Sud-Ouest
            { x: 20, y: 48, type: 'blacksmith' },   // Forgeron
            { x: 12, y: 40, type: 'villager3' },    // Villageois 3

            // Église à l'Ouest de la place
            { x: 30, y: 28, type: 'church' }        // Église
        ];

        housePositions.forEach(pos => this.addHouse(pos.x, pos.y, pos.type));

        // Créer les champs du fermier
        this.createFarmerFields();

        // Créer la place centrale et les chemins
        this.createCentralPlaza();
        this.createPathsFromPlaza();

        // Créer le port avec docks
        this.createPort();

        // Arbres
        for (let i = 0; i < 80; i++) {
            const x = Math.floor(Math.random() * (this.mapWidth - 10)) + 5;
            const y = Math.floor(Math.random() * (this.mapHeight - 10)) + 5;

            if (this.map[y][x] === 0 &&
                Math.abs(x - this.player.x) > 5 &&
                Math.abs(y - this.player.y) > 5 &&
                Math.abs(x - this.portLocation.x) > 8 &&
                Math.abs(y - this.portLocation.y) > 8) {
                this.map[y][x] = 2;
            }
        }

        // Fleurs
        for (let i = 0; i < 120; i++) {
            const x = Math.floor(Math.random() * (this.mapWidth - 10)) + 5;
            const y = Math.floor(Math.random() * (this.mapHeight - 10)) + 5;

            if (this.map[y][x] === 0) {
                this.map[y][x] = 5;
            }
        }

        // Rochers
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * (this.mapWidth - 10)) + 5;
            const y = Math.floor(Math.random() * (this.mapHeight - 10)) + 5;

            if (this.map[y][x] === 0) {
                this.map[y][x] = 6;
            }
        }
    }

    createPort() {
        // Trouver un bon emplacement au bord de l'eau
        let portX = 0;
        let portY = 0;

        // Chercher sur le côté droit (eau à l'est) - zone élargie
        for (let y = 15; y < this.mapHeight - 5; y++) {
            for (let x = this.mapWidth - 15; x < this.mapWidth - 5; x++) {
                // Vérifier si c'est de l'herbe avec de l'eau à l'est
                if (x + 1 < this.mapWidth && this.map[y][x] === 0 && this.map[y][x + 1] === 4) {
                    // Vérifier qu'il n'y a pas de maison trop proche
                    let tooClose = false;
                    for (let house of this.houses) {
                        const dist = Math.sqrt((x - house.x) ** 2 + (y - house.y) ** 2);
                        if (dist < 8) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (!tooClose) {
                        portX = x;
                        portY = y;
                        this.waterDirection = 'east';
                        break;
                    }
                }
            }
            if (portX !== 0) break;
        }

        // Si pas trouvé, essayer en bas (eau au sud) - zone élargie
        if (portX === 0) {
            for (let x = 15; x < this.mapWidth - 15; x++) {
                for (let y = this.mapHeight - 15; y < this.mapHeight - 5; y++) {
                    if (y + 1 < this.mapHeight && this.map[y][x] === 0 && this.map[y + 1][x] === 4) {
                        // Vérifier qu'il n'y a pas de maison trop proche
                        let tooClose = false;
                        for (let house of this.houses) {
                            const dist = Math.sqrt((x - house.x) ** 2 + (y - house.y) ** 2);
                            if (dist < 8) {
                                tooClose = true;
                                break;
                            }
                        }
                        if (!tooClose) {
                            portX = x;
                            portY = y;
                            this.waterDirection = 'south';
                            break;
                        }
                    }
                }
                if (portX !== 0) break;
            }
        }

        // Vérifier qu'un emplacement a été trouvé
        if (portX === 0) {
            console.log("ERREUR: Aucun emplacement trouvé pour le port!");
            this.portLocation = null;
            this.waterDirection = null;
            return;
        }

        this.portLocation = { x: portX, y: portY };
        console.log("Port créé à:", portX, portY, "direction eau:", this.waterDirection);

        // Créer les docks selon l'orientation de l'eau
        if (this.waterDirection === 'east') {
            // Eau à l'est: dock principal vertical sur la terre
            for (let y = portY - 3; y <= portY + 3; y++) {
                for (let x = portX - 1; x <= portX; x++) {
                    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                        if (this.map[y][x] !== 4) {
                            this.map[y][x] = 7; // Dock
                        }
                    }
                }
            }

            // Quais horizontaux qui s'étendent dans l'eau vers l'est
            for (let i = 0; i < 3; i++) {
                const dockY = portY - 2 + i * 2;
                for (let x = portX + 1; x <= portX + 3; x++) {
                    if (x >= 0 && x < this.mapWidth && dockY >= 0 && dockY < this.mapHeight) {
                        this.map[dockY][x] = 7;
                    }
                }
            }
        } else {
            // Eau au sud: dock principal horizontal sur la terre
            for (let x = portX - 3; x <= portX + 3; x++) {
                for (let y = portY - 1; y <= portY; y++) {
                    if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                        if (this.map[y][x] !== 4) {
                            this.map[y][x] = 7; // Dock
                        }
                    }
                }
            }

            // Quais verticaux qui s'étendent dans l'eau vers le sud
            for (let i = 0; i < 3; i++) {
                const dockX = portX - 2 + i * 2;
                for (let y = portY + 1; y <= portY + 3; y++) {
                    if (dockX >= 0 && dockX < this.mapWidth && y >= 0 && y < this.mapHeight) {
                        this.map[y][dockX] = 7;
                    }
                }
            }
        }

        // Chemin du spawn au port
        this.createPath(this.player.x, this.player.y, portX, portY - 3);
    }

    createNPCs() {
        // Types de villageois génériques
        const npcTypes = ['man', 'woman', 'child', 'assistant'];

        // Placer des PNJ sur la map, ÉLOIGNÉS des maisons
        const numNPCs = 12; // Nombre de PNJ à créer
        for (let i = 0; i < numNPCs; i++) {
            let x, y;
            let validPosition = false;
            let attempts = 0;

            // Chercher une position valide loin des maisons
            while (!validPosition && attempts < 100) {
                x = Math.random() * (this.mapWidth - 10) + 5;
                y = Math.random() * (this.mapHeight - 10) + 5;

                // Vérifier que la position est loin des maisons (au moins 6 tuiles)
                validPosition = true;
                for (let house of this.houses) {
                    const distX = Math.abs(x - (house.x + 1.5));
                    const distY = Math.abs(y - (house.y + 1.5));
                    if (distX < 6 && distY < 6) {
                        validPosition = false;
                        break;
                    }
                }

                // Vérifier que c'est sur de l'herbe ou un chemin (pas d'eau, pas de roche)
                if (validPosition) {
                    const tileType = this.map[Math.floor(y)]?.[Math.floor(x)];
                    if (tileType === 'water' || tileType === 'rock' || tileType === 'tree' ||
                        tileType === 'house' || tileType === 'dock') {
                        validPosition = false;
                    }
                }

                attempts++;
            }

            if (validPosition) {
                const type = npcTypes[i % npcTypes.length];
                this.npcs.push({
                    x: x,
                    y: y,
                    type: type,
                    direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: Math.floor(Math.random() * 60),
                    idleTime: Math.random() * 100 + 50
                });
            }
        }
    }

    createBoats() {
        // Vérifier que le port existe
        if (!this.portLocation || !this.waterDirection) {
            console.log("Port non trouvé, pas de bateaux créés");
            return;
        }

        const portX = this.portLocation.x;
        const portY = this.portLocation.y;

        console.log("Création bateaux au port:", portX, portY, "direction:", this.waterDirection);

        // Créer 3 bateaux amarrés DANS L'EAU selon l'orientation
        if (this.waterDirection === 'east') {
            // Bateaux à l'est du port
            this.boats.push(
                {
                    x: portX + 4,
                    y: portY - 2,
                    type: 'fishing',
                    color: '#8B4513',
                    bobTimer: 0
                },
                {
                    x: portX + 4.5,
                    y: portY,
                    type: 'small',
                    color: '#A0522D',
                    bobTimer: 30
                },
                {
                    x: portX + 4,
                    y: portY + 2,
                    type: 'fishing',
                    color: '#654321',
                    bobTimer: 60
                }
            );
        } else {
            // Bateaux au sud du port
            this.boats.push(
                {
                    x: portX - 2,
                    y: portY + 4,
                    type: 'fishing',
                    color: '#8B4513',
                    bobTimer: 0
                },
                {
                    x: portX,
                    y: portY + 4.5,
                    type: 'small',
                    color: '#A0522D',
                    bobTimer: 30
                },
                {
                    x: portX + 2,
                    y: portY + 4,
                    type: 'fishing',
                    color: '#654321',
                    bobTimer: 60
                }
            );
        }
    }

    createEnemies() {
        // Créer des slimes sur la map (ennemis de base)
        const numEnemies = 15;

        for (let i = 0; i < numEnemies; i++) {
            let x, y;
            let validPosition = false;
            let attempts = 0;

            while (!validPosition && attempts < 100) {
                x = Math.random() * (this.mapWidth - 20) + 10;
                y = Math.random() * (this.mapHeight - 20) + 10;

                // Vérifier distance des maisons
                validPosition = true;
                for (let house of this.houses) {
                    const distX = Math.abs(x - (house.x + 1.5));
                    const distY = Math.abs(y - (house.y + 1.5));
                    if (distX < 10 && distY < 10) {
                        validPosition = false;
                        break;
                    }
                }

                // Vérifier le type de terrain
                if (validPosition) {
                    const tileType = this.map[Math.floor(y)]?.[Math.floor(x)];
                    if (tileType === 4 || tileType === 3 || tileType === 5) { // eau, maison, dock
                        validPosition = false;
                    }
                }

                // Éloigner du spawn du joueur
                if (validPosition) {
                    const distFromSpawn = Math.sqrt(Math.pow(x - 40, 2) + Math.pow(y - 22, 2));
                    if (distFromSpawn < 15) {
                        validPosition = false;
                    }
                }

                attempts++;
            }

            if (validPosition) {
                const enemyTypes = ['slime', 'goblin'];
                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

                this.enemies.push({
                    x: x,
                    y: y,
                    type: type,
                    health: type === 'slime' ? 3 : 5,
                    maxHealth: type === 'slime' ? 3 : 5,
                    damage: type === 'slime' ? 1 : 2,
                    speed: type === 'slime' ? 0.015 : 0.02,
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: Math.random() * 60,
                    aggroRange: type === 'slime' ? 4 : 6,
                    isAggro: false,
                    knockbackX: 0,
                    knockbackY: 0,
                    xpReward: type === 'slime' ? 15 : 25
                });
            }
        }
    }

    addHouse(centerX, centerY, type = 'villager') {
        const house = {
            x: centerX,
            y: centerY,
            width: 3,
            height: 3,
            type: type,
            doorX: centerX,      // Porte au centre en bas
            doorY: centerY + 1
        };

        this.houses.push(house);

        for (let y = 0; y < house.height; y++) {
            for (let x = 0; x < house.width; x++) {
                const mapX = centerX + x - 1;
                const mapY = centerY + y - 1;

                if (mapX >= 0 && mapX < this.mapWidth && mapY >= 0 && mapY < this.mapHeight) {
                    this.map[mapY][mapX] = 3;
                }
            }
        }
    }

    createFarmerFields() {
        // Trouver la maison du fermier
        const farmerHouse = this.houses.find(h => h.type === 'farmer');
        if (!farmerHouse) return;

        // Position de la maison du fermier: x: 68, y: 14
        const fx = farmerHouse.x;
        const fy = farmerHouse.y;

        // Créer un rectangle de champs à droite de la maison (8x6 tuiles)
        for (let y = fy - 2; y < fy + 4; y++) {
            for (let x = fx + 3; x < fx + 11; x++) {
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    // Alterner entre tomates, carottes et terre
                    const pattern = (x + y) % 3;
                    if (pattern === 0) {
                        this.map[y][x] = 32; // Tomates
                    } else if (pattern === 1) {
                        this.map[y][x] = 33; // Carottes
                    } else {
                        this.map[y][x] = 34; // Terre labourée
                    }
                }
            }
        }
    }

    createCentralPlaza() {
        // Vraie place centrale carrée au milieu de l'île
        const plazaCenterX = 45;
        const plazaCenterY = 30;
        const plazaSize = 12; // Taille de la place (12x12)

        // Stocker la position pour les chemins
        this.plazaCenter = { x: plazaCenterX, y: plazaCenterY };

        // Créer un carré de pavés bien défini
        for (let y = plazaCenterY - plazaSize/2; y <= plazaCenterY + plazaSize/2; y++) {
            for (let x = plazaCenterX - plazaSize/2; x <= plazaCenterX + plazaSize/2; x++) {
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    const tile = this.map[y][x];
                    // Ne pas écraser les maisons ou l'eau
                    if (tile !== 3 && tile !== 4) {
                        this.map[y][x] = 30; // Pavés
                    }
                }
            }
        }

        // UNE SEULE grosse fontaine au centre (juste une tuile, elle dessinera déjà toute la fontaine)
        this.map[plazaCenterY][plazaCenterX] = 28;

        // 4 bancs aux coins de la fontaine
        this.map[plazaCenterY - 3][plazaCenterX - 3] = 29;
        this.map[plazaCenterY - 3][plazaCenterX + 3] = 29;
        this.map[plazaCenterY + 3][plazaCenterX - 3] = 29;
        this.map[plazaCenterY + 3][plazaCenterX + 3] = 29;

        // 4 lampadaires aux coins de la place
        this.map[plazaCenterY - 5][plazaCenterX - 5] = 31;
        this.map[plazaCenterY - 5][plazaCenterX + 5] = 31;
        this.map[plazaCenterY + 5][plazaCenterX - 5] = 31;
        this.map[plazaCenterY + 5][plazaCenterX + 5] = 31;
    }

    createPathsFromPlaza() {
        // Créer des chemins en 2 tuiles qui relient toutes les maisons à la place centrale
        // et entre elles de manière logique

        const plaza = this.plazaCenter;

        // Chemins depuis la place vers chaque maison/zone
        // Zone Nord-Ouest (Player, Villageois1)
        this.createPath(plaza.x, plaza.y, 15, 10);  // Place -> Maison du joueur
        this.createPath(plaza.x, plaza.y, 25, 12);  // Place -> Villageois1

        // Zone Nord-Est (Villageois2, Fermier)
        this.createPath(plaza.x, plaza.y, 55, 10);  // Place -> Villageois2
        this.createPath(plaza.x, plaza.y, 68, 14);  // Place -> Fermier

        // Zone Est (Marchand, Poissonnier)
        this.createPath(plaza.x, plaza.y, 75, 25);  // Place -> Marchand
        this.createPath(plaza.x, plaza.y, 70, 35);  // Place -> Poissonnier

        // Zone Sud-Est (Médecin, Ancien)
        this.createPath(plaza.x, plaza.y, 60, 46);  // Place -> Médecin
        this.createPath(plaza.x, plaza.y, 48, 48);  // Place -> Ancien

        // Zone Sud-Ouest (Forgeron, Villageois3)
        this.createPath(plaza.x, plaza.y, 20, 48);  // Place -> Forgeron
        this.createPath(plaza.x, plaza.y, 12, 40);  // Place -> Villageois3

        // Église à l'Ouest
        this.createPath(plaza.x, plaza.y, 30, 28);  // Place -> Église

        // Chemin du spawn vers la place
        this.createPath(this.player.x, this.player.y, plaza.x, plaza.y);

        // Chemins de connexion entre maisons proches (pour un réseau cohérent)
        // Nord
        this.createPath(15, 10, 25, 12);   // Player <-> Villageois1
        this.createPath(55, 10, 68, 14);   // Villageois2 <-> Fermier

        // Est
        this.createPath(75, 25, 70, 35);   // Marchand <-> Poissonnier

        // Sud
        this.createPath(60, 46, 48, 48);   // Médecin <-> Ancien
        this.createPath(20, 48, 12, 40);   // Forgeron <-> Villageois3
    }

    createPath(x1, y1, x2, y2) {
        let currentX = Math.floor(x1);
        let currentY = Math.floor(y1);
        const targetX = Math.floor(x2);
        const targetY = Math.floor(y2);
        let lastDirection = null;

        while (currentX !== targetX || currentY !== targetY) {
            // Placer la tuile principale
            this.placePath(currentX, currentY);

            const distX = targetX - currentX;
            const distY = targetY - currentY;

            let moveDirection = null;

            // Déterminer la direction du mouvement
            if (Math.abs(distX) > Math.abs(distY)) {
                currentX += distX > 0 ? 1 : -1;
                moveDirection = 'horizontal';
            } else if (Math.abs(distY) > Math.abs(distX)) {
                currentY += distY > 0 ? 1 : -1;
                moveDirection = 'vertical';
            } else {
                if (Math.random() > 0.5) {
                    currentX += distX > 0 ? 1 : -1;
                    moveDirection = 'horizontal';
                } else {
                    currentY += distY > 0 ? 1 : -1;
                    moveDirection = 'vertical';
                }
            }

            // Ajouter UNE tuile adjacente pour faire 2 de large
            // Si on se déplace horizontalement, ajouter une tuile en dessous
            // Si on se déplace verticalement, ajouter une tuile à droite
            if (moveDirection === 'horizontal') {
                this.placePath(currentX, currentY + 1);
            } else if (moveDirection === 'vertical') {
                this.placePath(currentX + 1, currentY);
            }

            lastDirection = moveDirection;
        }

        // Position finale
        this.placePath(currentX, currentY);
        if (lastDirection === 'horizontal') {
            this.placePath(currentX, currentY + 1);
        } else {
            this.placePath(currentX + 1, currentY);
        }
    }

    placePath(x, y) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            const tile = this.map[y][x];
            // Ne pas écraser maisons, eau, docks, fontaines, bancs, lampadaires, pavés
            if (tile !== 3 && tile !== 4 && tile !== 7 &&
                tile !== 28 && tile !== 29 && tile !== 30 && tile !== 31) {
                this.map[y][x] = 1; // Chemin
            }
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            if (e.key === ' ' && !this.player.isJumping) {
                this.player.isJumping = true;
                this.player.jumpSpeed = 0.35;
                e.preventDefault();
            }

            if (key === 'm') {
                this.showMinimap = !this.showMinimap;
            }

            if (key === 'p') {
                this.showHelp = !this.showHelp;
            }

            if (key === 'tab') {
                this.showInventory = !this.showInventory;
                e.preventDefault(); // Empêcher le comportement par défaut du TAB
            }

            if (key === 'e') {
                // Gérer l'intro
                if (this.introActive) {
                    this.advanceIntro();
                } else {
                    this.handleInteraction();
                }
            }

            // Attaque avec F (si on a une épée)
            if (key === 'f' && !this.player.isAttacking && this.weapons['Rusty Sword']) {
                this.player.isAttacking = true;
                this.player.attackTimer = this.player.attackDuration;
                this.performAttack();
            }

            // Bouclier avec R (si on a un bouclier)
            if (key === 'r' && this.weapons['Rusty Shield']) {
                this.player.isBlocking = true;
            }

            // Touches pour acheter dans la boutique
            if (this.shopMode && this.currentShop) {
                const itemIndex = parseInt(key) - 1;
                if (itemIndex >= 0 && itemIndex < this.currentShop.items.length) {
                    const item = this.currentShop.items[itemIndex];
                    if (this.money >= item.price) {
                        // Acheter l'item
                        this.money -= item.price;

                        // Si c'est une arme (forgeron)
                        if (this.currentShop.type === 'blacksmith') {
                            if (!this.weapons[item.name]) {
                                // Nouvelle arme
                                this.weapons[item.name] = {
                                    icon: item.icon
                                };
                                this.currentDialogue = `You purchased: ${item.icon} ${item.name}!`;
                            } else {
                                this.currentDialogue = `You already have a ${item.name}!`;
                            }
                        } else if (this.currentShop.type === 'farmer' || this.currentShop.type === 'doctor' || this.currentShop.type === 'fisher') {
                            // Nourriture (fermier, poissonnier) et objets médicaux (médecin)
                            if (this.food[item.name]) {
                                this.food[item.name]++;
                            } else {
                                this.food[item.name] = 1;
                            }
                            this.currentDialogue = `You purchased: ${item.icon} ${item.name}!`;
                        } else if (this.currentShop.type === 'merchant') {
                            // Potions (marchand) - vont dans objets
                            if (this.inventory[item.name]) {
                                this.inventory[item.name]++;
                            } else {
                                this.inventory[item.name] = 1;
                            }
                            this.currentDialogue = `Vous avez acheté: ${item.icon} ${item.name} !`;
                        } else {
                            // Objets généraux (autres boutiques)
                            if (this.inventory[item.name]) {
                                this.inventory[item.name]++;
                            } else {
                                this.inventory[item.name] = 1;
                            }
                            this.currentDialogue = `You purchased: ${item.name}!`;
                        }
                        this.dialogueTimer = 0;
                    } else {
                        // Pas assez d'argent
                        this.currentDialogue = 'Not enough money!';
                        this.dialogueTimer = 0;
                    }
                }
            }

            // Touches pour consommer nourriture/objets dans l'inventaire
            if (this.showInventory && !this.shopMode) {
                const itemIndex = parseInt(key) - 1;

                // Combiner nourriture et objets consommables (potions)
                const foodItems = Object.entries(this.food);
                const objectItems = Object.entries(this.inventory).filter(([name, qty]) => {
                    // Seulement les potions sont consommables
                    return name.includes('Potion');
                });
                const allConsumables = [...foodItems, ...objectItems];

                if (itemIndex >= 0 && itemIndex < allConsumables.length) {
                    const [itemName, quantity] = allConsumables[itemIndex];
                    this.consumeItem(itemName);
                }
            }

            // Touches pour choisir la récompense de level up
            if (this.levelUpChoice) {
                if (key === '1') {
                    this.chooseLevelUpReward('heart');
                } else if (key === '2') {
                    this.chooseLevelUpReward('gems');
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;

            // Arrêter de bloquer quand on relâche R
            if (key === 'r') {
                this.player.isBlocking = false;
            }
        });
    }

    update() {
        this.handlePlayerMovement();
        this.handleJump();
        this.updateCamera();
        this.updatePlayerAnimation();
        this.updateNPCs();
        this.updateBoats();
        this.updateEnemies();
        this.updateCombat();
        this.checkNearBoat();
        this.checkNearHouse();
        this.checkNearNPC();
        this.updatePotionEffects();

        // Mettre à jour le timer de dialogue
        if (this.currentDialogue) {
            this.dialogueTimer++;
            if (this.dialogueTimer > 300) { // 5 secondes
                this.currentDialogue = null;
                this.dialogueTimer = 0;
            }
        }
    }

    updateNPCs() {
        this.npcs.forEach(npc => {
            npc.moveTimer++;

            // Changer de direction toutes les 120 frames (environ 2 secondes)
            if (npc.moveTimer % 120 === 0) {
                if (Math.random() > 0.3) {
                    const directions = ['up', 'down', 'left', 'right'];
                    npc.direction = directions[Math.floor(Math.random() * directions.length)];
                } else {
                    npc.direction = 'idle';
                }
            }

            // Se déplacer lentement et régulièrement
            if (npc.direction !== 'idle') {
                npc.animTimer++;

                // Animation de marche
                if (npc.animTimer > 20) {
                    npc.animFrame = (npc.animFrame + 1) % 2;
                    npc.animTimer = 0;
                }

                const moveSpeed = 0.01; // Plus lent et plus régulier
                let newX = npc.x;
                let newY = npc.y;

                if (npc.direction === 'up') newY -= moveSpeed;
                if (npc.direction === 'down') newY += moveSpeed;
                if (npc.direction === 'left') newX -= moveSpeed;
                if (npc.direction === 'right') newX += moveSpeed;

                // Vérifier collision avec fonction spéciale pour NPCs
                if (this.canNPCWalkOn(newX, newY)) {
                    npc.x = newX;
                    npc.y = newY;
                } else {
                    // Si bloqué, changer de direction immédiatement
                    const directions = ['up', 'down', 'left', 'right'];
                    npc.direction = directions[Math.floor(Math.random() * directions.length)];
                }
            } else {
                // Reset animation quand idle
                npc.animFrame = 0;
                npc.animTimer = 0;
            }
        });
    }

    updateBoats() {
        this.boats.forEach(boat => {
            boat.bobTimer++;
        });
    }

    updateEnemies() {
        // Ne pas mettre à jour les ennemis si on est dans une maison
        if (this.insideHouse) return;

        this.enemies.forEach(enemy => {
            // Animation
            enemy.animTimer++;
            if (enemy.animTimer > 15) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
                enemy.animTimer = 0;
            }

            // Appliquer knockback
            if (enemy.knockbackX !== 0 || enemy.knockbackY !== 0) {
                enemy.x += enemy.knockbackX;
                enemy.y += enemy.knockbackY;
                enemy.knockbackX *= 0.8;
                enemy.knockbackY *= 0.8;
                if (Math.abs(enemy.knockbackX) < 0.01) enemy.knockbackX = 0;
                if (Math.abs(enemy.knockbackY) < 0.01) enemy.knockbackY = 0;
                return;
            }

            // Calculer distance au joueur
            const distX = this.player.x - enemy.x;
            const distY = this.player.y - enemy.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // Aggro si le joueur est proche
            if (distance < enemy.aggroRange) {
                enemy.isAggro = true;
            } else if (distance > enemy.aggroRange * 2) {
                enemy.isAggro = false;
            }

            // Mouvement
            enemy.moveTimer++;

            if (enemy.isAggro && distance > 0.8) {
                // Poursuivre le joueur
                const dirX = distX / distance;
                const dirY = distY / distance;

                enemy.x += dirX * enemy.speed;
                enemy.y += dirY * enemy.speed;

                // Direction pour l'animation
                if (Math.abs(dirX) > Math.abs(dirY)) {
                    enemy.direction = dirX > 0 ? 'right' : 'left';
                } else {
                    enemy.direction = dirY > 0 ? 'down' : 'up';
                }
            } else if (enemy.moveTimer % 90 === 0 && !enemy.isAggro) {
                // Mouvement aléatoire si pas en aggro
                const directions = ['up', 'down', 'left', 'right'];
                enemy.direction = directions[Math.floor(Math.random() * 4)];
            }

            // Petit mouvement aléatoire
            if (!enemy.isAggro && Math.random() < 0.02) {
                switch (enemy.direction) {
                    case 'up': enemy.y -= enemy.speed * 0.5; break;
                    case 'down': enemy.y += enemy.speed * 0.5; break;
                    case 'left': enemy.x -= enemy.speed * 0.5; break;
                    case 'right': enemy.x += enemy.speed * 0.5; break;
                }
            }

            // Limites de la map
            enemy.x = Math.max(5, Math.min(this.mapWidth - 5, enemy.x));
            enemy.y = Math.max(5, Math.min(this.mapHeight - 5, enemy.y));
        });
    }

    updateCombat() {
        // Timer d'attaque du joueur
        if (this.player.isAttacking) {
            this.player.attackTimer--;
            if (this.player.attackTimer <= 0) {
                this.player.isAttacking = false;
            }
        }

        // Timer d'invincibilité du joueur
        if (this.player.invincible) {
            this.player.invincibleTimer--;
            if (this.player.invincibleTimer <= 0) {
                this.player.invincible = false;
            }
        }

        // Régénération du bouclier quand on ne bloque pas
        if (!this.player.isBlocking && this.player.shieldDurability < this.player.shieldMaxDurability) {
            this.player.shieldRegenTimer++;
            if (this.player.shieldRegenTimer > 60) { // 1 seconde avant de régénérer
                this.player.shieldDurability = Math.min(
                    this.player.shieldMaxDurability,
                    this.player.shieldDurability + 0.5
                );
                // Le bouclier se répare quand il atteint 30%
                if (this.player.shieldBroken && this.player.shieldDurability > 30) {
                    this.player.shieldBroken = false;
                    this.currentDialogue = '🛡️ Shield repaired!';
                    this.dialogueTimer = 0;
                }
            }
        } else {
            this.player.shieldRegenTimer = 0;
        }

        // Collision joueur-ennemi (dégâts au joueur)
        if (!this.player.invincible && !this.insideHouse) {
            this.enemies.forEach(enemy => {
                const distX = this.player.x - enemy.x;
                const distY = this.player.y - enemy.y;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance < 0.8) {
                    // Vérifier si le joueur bloque avec le bouclier (et qu'il n'est pas cassé)
                    if (this.player.isBlocking && this.weapons['Rusty Shield'] && !this.player.shieldBroken) {
                        // Réduire la durabilité du bouclier
                        const damageToShield = enemy.damage * 20; // Chaque point de dégât = 20 durabilité
                        this.player.shieldDurability -= damageToShield;

                        if (this.player.shieldDurability <= 0) {
                            // Le bouclier se brise !
                            this.player.shieldDurability = 0;
                            this.player.shieldBroken = true;
                            this.player.invincible = true;
                            this.player.invincibleTimer = 30;

                            // Le joueur prend quand même des dégâts réduits
                            this.player.health -= Math.ceil(enemy.damage / 2);

                            this.currentDialogue = '💥 Shield broken! -' + Math.ceil(enemy.damage / 2) + ' ❤️';
                            this.dialogueTimer = 0;
                        } else {
                            // Bouclier tient le coup
                            this.player.invincible = true;
                            this.player.invincibleTimer = 20;

                            this.currentDialogue = `🛡️ Blocked! (${Math.floor(this.player.shieldDurability)}%)`;
                            this.dialogueTimer = 0;
                        }
                    } else {
                        // Pas de bouclier ou bouclier cassé : le joueur prend des dégâts
                        this.player.health -= enemy.damage;
                        this.player.invincible = true;
                        this.player.invincibleTimer = 60; // 1 seconde d'invincibilité

                        // Knockback du joueur
                        if (distance > 0) {
                            this.player.velocityX = (distX / distance) * 0.3;
                            this.player.velocityY = (distY / distance) * 0.3;
                        }

                        // Message de dégâts
                        this.currentDialogue = `Ouch! -${enemy.damage} ❤️`;
                        this.dialogueTimer = 0;
                    }

                    // Vérifier si le joueur est mort
                    if (this.player.health <= 0) {
                        this.player.health = this.player.maxHealth;
                        this.player.x = 40;
                        this.player.y = 22;
                        this.currentDialogue = 'You died! Respawning...';
                        this.money = Math.floor(this.money * 0.5); // Perd la moitié de l'argent
                    }
                }
            });
        }
    }

    performAttack() {
        // Calculer la zone d'attaque selon la direction
        let attackX = this.player.x;
        let attackY = this.player.y;
        const attackRange = 1.5;

        switch (this.player.direction) {
            case 'up':
                attackY -= attackRange;
                break;
            case 'down':
                attackY += attackRange;
                break;
            case 'left':
                attackX -= attackRange;
                break;
            case 'right':
                attackX += attackRange;
                break;
        }

        // Calculer les dégâts (avec bonus de force si potion active)
        let damage = this.player.attackDamage;
        if (this.activeEffects.strength.active) {
            damage = Math.floor(damage * this.activeEffects.strength.bonus);
        }

        // Vérifier les ennemis touchés
        const enemiesToRemove = [];
        this.enemies.forEach((enemy, index) => {
            const distX = attackX - enemy.x;
            const distY = attackY - enemy.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < 1.5) {
                // L'ennemi est touché
                enemy.health -= damage;

                // Knockback de l'ennemi
                if (distance > 0) {
                    enemy.knockbackX = -(distX / distance) * 0.5;
                    enemy.knockbackY = -(distY / distance) * 0.5;
                }

                // Vérifier si l'ennemi est mort
                if (enemy.health <= 0) {
                    enemiesToRemove.push(index);
                    // Gagner de l'XP
                    this.player.xp += enemy.xpReward;
                    // Gagner un peu d'argent
                    this.money += Math.floor(enemy.xpReward / 3);

                    this.currentDialogue = `+${enemy.xpReward} XP! +${Math.floor(enemy.xpReward / 3)} coins!`;
                    this.dialogueTimer = 0;

                    // Vérifier level up
                    if (this.player.xp >= this.player.xpToNextLevel) {
                        this.player.xp -= this.player.xpToNextLevel;
                        this.player.level++;
                        this.player.xpToNextLevel = Math.floor(this.player.xpToNextLevel * 1.5);
                        this.levelUpChoice = true;
                    }
                }
            }
        });

        // Supprimer les ennemis morts (en ordre inverse)
        for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
            this.enemies.splice(enemiesToRemove[i], 1);
        }
    }

    checkNearBoat() {
        // Vérifier si le joueur est proche d'un bateau (seulement sur l'île principale ou désertique avec bateau)
        this.nearBoat = null;
        const interactionDistance = 3; // Augmenté pour permettre interaction depuis le dock

        this.boats.forEach(boat => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - boat.x, 2) +
                Math.pow(this.player.y - boat.y, 2)
            );

            if (distance < interactionDistance) {
                this.nearBoat = boat;
            }
        });
    }

    checkNearNPC() {
        // Vérifier si le joueur est proche d'un PNJ pour parler
        this.nearNPC = null;
        const talkDistance = 2;

        this.npcs.forEach(npc => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - npc.x, 2) +
                Math.pow(this.player.y - npc.y, 2)
            );

            if (distance < talkDistance) {
                this.nearNPC = npc;
            }
        });
    }

    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    getDialogue(npcType) {
        const dialogues = {
            'man': [
                "Hello! Beautiful weather today, isn't it?",
                "I love living on this island.",
                "The village is so peaceful here.",
                "Do you come here often?",
                "I'm going for a walk around the island."
            ],
            'woman': [
                "Hello dear! How are you today?",
                "This village is wonderful, don't you think?",
                "I just finished my gardening.",
                "The flowers are so pretty this season!",
                "I love watching the sunset from here."
            ],
            'child': [
                "Hi! Do you want to play?",
                "I love running around the island!",
                "Mom said not to go too far...",
                "Look at that pretty butterfly!",
                "Tag, you're it! Hehe!"
            ],
            'assistant': [
                "Good day. Can I help you?",
                "I'm here to help the villagers.",
                "If you need anything, let me know.",
                "Everything seems in order today.",
                "The shops are all open if you need supplies."
            ],
            'doctor': [
                "Hello! Are you feeling well?",
                "I have remedies for all ailments.",
                "Health is the most precious thing!",
                "Don't hesitate if you're injured."
            ],
            'blacksmith': [
                "Welcome to the forge!",
                "I can forge any weapon or tool.",
                "The forge fire never goes out!",
                "Need some equipment?"
            ],
            'priest': [
                "May peace be with you, my child.",
                "This church is open to everyone.",
                "Take time to pray and meditate.",
                "May heaven's blessings be upon you."
            ],
            'farmer': [
                "Hello! My vegetables are growing well this year.",
                "I grew these tomatoes and carrots myself!",
                "Working the land is hard but rewarding.",
                "Want to buy some fresh vegetables?"
            ],
            'merchant': [
                "Welcome to my magic potion shop!",
                "I have potions with extraordinary effects!",
                "Speed, strength, invisibility... What do you desire?",
                "My potions are the most powerful in the kingdom!"
            ]
        };

        const npcDialogues = dialogues[npcType];
        if (!npcDialogues) return "...";

        // Choisir un dialogue aléatoire
        return npcDialogues[Math.floor(Math.random() * npcDialogues.length)];
    }

    checkNearHouse() {
        // Vérifier si le joueur est proche d'une porte de maison
        this.nearHouse = null;

        // Si on est à l'intérieur, vérifier la proximité avec la sortie
        if (this.insideHouse) {
            // Porte au centre en bas (coordonnées pour maison 18x14)
            const doorX = 8.5; // Centre entre tuiles 8 et 9
            const doorY = 13; // Ligne du bas (avant-dernière ligne)
            const doorDist = Math.sqrt(
                Math.pow(this.player.x - doorX, 2) +
                Math.pow(this.player.y - doorY, 2)
            );
            if (doorDist < 2) {
                this.nearHouse = this.insideHouse;
            }
            return;
        }

        // Si on est dehors, vérifier les portes des maisons
        const interactionDistance = 1.5;
        this.houses.forEach(house => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - house.doorX, 2) +
                Math.pow(this.player.y - house.doorY, 2)
            );

            if (distance < interactionDistance) {
                this.nearHouse = house;
            }
        });
    }

    handleInteraction() {
        // Si on est en mode boutique, fermer la boutique
        if (this.shopMode) {
            this.shopMode = false;
            this.currentShop = null;
            return;
        }

        // Vérifier interaction avec le coffre au trésor
        if (this.treasureChest && !this.treasureChest.opened && !this.insideHouse) {
            const distX = this.player.x - this.treasureChest.x;
            const distY = this.player.y - this.treasureChest.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < 2) {
                // Le joueur est près du coffre
                if (this.inventory['Treasure Key']) {
                    // Ouvrir le coffre !
                    this.treasureChest.opened = true;
                    this.treasureFound = true;
                    delete this.inventory['Treasure Key'];

                    // Récompenses du trésor
                    this.money += 500;
                    this.player.gems += 10;
                    this.player.maxHealth += 4; // +1 cœur
                    this.player.health = this.player.maxHealth;

                    this.currentDialogue = "🎉 You found your father's treasure! +500 coins, +10 gems, +1 heart!";
                    this.dialogueTimer = 0;
                    return;
                } else {
                    this.currentDialogue = "🔒 The chest is locked. You need a key...";
                    this.dialogueTimer = 0;
                    return;
                }
            }
        }

        // Priorité 1: Dialogue avec PNJ (si on ne ferme pas déjà un dialogue)
        if (this.nearNPC && !this.currentDialogue) {
            // Si c'est le fermier, ouvrir la boutique au lieu d'un simple dialogue
            if (this.nearNPC.type === 'farmer' && this.insideHouse && this.insideHouse.type === 'farmer') {
                this.shopMode = true;
                this.currentShop = {
                    type: 'farmer',
                    items: [
                        { name: 'Tomato', price: 5, key: '1' },
                        { name: 'Carrot', price: 5, key: '2' },
                        { name: 'Vegetable Basket', price: 15, key: '3' }
                    ]
                };
                return;
            }

            // Si c'est le forgeron, ouvrir la boutique d'armes
            if (this.nearNPC.type === 'blacksmith' && this.insideHouse && this.insideHouse.type === 'blacksmith') {
                this.shopMode = true;
                this.currentShop = {
                    type: 'blacksmith',
                    items: [
                        { name: 'Rusty Sword', price: 30, icon: '⚔️', key: '1' },
                        { name: 'Rusty Shield', price: 20, icon: '🛡️', key: '2' }
                    ]
                };
                return;
            }

            // Si c'est le médecin, ouvrir la boutique médicale
            if (this.nearNPC.type === 'doctor' && this.insideHouse && this.insideHouse.type === 'doctor') {
                this.shopMode = true;
                this.currentShop = {
                    type: 'doctor',
                    items: [
                        { name: 'Bandage', price: 10, icon: '🩹', key: '1' },
                        { name: 'Medical Kit', price: 25, icon: '💊', key: '2' }
                    ]
                };
                return;
            }

            // Si c'est le poissonnier, ouvrir la boutique de poisson
            if (this.nearNPC.type === 'fisher' && this.insideHouse && this.insideHouse.type === 'fisher') {
                this.shopMode = true;
                this.currentShop = {
                    type: 'fisher',
                    items: [
                        { name: 'Fish', price: 6, icon: '🐟', key: '1' },
                        { name: 'Salmon', price: 8, icon: '🐠', key: '2' },
                        { name: 'Fish Basket', price: 20, icon: '🧺', key: '3' }
                    ]
                };
                return;
            }

            // Si c'est le marchand, ouvrir la boutique de potions
            if (this.nearNPC.type === 'merchant' && this.insideHouse && this.insideHouse.type === 'merchant') {
                this.shopMode = true;
                this.currentShop = {
                    type: 'merchant',
                    items: [
                        { name: 'Speed Potion', price: 40, icon: '⚡', key: '1' },
                        { name: 'Invisibility Potion', price: 50, icon: '👻', key: '2' },
                        { name: 'Strength Potion', price: 45, icon: '💪', key: '3' },
                        { name: 'Invincibility Potion', price: 60, icon: '💫', key: '4' }
                    ]
                };
                return;
            }

            // Dialogue normal pour les autres PNJ
            this.currentDialogue = this.getDialogue(this.nearNPC.type);
            this.dialogueTimer = 0;
            return;
        }

        // Si on a un dialogue ouvert, le fermer
        if (this.currentDialogue) {
            this.currentDialogue = null;
            this.dialogueTimer = 0;
            return;
        }

        // Priorité 2: Interaction avec maison
        if (this.nearHouse) {
            if (this.insideHouse) {
                this.exitHouse();
            } else {
                this.enterHouse(this.nearHouse);
            }
            return;
        }

        // Priorité 3: Interaction avec bateau
        if (this.nearBoat) {
            if (this.currentIsland === 'main') {
                this.travelToDesertIsland();
            } else if (this.currentIsland === 'desert') {
                this.travelToMainIsland();
            }
        }
    }

    consumeItem(itemName) {
        // Vérifier qu'on a l'objet dans food ou inventory
        const isInFood = this.food[itemName] && this.food[itemName] > 0;
        const isInInventory = this.inventory[itemName] && this.inventory[itemName] > 0;

        if (!isInFood && !isInInventory) {
            return;
        }

        // Définir les effets de restauration selon le type d'objet
        let healthRestore = 0;
        let itemVerb = 'utilisé';
        let isPotionEffect = false;

        // Food
        if (itemName === 'Tomato') {
            healthRestore = 1; // Restores 1/4 heart
            itemVerb = 'ate';
        } else if (itemName === 'Carrot') {
            healthRestore = 1; // Restores 1/4 heart
            itemVerb = 'ate';
        } else if (itemName === 'Vegetable Basket') {
            healthRestore = 2; // Restores 1/2 heart
            itemVerb = 'ate';
        }
        // Fish items
        else if (itemName === 'Fish') {
            healthRestore = 1; // Restores 1/4 heart
            itemVerb = 'ate';
        } else if (itemName === 'Salmon') {
            healthRestore = 2; // Restores 1/2 heart
            itemVerb = 'ate';
        } else if (itemName === 'Fish Basket') {
            healthRestore = 3; // Restores 3/4 heart
            itemVerb = 'ate';
        }
        // Medical items
        else if (itemName === 'Bandage') {
            healthRestore = 4; // Restores 1 heart
            itemVerb = 'used';
        } else if (itemName === 'Medical Kit') {
            healthRestore = 8; // Restores 2 hearts
            itemVerb = 'used';
        }
        // Magic potions
        else if (itemName === 'Speed Potion') {
            this.activatePotion('speed');
            isPotionEffect = true;
            itemVerb = 'drank';
        } else if (itemName === 'Invisibility Potion') {
            this.activatePotion('invisibility');
            isPotionEffect = true;
            itemVerb = 'drank';
        } else if (itemName === 'Strength Potion') {
            this.activatePotion('strength');
            isPotionEffect = true;
            itemVerb = 'drank';
        } else if (itemName === 'Invincibility Potion') {
            this.activatePotion('invincibility');
            isPotionEffect = true;
            itemVerb = 'drank';
        }

        // Si c'est un soin et déjà à la vie max, ne pas consommer
        if (healthRestore > 0 && this.player.health >= this.player.maxHealth) {
            this.currentDialogue = 'Your health is already full!';
            this.dialogueTimer = 0;
            return;
        }

        // Consommer l'objet de la bonne catégorie
        if (isInFood) {
            this.food[itemName]--;
            if (this.food[itemName] === 0) {
                delete this.food[itemName];
            }
        } else if (isInInventory) {
            this.inventory[itemName]--;
            if (this.inventory[itemName] === 0) {
                delete this.inventory[itemName];
            }
        }

        // Restaurer la vie ou afficher message de potion
        if (healthRestore > 0) {
            this.player.health = Math.min(this.player.health + healthRestore, this.player.maxHealth);
            const heartsRestored = healthRestore / 4;
            this.currentDialogue = `You ${itemVerb} ${itemName}! +${heartsRestored} ❤️`;
            this.dialogueTimer = 0;
        } else if (isPotionEffect) {
            // Le message est géré dans activatePotion()
        }
    }

    activatePotion(potionType) {
        const effect = this.activeEffects[potionType];

        if (potionType === 'invincibility') {
            effect.active = true;
            effect.hitsRemaining = effect.maxHits;
            this.currentDialogue = `Invincibility Potion activated! 💫 (${effect.maxHits} hits)`;
        } else {
            effect.active = true;
            effect.duration = effect.maxDuration;

            let message = '';
            switch(potionType) {
                case 'speed':
                    message = 'Speed Potion activated! ⚡ You are faster!';
                    break;
                case 'invisibility':
                    message = 'Invisibility Potion activated! 👻 Enemies can\'t see you!';
                    break;
                case 'strength':
                    message = 'Strength Potion activated! 💪 Your attacks are stronger!';
                    break;
            }
            this.currentDialogue = message;
        }
        this.dialogueTimer = 0;
    }

    updatePotionEffects() {
        // Mettre à jour les timers des potions à durée
        for (const [effectName, effect] of Object.entries(this.activeEffects)) {
            if (effect.active && effect.duration !== undefined) {
                effect.duration--;
                if (effect.duration <= 0) {
                    effect.active = false;

                    // Message de fin d'effet
                    let endMessage = '';
                    switch(effectName) {
                        case 'speed':
                            endMessage = 'Speed effect wore off.';
                            break;
                        case 'invisibility':
                            endMessage = 'You are visible again.';
                            break;
                        case 'strength':
                            endMessage = 'Strength effect wore off.';
                            break;
                    }
                    if (endMessage && !this.currentDialogue) {
                        this.currentDialogue = endMessage;
                        this.dialogueTimer = 0;
                    }
                }
            }
        }
    }

    travelToDesertIsland() {
        console.log("Voyage vers l'île désertique...");

        // Sauvegarder l'état actuel de l'île principale
        this.savedMainIsland = {
            map: JSON.parse(JSON.stringify(this.map)),
            houses: JSON.parse(JSON.stringify(this.houses)),
            npcs: JSON.parse(JSON.stringify(this.npcs)),
            boats: JSON.parse(JSON.stringify(this.boats)),
            portLocation: this.portLocation,
            waterDirection: this.waterDirection
        };

        this.savedMainPlayer = {
            x: this.player.x,
            y: this.player.y
        };

        // Créer l'île désertique
        this.currentIsland = 'desert';
        this.createDesertIsland();

        // Positionner le joueur sur le dock de l'île désertique
        if (this.desertDockLocation) {
            if (this.desertDockLocation.direction === 'west') {
                this.player.x = this.desertDockLocation.x + 1;
                this.player.y = this.desertDockLocation.y;
            } else if (this.desertDockLocation.direction === 'south') {
                this.player.x = this.desertDockLocation.x;
                this.player.y = this.desertDockLocation.y + 1;
            }
        }

        console.log("Arrivée sur l'île désertique!");
    }

    travelToMainIsland() {
        console.log("Retour vers l'île principale...");

        // Restaurer l'île principale
        this.map = JSON.parse(JSON.stringify(this.savedMainIsland.map));
        this.houses = JSON.parse(JSON.stringify(this.savedMainIsland.houses));
        this.npcs = JSON.parse(JSON.stringify(this.savedMainIsland.npcs));
        this.boats = JSON.parse(JSON.stringify(this.savedMainIsland.boats));
        this.portLocation = this.savedMainIsland.portLocation;
        this.waterDirection = this.savedMainIsland.waterDirection;

        // Restaurer la position du joueur
        this.player.x = this.savedMainPlayer.x;
        this.player.y = this.savedMainPlayer.y;

        this.currentIsland = 'main';
        console.log("Retour sur l'île principale!");
    }

    enterHouse(house) {
        console.log("Entrée dans la maison", house.type);

        // Sauvegarder la position extérieure
        this.savedOutdoorPosition = {
            x: this.player.x,
            y: this.player.y
        };

        // Sauvegarder l'état extérieur
        this.savedOutdoorState = {
            map: JSON.parse(JSON.stringify(this.map)),
            npcs: JSON.parse(JSON.stringify(this.npcs)),
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight
        };

        // Créer l'intérieur de la maison
        this.insideHouse = house;
        this.createHouseInterior(house.type);

        // Positionner le joueur à l'entrée (pour maison 18x14)
        this.player.x = 8.5; // Centre de la porte
        this.player.y = 11; // Juste au-dessus de la porte
    }

    exitHouse() {
        console.log("Sortie de la maison");

        // Restaurer la map extérieure
        this.map = JSON.parse(JSON.stringify(this.savedOutdoorState.map));
        this.npcs = JSON.parse(JSON.stringify(this.savedOutdoorState.npcs));
        this.mapWidth = this.savedOutdoorState.mapWidth;
        this.mapHeight = this.savedOutdoorState.mapHeight;

        // Restaurer la position du joueur
        this.player.x = this.savedOutdoorPosition.x;
        this.player.y = this.savedOutdoorPosition.y;

        // Réinitialiser
        this.insideHouse = null;
        this.houseInterior = null;
    }

    createHouseInterior(type) {
        // Créer une map d'intérieur agrandie 18x14
        const interiorWidth = 18;
        const interiorHeight = 14;
        this.map = [];

        // Initialiser avec plancher (tuile 1 - plancher bois)
        for (let y = 0; y < interiorHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < interiorWidth; x++) {
                this.map[y][x] = 1; // Plancher
            }
        }

        // Murs (tuile 3 - maison)
        for (let x = 0; x < interiorWidth; x++) {
            this.map[0][x] = 3; // Mur haut
            this.map[interiorHeight - 1][x] = 3; // Mur bas
        }
        for (let y = 0; y < interiorHeight; y++) {
            this.map[y][0] = 3; // Mur gauche
            this.map[y][interiorWidth - 1] = 3; // Mur droit
        }

        // Porte en bas au centre (tuile 1 - plancher)
        this.map[interiorHeight - 1][8] = 1;
        this.map[interiorHeight - 1][9] = 1;

        // Décoration selon le type de maison
        this.npcs = []; // Réinitialiser les NPCs

        // Tuiles: 8=Lit, 9=Table, 10=Chaise, 11=Coffre, 12=Établi, 13=Bibliothèque, 14=Comptoir, 15=Canapé
        // 16=Étagère, 17=Poisson accroché, 18=Cagette légumes, 19=Baril, 20=Étal poissons, 21=Cagette carottes

        switch(type) {
            case 'player':
                // Maison du joueur: 1 lit, 1 coffre, 1 table, 1 canapé
                // Lit (coin haut gauche) - 2x2
                this.map[2][2] = 8;
                this.map[2][3] = 8;
                this.map[3][2] = 8;
                this.map[3][3] = 8;
                // Coffre (coin haut droit)
                this.map[2][15] = 11;
                // Table + 4 chaises (centre)
                this.map[6][8] = 9;
                this.map[6][9] = 9;
                this.map[7][8] = 9;
                this.map[7][9] = 9;
                this.map[5][8] = 10; // Chaise haut
                this.map[8][9] = 10; // Chaise bas
                this.map[6][7] = 10; // Chaise gauche
                this.map[7][10] = 10; // Chaise droite
                // Canapé (bas gauche)
                this.map[10][2] = 15;
                this.map[10][3] = 15;
                // Étagère (coin bas droit)
                this.map[10][15] = 16;
                break;

            case 'farmer':
                // Maison du fermier: 1 lit, 1 table, établi, légumes
                // Lit (2x2)
                this.map[2][2] = 8;
                this.map[2][3] = 8;
                this.map[3][2] = 8;
                this.map[3][3] = 8;
                // Établi (zone de travail droite)
                this.map[2][14] = 12;
                this.map[2][15] = 12;
                // Cagettes de légumes (produits de la ferme)
                this.map[2][10] = 18; // Tomates
                this.map[3][10] = 21; // Carottes
                this.map[2][11] = 18;
                // Table à manger (2x2)
                this.map[7][7] = 9;
                this.map[7][8] = 9;
                this.map[8][7] = 10; // Chaise
                this.map[6][8] = 10; // Chaise
                // Coffre d'outils
                this.map[6][2] = 11;
                // Baril
                this.map[10][14] = 19;
                this.map[10][3] = 19;
                // PNJ farmer près de l'établi
                this.npcs.push({
                    x: 12,
                    y: 8,
                    type: 'farmer',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'fisher':
                // POISSONNIER - Magasin de poisson avec étal
                // Comptoir séparant le magasin (ligne 6) - avec passage au milieu
                for (let x = 2; x < 7; x++) {
                    this.map[6][x] = 14;
                }
                for (let x = 11; x < 16; x++) {
                    this.map[6][x] = 14;
                }
                // Passage libre de x=7 à x=10 pour circuler

                // Zone arrière (marchand)
                // Étal de poissons sur glace (1 seul grand)
                this.map[2][3] = 20;
                this.map[2][4] = 20;
                this.map[3][3] = 20;
                this.map[3][4] = 20;

                // Étal de poissons sur glace (2ème)
                this.map[2][12] = 20;
                this.map[2][13] = 20;
                this.map[3][12] = 20;
                this.map[3][13] = 20;

                // Poissons accrochés (mur arrière) - 2 poissons
                this.map[2][7] = 17;
                this.map[2][9] = 17;

                // Barils de poissons - 2 barils
                this.map[4][3] = 19;
                this.map[4][13] = 19;

                // Coffre pour l'argent - 1 coffre
                this.map[2][15] = 11;

                // Zone client (devant le comptoir) - espacées pour ne pas bloquer
                // Chaises pour attendre - 2 chaises
                this.map[9][3] = 10;
                this.map[9][13] = 10;

                // Table d'exposition - 1 table (déplacée légèrement)
                this.map[11][4] = 9;
                this.map[11][5] = 9;

                // PNJ poissonnier derrière le comptoir
                this.npcs.push({
                    x: 8,
                    y: 4,
                    type: 'fisher',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'merchant':
                // MARCHAND DE POTIONS - Boutique de potions magiques
                // Comptoir séparant le magasin (ligne 6) - avec passage au milieu
                for (let x = 2; x < 7; x++) {
                    this.map[6][x] = 14;
                }
                for (let x = 11; x < 16; x++) {
                    this.map[6][x] = 14;
                }
                // Passage libre de x=7 à x=10 pour circuler

                // Zone arrière (marchand)
                // Étagères de potions (gauche)
                this.map[2][2] = 24; // Étagère potions
                this.map[3][2] = 24; // Étagère potions

                // Étagères de potions (rangée arrière gauche)
                this.map[2][4] = 24; // Potions
                this.map[2][5] = 24; // Potions
                this.map[3][4] = 24; // Potions
                this.map[3][5] = 24; // Potions

                // Étagères de potions (rangée arrière droite)
                this.map[2][11] = 24;
                this.map[2][12] = 24;
                this.map[3][11] = 24;
                this.map[3][12] = 24;

                // Étagères de droite
                this.map[2][14] = 24;
                this.map[3][14] = 24;

                // Coffres magiques (2)
                this.map[4][3] = 11;
                this.map[4][13] = 11;

                // Coffre caisse
                this.map[2][15] = 11;

                // Zone client
                // Étagères de potions côté client (espacées)
                this.map[8][3] = 24;
                this.map[8][5] = 24;
                this.map[8][12] = 24;
                this.map[8][14] = 24;

                // Chaises pour attendre (2) - espacées
                this.map[11][4] = 10;
                this.map[11][13] = 10;

                // PNJ marchand derrière le comptoir
                this.npcs.push({
                    x: 8,
                    y: 4,
                    type: 'merchant',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'elder':
                // Maison de l'ancien: 1 lit, bibliothèques, 1 table ronde
                // Lit (2x2)
                this.map[2][2] = 8;
                this.map[2][3] = 8;
                this.map[3][2] = 8;
                this.map[3][3] = 8;

                // Bibliothèques (mur droit) - 6 bibliothèques
                this.map[2][15] = 13;
                this.map[3][15] = 13;
                this.map[4][15] = 13;
                this.map[6][15] = 13;
                this.map[7][15] = 13;
                this.map[8][15] = 13;

                // Bibliothèques (mur gauche) - 3 bibliothèques
                this.map[6][2] = 13;
                this.map[7][2] = 13;
                this.map[8][2] = 13;

                // Table ronde au centre (2x2)
                this.map[7][8] = 9;
                this.map[7][9] = 9;
                this.map[8][8] = 9;
                this.map[8][9] = 9;

                // Chaises autour de la table (4 chaises)
                this.map[6][8] = 10;
                this.map[9][9] = 10;
                this.map[7][7] = 10;
                this.map[8][10] = 10;

                // Coffre ancien (1)
                this.map[2][13] = 11;

                // PNJ elder assis à sa table
                this.npcs.push({
                    x: 10,
                    y: 4,
                    type: 'elder',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'doctor':
                // Cabinet médical : lits médicaux, potions, table d'examen
                // Lits médicaux (2x2 chacun)
                this.map[2][2] = 25;
                this.map[2][3] = 25;
                this.map[3][2] = 25;
                this.map[3][3] = 25;

                this.map[2][6] = 25;
                this.map[2][7] = 25;
                this.map[3][6] = 25;
                this.map[3][7] = 25;

                // Étagères de potions
                this.map[2][14] = 24;
                this.map[3][14] = 24;
                this.map[4][14] = 24;

                this.map[2][15] = 24;
                this.map[3][15] = 24;
                this.map[4][15] = 24;

                // Table d'examen
                this.map[7][3] = 9;
                this.map[7][4] = 9;
                this.map[8][3] = 9;
                this.map[8][4] = 9;

                // Chaise
                this.map[7][6] = 10;

                // Coffre médical
                this.map[10][2] = 11;
                this.map[10][3] = 11;

                // Bureau
                this.map[10][13] = 9;
                this.map[10][14] = 9;
                this.map[10][15] = 10;

                // PNJ médecin
                this.npcs.push({
                    x: 8,
                    y: 5,
                    type: 'doctor',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'blacksmith':
                // Forge : disposition aérée avec beaucoup d'espace pour se déplacer

                // Grande forge à gauche
                this.map[3][2] = 23;
                this.map[3][3] = 23;
                this.map[4][2] = 23;
                this.map[4][3] = 23;

                // Enclume à côté de la forge
                this.map[2][5] = 22;

                // Établi à droite
                this.map[3][13] = 12;
                this.map[3][14] = 12;
                this.map[4][13] = 12;
                this.map[4][14] = 12;

                // Coffre d'armes en haut à droite
                this.map[2][15] = 11;

                // Barils en bas (contre le mur) - ATTENTION à laisser l'entrée libre!
                this.map[10][2] = 19;
                this.map[10][4] = 19;
                this.map[10][15] = 19;

                // Table de travail en bas à gauche
                this.map[10][5] = 9;
                this.map[10][6] = 9;

                // PNJ forgeron près de l'enclume (beaucoup d'espace autour)
                this.npcs.push({
                    x: 5,
                    y: 5,
                    type: 'blacksmith',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'church':
                // Église : autel, bancs, croix
                // Grand autel au fond (centre haut)
                this.map[2][7] = 26;
                this.map[2][8] = 26;
                this.map[2][9] = 26;
                this.map[2][10] = 26;
                this.map[3][7] = 26;
                this.map[3][8] = 26;
                this.map[3][9] = 26;
                this.map[3][10] = 26;

                // Bancs (rangées)
                // Rangée gauche
                this.map[6][3] = 27;
                this.map[6][4] = 27;
                this.map[6][5] = 27;

                this.map[8][3] = 27;
                this.map[8][4] = 27;
                this.map[8][5] = 27;

                this.map[10][3] = 27;
                this.map[10][4] = 27;
                this.map[10][5] = 27;

                // Rangée droite
                this.map[6][12] = 27;
                this.map[6][13] = 27;
                this.map[6][14] = 27;

                this.map[8][12] = 27;
                this.map[8][13] = 27;
                this.map[8][14] = 27;

                this.map[10][12] = 27;
                this.map[10][13] = 27;
                this.map[10][14] = 27;

                // Petits autels sur les côtés
                this.map[5][2] = 26;
                this.map[5][15] = 26;

                // PNJ prêtre devant l'autel
                this.npcs.push({
                    x: 8,
                    y: 5,
                    type: 'priest',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'villager1':
                // Maison villageois 1 : famille avec enfants
                // Lit double (parents)
                this.map[2][2] = 8;
                this.map[2][3] = 8;
                this.map[3][2] = 8;
                this.map[3][3] = 8;

                // Lit simple (enfants)
                this.map[2][14] = 8;
                this.map[2][15] = 8;

                // Grande table familiale (2x2)
                this.map[7][7] = 9;
                this.map[7][8] = 9;
                this.map[8][7] = 9;
                this.map[8][8] = 9;

                // Chaises autour
                this.map[6][7] = 10;
                this.map[9][8] = 10;
                this.map[7][6] = 10;
                this.map[8][9] = 10;

                // Coffres
                this.map[2][10] = 11;
                this.map[3][10] = 11;

                // Canapé
                this.map[10][2] = 15;
                this.map[10][3] = 15;

                // Étagère
                this.map[10][14] = 16;

                // PNJ villageois 1
                this.npcs.push({
                    x: 10,
                    y: 7,
                    type: 'villager',
                    direction: 'down',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'villager2':
                // Maison villageois 2 : couple de personnes âgées
                // Lit double
                this.map[2][2] = 8;
                this.map[2][3] = 8;
                this.map[3][2] = 8;
                this.map[3][3] = 8;

                // Table petite
                this.map[7][13] = 9;
                this.map[7][14] = 9;

                // Chaises
                this.map[6][13] = 10;
                this.map[8][14] = 10;

                // Bibliothèque (livres)
                this.map[2][14] = 13;
                this.map[3][14] = 13;
                this.map[4][14] = 13;

                // Coffre
                this.map[2][15] = 11;

                // Grand canapé
                this.map[10][3] = 15;
                this.map[10][4] = 15;
                this.map[10][5] = 15;

                // Table basse devant canapé
                this.map[9][4] = 9;

                // Étagère
                this.map[2][8] = 16;

                // PNJ villageois 2
                this.npcs.push({
                    x: 12,
                    y: 6,
                    type: 'villager',
                    direction: 'left',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;

            case 'villager3':
                // Maison villageois 3 : jeune couple
                // Lit double
                this.map[2][2] = 8;
                this.map[2][3] = 8;
                this.map[3][2] = 8;
                this.map[3][3] = 8;

                // Table à manger
                this.map[6][12] = 9;
                this.map[6][13] = 9;
                this.map[7][12] = 9;
                this.map[7][13] = 9;

                // Chaises
                this.map[5][12] = 10;
                this.map[8][13] = 10;
                this.map[6][11] = 10;
                this.map[7][14] = 10;

                // Coffres rangement
                this.map[2][14] = 11;
                this.map[2][15] = 11;

                // Canapé moderne
                this.map[10][2] = 15;
                this.map[10][3] = 15;
                this.map[10][4] = 15;

                // Étagère
                this.map[3][8] = 16;
                this.map[4][8] = 16;

                // Table de travail/bureau
                this.map[10][14] = 9;
                this.map[10][15] = 10;

                // PNJ villageois 3
                this.npcs.push({
                    x: 9,
                    y: 9,
                    type: 'villager',
                    direction: 'right',
                    animFrame: 0,
                    animTimer: 0,
                    moveTimer: 0,
                    idleTime: 999999
                });
                break;
        }

        // Mettre à jour les dimensions de la map
        this.mapWidth = interiorWidth;
        this.mapHeight = interiorHeight;
    }

    createDesertIsland() {
        // Réinitialiser
        this.map = [];
        this.houses = [];
        this.npcs = [];
        this.boats = [];
        this.portLocation = null;
        this.waterDirection = null;

        // Initialiser avec de l'eau partout
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = 4; // Eau
            }
        }

        // Créer l'île au centre (avec sable)
        const islandLeft = 8;
        const islandRight = this.mapWidth - 8;
        const islandTop = 6;
        const islandBottom = this.mapHeight - 6;

        for (let y = islandTop; y < islandBottom; y++) {
            for (let x = islandLeft; x < islandRight; x++) {
                // Bordures organiques avec sinus
                const leftEdge = islandLeft + Math.sin(y * 0.3) * 2;
                const rightEdge = islandRight - Math.sin(y * 0.25) * 2;
                const topEdge = islandTop + Math.cos(x * 0.3) * 2;
                const bottomEdge = islandBottom - Math.cos(x * 0.25) * 2;

                if (x > leftEdge && x < rightEdge && y > topEdge && y < bottomEdge) {
                    this.map[y][x] = 1; // Sable
                }
            }
        }

        // Ajouter des rochers (tuile 6) dans le désert
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * (this.mapWidth - 20)) + 10;
            const y = Math.floor(Math.random() * (this.mapHeight - 12)) + 8;

            if (this.map[y][x] === 1) { // Seulement sur le sable
                this.map[y][x] = 6; // Rocher
            }
        }

        // Ajouter quelques cactus (on va utiliser la tuile 2 - arbres, mais on les dessinera comme des cactus)
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(Math.random() * (this.mapWidth - 20)) + 10;
            const y = Math.floor(Math.random() * (this.mapHeight - 12)) + 8;

            if (this.map[y][x] === 1) { // Seulement sur le sable
                this.map[y][x] = 2; // Cactus (dessine comme arbre pour l'instant)
            }
        }

        // Placer le dock au bord gauche de l'île, bien visible
        const dockX = islandLeft + 3;
        const dockY = Math.floor(this.mapHeight / 2);
        const dockDirection = 'west';

        console.log("Dock désertique créé à:", dockX, dockY, "direction:", dockDirection);

        // Sauvegarder la position du dock
        this.desertDockLocation = { x: dockX, y: dockY, direction: dockDirection };

        // Nettoyer la zone du dock: sable sur la terre
        for (let y = dockY - 3; y <= dockY + 3; y++) {
            for (let x = dockX; x <= dockX + 4; x++) {
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    this.map[y][x] = 1; // Sable
                }
            }
        }

        // Eau à gauche du dock
        for (let y = dockY - 3; y <= dockY + 3; y++) {
            for (let x = 0; x < dockX; x++) {
                if (y >= 0 && y < this.mapHeight) {
                    this.map[y][x] = 4; // Eau
                }
            }
        }

        // Placer le dock qui s'étend de la terre vers l'eau
        for (let y = dockY - 2; y <= dockY + 2; y++) {
            for (let x = dockX - 2; x <= dockX; x++) {
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    this.map[y][x] = 7; // Dock
                }
            }
        }

        // Bateau dans l'eau à l'ouest du dock
        this.boats.push({
            x: dockX - 3.5,
            y: dockY,
            type: 'small',
            color: '#A0522D',
            bobTimer: 0
        });

        console.log("Bateau créé, total bateaux:", this.boats.length);
    }

    handlePlayerMovement() {
        // Bloquer les mouvements pendant l'intro ou le choix de level up
        if (this.levelUpChoice || this.introActive) {
            return;
        }

        let inputX = 0;
        let inputY = 0;

        if (this.keys['z']) {
            inputY -= 1;
            this.player.direction = 'up';
        }
        if (this.keys['s']) {
            inputY += 1;
            this.player.direction = 'down';
        }
        if (this.keys['q']) {
            inputX -= 1;
            this.player.direction = 'left';
        }
        if (this.keys['d']) {
            inputX += 1;
            this.player.direction = 'right';
        }

        if (inputX !== 0 && inputY !== 0) {
            inputX *= 0.707;
            inputY *= 0.707;
        }

        if (inputX !== 0 || inputY !== 0) {
            this.player.velocityX += inputX * this.player.acceleration;
            this.player.velocityY += inputY * this.player.acceleration;
        }

        this.player.velocityX *= this.player.momentum;
        this.player.velocityY *= this.player.momentum;

        const currentSpeed = Math.sqrt(
            this.player.velocityX ** 2 + this.player.velocityY ** 2
        );

        // Appliquer le boost de vitesse si la potion est active
        const speedMultiplier = this.activeEffects.speed.active ? 2.0 : 1.0;
        const effectiveMaxSpeed = this.player.maxSpeed * speedMultiplier;

        if (currentSpeed > effectiveMaxSpeed) {
            const scale = effectiveMaxSpeed / currentSpeed;
            this.player.velocityX *= scale;
            this.player.velocityY *= scale;
        }

        this.player.velocityX *= this.player.friction;
        this.player.velocityY *= this.player.friction;

        if (Math.abs(this.player.velocityX) < 0.001) this.player.velocityX = 0;
        if (Math.abs(this.player.velocityY) < 0.001) this.player.velocityY = 0;

        const newX = this.player.x + this.player.velocityX;
        const newY = this.player.y + this.player.velocityY;

        if (this.canWalkOn(newX, this.player.y)) {
            this.player.x = newX;
        } else {
            this.player.velocityX *= -0.2;
        }

        if (this.canWalkOn(this.player.x, newY)) {
            this.player.y = newY;
        } else {
            this.player.velocityY *= -0.2;
        }
    }

    canWalkOn(x, y) {
        // Vérifier plusieurs points autour du joueur pour une meilleure collision
        const checkRadius = 0.3; // Rayon de vérification autour du centre
        const pointsToCheck = [
            { x: x, y: y },                           // Centre
            { x: x - checkRadius, y: y - checkRadius }, // Haut-gauche
            { x: x + checkRadius, y: y - checkRadius }, // Haut-droite
            { x: x - checkRadius, y: y + checkRadius }, // Bas-gauche
            { x: x + checkRadius, y: y + checkRadius }  // Bas-droite
        ];

        // Tous les points doivent être marchables
        for (const point of pointsToCheck) {
            const tileX = Math.floor(point.x);
            const tileY = Math.floor(point.y);

            if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
                return false;
            }

            const tile = this.map[tileY][tileX];
            // Ne peut pas marcher sur: eau (4), arbres (2), maisons (3), rochers (6), meubles et décorations (8-31)
            // PEUT marcher sur: herbe (0), chemins (1), fleurs (5), docks (7), champs (32-34)
            if (tile === 4 || tile === 2 || tile === 3 || tile === 6 || (tile >= 8 && tile <= 31)) {
                return false;
            }
        }

        return true;
    }

    canNPCWalkOn(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return false;
        }

        const tile = this.map[tileY][tileX];
        // NPCs ne peuvent pas marcher sur: eau (4), arbres (2), maisons (3), rochers (6), docks (7), meubles (8-31)
        // PEUT marcher sur: herbe (0), chemins (1), fleurs (5), champs (32-34)
        return tile !== 4 && tile !== 2 && tile !== 3 && tile !== 6 && tile !== 7 &&
               !(tile >= 8 && tile <= 31);
    }

    handleJump() {
        if (this.player.isJumping) {
            this.player.jumpHeight += this.player.jumpSpeed;
            this.player.jumpSpeed -= 0.025;

            if (this.player.jumpHeight <= 0) {
                this.player.jumpHeight = 0;
                this.player.jumpSpeed = 0;
                this.player.isJumping = false;
            }
        }
    }

    updatePlayerAnimation() {
        if (Math.abs(this.player.velocityX) > 0.01 || Math.abs(this.player.velocityY) > 0.01) {
            this.player.animTimer++;
            if (this.player.animTimer > 7) {
                this.player.animFrame = (this.player.animFrame + 1) % 2;
                this.player.animTimer = 0;
            }
        } else {
            this.player.animFrame = 0;
            this.player.animTimer = 0;
        }
    }

    updateCamera() {
        const targetX = this.player.x - this.viewportTilesX / 2;
        const targetY = this.player.y - this.viewportTilesY / 2;

        this.camera.x += (targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (targetY - this.camera.y) * this.camera.smoothing;

        this.camera.x = Math.max(0, Math.min(this.camera.x, this.mapWidth - this.viewportTilesX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.mapHeight - this.viewportTilesY));
    }

    draw() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.showMinimap) {
            this.drawFullMap();
        } else {
            this.drawMap();
            this.drawBoats();
            this.drawNPCs();
            this.drawEnemies();
            this.drawTreasureChest();
            this.drawPlayer();
            this.drawAttack();
            this.drawShield();
            this.drawIntroElder();
            this.drawUI();
            this.drawIntroDialogue();
            this.drawHelp();
        }
    }

    drawHelp() {
        if (!this.showHelp) return;

        // Fond semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Cadre principal
        const boxWidth = 700;
        const boxHeight = 550;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;

        // Fond du cadre
        this.ctx.fillStyle = 'rgba(40, 40, 60, 0.98)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Bordure dorée
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Titre
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⌨️ CONTROLS ⌨️', this.canvas.width / 2, boxY + 45);

        // Ligne de séparation
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(boxX + 30, boxY + 65);
        this.ctx.lineTo(boxX + boxWidth - 30, boxY + 65);
        this.ctx.stroke();

        // Définir les touches
        const controls = [
            { category: '🚶 MOVEMENT', keys: [
                { key: 'Z', action: 'Move up' },
                { key: 'Q', action: 'Move left' },
                { key: 'S', action: 'Move down' },
                { key: 'D', action: 'Move right' },
                { key: 'SPACE', action: 'Jump' }
            ]},
            { category: '⚔️ COMBAT', keys: [
                { key: 'F', action: 'Attack (requires sword)' },
                { key: 'R', action: 'Block with shield (hold)' }
            ]},
            { category: '🎒 INVENTORY & MENUS', keys: [
                { key: 'TAB', action: 'Open/Close inventory' },
                { key: '1-9', action: 'Use item from inventory' },
                { key: 'M', action: 'Show/Hide full map' },
                { key: 'P', action: 'Show/Hide this help page' }
            ]},
            { category: '🏠 INTERACTION', keys: [
                { key: 'E', action: 'Interact (talk, enter, shop, open chest)' }
            ]}
        ];

        let yOffset = boxY + 95;
        this.ctx.textAlign = 'left';

        controls.forEach(section => {
            // Catégorie
            this.ctx.font = 'bold 20px monospace';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(section.category, boxX + 40, yOffset);
            yOffset += 30;

            // Touches de cette catégorie
            section.keys.forEach(control => {
                // Fond de la touche
                this.ctx.fillStyle = 'rgba(80, 80, 100, 0.6)';
                this.ctx.fillRect(boxX + 50, yOffset - 18, 80, 26);
                this.ctx.strokeStyle = '#888';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(boxX + 50, yOffset - 18, 80, 26);

                // Touche
                this.ctx.font = 'bold 16px monospace';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(control.key, boxX + 60, yOffset);

                // Action
                this.ctx.font = '16px monospace';
                this.ctx.fillStyle = '#CCCCCC';
                this.ctx.fillText(control.action, boxX + 150, yOffset);

                yOffset += 32;
            });

            yOffset += 15; // Espace entre les sections
        });

        // Indication pour fermer
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press P to close', this.canvas.width / 2, boxY + boxHeight - 25);

        // Reset textAlign
        this.ctx.textAlign = 'left';
    }

    drawTreasureChest() {
        if (!this.treasureChest || this.insideHouse) return;

        const screenX = (this.treasureChest.x - this.camera.x) * this.tileSize;
        const screenY = (this.treasureChest.y - this.camera.y) * this.tileSize;

        // Ne dessiner que si visible
        if (screenX < -this.tileSize || screenX > this.canvas.width ||
            screenY < -this.tileSize || screenY > this.canvas.height) {
            return;
        }

        const cx = screenX + this.tileSize / 2;
        const cy = screenY + this.tileSize / 2;

        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy + 12, 18, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.treasureChest.opened) {
            // Coffre ouvert
            // Base du coffre
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(cx - 16, cy - 4, 32, 18);

            // Bordure dorée
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cx - 16, cy - 4, 32, 18);

            // Couvercle ouvert (incliné vers l'arrière)
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(cx - 14, cy - 18, 28, 14);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.strokeRect(cx - 14, cy - 18, 28, 14);

            // Intérieur doré (le trésor!)
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(cx - 12, cy, 24, 10);

        } else {
            // Coffre fermé
            // Corps du coffre
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(cx - 16, cy - 8, 32, 22);

            // Couvercle arrondi
            this.ctx.fillStyle = '#A0522D';
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy - 8, 16, 8, 0, Math.PI, 2 * Math.PI);
            this.ctx.fill();

            // Bordures dorées
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(cx - 16, cy - 8, 32, 22);
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy - 8, 16, 8, 0, Math.PI, 2 * Math.PI);
            this.ctx.stroke();

            // Serrure
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(cx - 4, cy, 8, 6);
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy + 3, 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Effet brillant (le coffre attend d'être ouvert)
            const glow = Math.sin(Date.now() * 0.005) * 0.3 + 0.5;
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${glow})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy, 22, 18, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawIntroElder() {
        if (!this.introActive || !this.introElder) return;

        const screenX = (this.introElder.x - this.camera.x) * this.tileSize;
        const screenY = (this.introElder.y - this.camera.y) * this.tileSize;

        const size = 30;
        const px = screenX + (this.tileSize - size) / 2;
        const py = screenY + (this.tileSize - size) / 2;

        // Ombre
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + this.tileSize / 2, screenY + this.tileSize / 2 + 2, size / 2, size / 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Corps (robe grise de l'ancien)
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(px + 6, py + 14, 18, 14);

        // Tête
        this.ctx.fillStyle = '#e0c0a0';
        this.ctx.fillRect(px + 9, py + 6, 12, 10);

        // Barbe blanche
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(px + 10, py + 12, 10, 8);

        // Capuche/Chapeau
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.fillRect(px + 7, py + 2, 16, 6);

        // Yeux
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px + 11, py + 9, 2, 2);
        this.ctx.fillRect(px + 17, py + 9, 2, 2);

        // Bâton
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(px + 24, py + 4, 3, 24);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(px + 25.5, py + 4, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawIntroDialogue() {
        if (!this.introActive) return;

        // Fond semi-transparent en bas de l'écran
        const boxHeight = 120;
        const boxY = this.canvas.height - boxHeight - 20;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(20, boxY, this.canvas.width - 40, boxHeight);

        // Bordure dorée
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(20, boxY, this.canvas.width - 40, boxHeight);

        // Nom du personnage
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('The Elder', 40, boxY + 30);

        // Ligne de séparation
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(40, boxY + 40);
        this.ctx.lineTo(this.canvas.width - 60, boxY + 40);
        this.ctx.stroke();

        // Dialogue
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#FFFFFF';
        const dialogue = this.introDialogues[this.introDialogueIndex] || '';
        this.ctx.fillText(dialogue, 40, boxY + 70);

        // Indication pour continuer
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('Press E to continue...', this.canvas.width - 200, boxY + boxHeight - 15);
        }

        // Indicateur de progression
        this.ctx.fillStyle = '#888';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`${this.introDialogueIndex + 1}/${this.introDialogues.length}`, 40, boxY + boxHeight - 15);
    }

    drawMap() {
        const startX = Math.floor(this.camera.x);
        const startY = Math.floor(this.camera.y);
        const endX = Math.min(startX + this.viewportTilesX + 2, this.mapWidth);
        const endY = Math.min(startY + this.viewportTilesY + 2, this.mapHeight);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const screenX = (x - this.camera.x) * this.tileSize;
                const screenY = (y - this.camera.y) * this.tileSize;

                this.drawTile(this.map[y][x], screenX, screenY, x, y);
            }
        }
    }

    drawTile(tile, screenX, screenY, x, y) {
        switch(tile) {
            case 0: // Herbe
                const grassVar = (x * 23 + y * 17) % 4;
                const grassColors = ['#4a9d5f', '#3d8d52', '#5aad6f', '#498c5e'];
                this.ctx.fillStyle = grassColors[grassVar];
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                this.ctx.fillStyle = '#2d6b40';
                for (let i = 0; i < 4; i++) {
                    const px = ((x * 13 + y * 19 + i * 7) % 26) + 3;
                    const py = ((x * 17 + y * 11 + i * 5) % 26) + 3;
                    this.ctx.fillRect(screenX + px, screenY + py, 1, 2);
                }
                break;

            case 1: // Chemin
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                this.ctx.fillStyle = '#b5a380';
                this.ctx.fillRect(screenX, screenY, this.tileSize, 1);
                this.ctx.fillRect(screenX, screenY + this.tileSize - 1, this.tileSize, 1);

                this.ctx.fillStyle = '#9d8b6f';
                const stones = ((x + y) % 3) + 1;
                for (let i = 0; i < stones; i++) {
                    const sx = ((x * 11 + y * 13 + i * 5) % 28) + 2;
                    const sy = ((x * 17 + y * 19 + i * 7) % 28) + 2;
                    this.ctx.fillRect(screenX + sx, screenY + sy, 2, 2);
                }
                break;

            case 2: // Arbre
                this.ctx.fillStyle = '#4a9d5f';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 16, screenY + 26, 8, 4, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#6d4c28';
                this.ctx.fillRect(screenX + 13, screenY + 16, 6, 10);

                this.ctx.fillStyle = '#8b6234';
                this.ctx.fillRect(screenX + 13, screenY + 16, 2, 10);

                this.ctx.fillStyle = '#1a5a1a';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 16, screenY + 14, 10, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#2d7d2d';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 15, screenY + 12, 9, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#3d9d3d';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 14, screenY + 10, 7, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#4dbd4d';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 12, screenY + 8, 3, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 3: // Maison
                this.drawHouseTile3D(screenX, screenY, x, y);
                break;

            case 4: // Eau
                const time = Date.now() * 0.001;
                const waterPhase = Math.sin((x + y + time * 2) * 0.5);
                this.ctx.fillStyle = waterPhase > 0 ? '#3a7ba8' : '#4a8bc8';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                this.ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
                const wave = Math.sin((x * 0.5 + time * 3)) * 3;
                this.ctx.fillRect(screenX + 6 + wave, screenY + 8, 8, 2);
                this.ctx.fillRect(screenX + 16 - wave, screenY + 20, 8, 2);
                break;

            case 5: // Fleurs
                this.ctx.fillStyle = '#4a9d5f';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 16, screenY + 20, 3, 1.5, 0, 0, Math.PI * 2);
                this.ctx.fill();

                const flowerType = (x * 11 + y * 13) % 3;
                const flowerColors = ['#ff6b9d', '#ff1493', '#ffc0cb'];

                this.ctx.fillStyle = flowerColors[flowerType];
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const px = screenX + 16 + Math.cos(angle) * 3;
                    const py = screenY + 15 + Math.sin(angle) * 3;
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 16, screenY + 15, 2, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = '#2d7440';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(screenX + 16, screenY + 17);
                this.ctx.lineTo(screenX + 16, screenY + 26);
                this.ctx.stroke();
                break;

            case 6: // Rocher
                this.ctx.fillStyle = '#4a9d5f';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 16, screenY + 24, 9, 4, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#606060';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 17, screenY + 18, 10, 8, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#909090';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 15, screenY + 16, 9, 7, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#b0b0b0';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX + 12, screenY + 14, 4, 3, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#505050';
                this.ctx.fillRect(screenX + 18, screenY + 17, 3, 2);
                this.ctx.fillRect(screenX + 14, screenY + 20, 2, 2);
                break;

            case 7: // Dock en bois
                // Fond (eau ou herbe)
                if (y < this.mapHeight - 1 && this.map[y + 1][x] === 4) {
                    // Si c'est au-dessus de l'eau, dessiner l'eau en dessous
                    const time = Date.now() * 0.001;
                    const waterPhase = Math.sin((x + y + time * 2) * 0.5);
                    this.ctx.fillStyle = waterPhase > 0 ? '#3a7ba8' : '#4a8bc8';
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }

                // Planches en bois
                this.ctx.fillStyle = '#8B6914';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Planches individuelles
                this.ctx.fillStyle = '#A0791A';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(screenX, screenY + i * 11, this.tileSize, 10);
                }

                // Lignes entre les planches
                this.ctx.strokeStyle = '#6B5010';
                this.ctx.lineWidth = 2;
                for (let i = 1; i < 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(screenX, screenY + i * 11);
                    this.ctx.lineTo(screenX + this.tileSize, screenY + i * 11);
                    this.ctx.stroke();
                }

                // Clous
                this.ctx.fillStyle = '#404040';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(screenX + 4, screenY + 2 + i * 11, 2, 2);
                    this.ctx.fillRect(screenX + 26, screenY + 2 + i * 11, 2, 2);
                }

                // Ombre sous le dock
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 2, this.tileSize - 4, 2);
                break;

            case 8: // Lit
                // Plancher d'abord
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Cadre du lit (bois marron)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 6, screenY + 6, 36, 36);

                // Matelas (bleu clair)
                this.ctx.fillStyle = '#6495ED';
                this.ctx.fillRect(screenX + 9, screenY + 9, 30, 30);

                // Oreiller (blanc)
                this.ctx.fillStyle = '#f0f0f0';
                this.ctx.fillRect(screenX + 12, screenY + 12, 24, 12);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(screenX + 8, screenY + 40, 32, 2);
                break;

            case 9: // Table
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Dessus de table (bois clair)
                this.ctx.fillStyle = '#d2691e';
                this.ctx.fillRect(screenX + 6, screenY + 18, 36, 18);

                // Reflet
                this.ctx.fillStyle = '#e88d3e';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 6);

                // Pieds
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 10, screenY + 36, 4, 8);
                this.ctx.fillRect(screenX + 34, screenY + 36, 4, 8);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(screenX + 8, screenY + 42, 32, 2);
                break;

            case 10: // Chaise
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Siège (bois)
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 12, screenY + 24, 24, 12);

                // Dossier
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 14, screenY + 12, 20, 12);

                // Pieds
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 14, screenY + 36, 3, 6);
                this.ctx.fillRect(screenX + 31, screenY + 36, 3, 6);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(screenX + 14, screenY + 40, 20, 2);
                break;

            case 11: // Coffre
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Corps du coffre (bois foncé)
                this.ctx.fillStyle = '#4a3010';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 18);

                // Couvercle
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 8, screenY + 16, 32, 6);

                // Serrure (or)
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(screenX + 22, screenY + 26, 4, 6);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 10, screenY + 40, 28, 2);
                break;

            case 12: // Établi
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Surface de travail (gris)
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(screenX + 6, screenY + 18, 36, 16);

                // Structure (bois)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 8, screenY + 34, 32, 6);

                // Outils sur l'établi
                this.ctx.fillStyle = '#b87333';
                this.ctx.fillRect(screenX + 12, screenY + 22, 6, 3);
                this.ctx.fillRect(screenX + 30, screenY + 24, 4, 4);

                // Pieds
                this.ctx.fillStyle = '#4a3010';
                this.ctx.fillRect(screenX + 10, screenY + 40, 4, 6);
                this.ctx.fillRect(screenX + 34, screenY + 40, 4, 6);
                break;

            case 13: // Bibliothèque
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Structure (bois marron)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 6, screenY + 6, 36, 40);

                // Étagères (bois clair)
                this.ctx.fillStyle = '#8b6914';
                this.ctx.fillRect(screenX + 8, screenY + 12, 32, 3);
                this.ctx.fillRect(screenX + 8, screenY + 22, 32, 3);
                this.ctx.fillRect(screenX + 8, screenY + 32, 32, 3);

                // Livres (couleurs variées)
                this.ctx.fillStyle = '#8b0000';
                this.ctx.fillRect(screenX + 10, screenY + 14, 6, 7);
                this.ctx.fillStyle = '#00008b';
                this.ctx.fillRect(screenX + 17, screenY + 14, 6, 7);
                this.ctx.fillStyle = '#228b22';
                this.ctx.fillRect(screenX + 24, screenY + 14, 6, 7);
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 14, screenY + 24, 6, 7);
                this.ctx.fillRect(screenX + 26, screenY + 24, 8, 7);
                break;

            case 14: // Comptoir
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Comptoir (bois clair)
                this.ctx.fillStyle = '#cd853f';
                this.ctx.fillRect(screenX + 4, screenY + 14, 40, 24);

                // Dessus poli
                this.ctx.fillStyle = '#daa520';
                this.ctx.fillRect(screenX + 6, screenY + 14, 36, 8);

                // Reflets
                this.ctx.fillStyle = '#f0e68c';
                this.ctx.fillRect(screenX + 8, screenY + 16, 32, 2);

                // Panneaux avant
                this.ctx.fillStyle = '#8b6914';
                this.ctx.fillRect(screenX + 6, screenY + 26, 16, 10);
                this.ctx.fillRect(screenX + 26, screenY + 26, 14, 10);
                break;

            case 15: // Canapé
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Dossier (rouge foncé)
                this.ctx.fillStyle = '#8b0000';
                this.ctx.fillRect(screenX + 8, screenY + 12, 32, 12);

                // Siège
                this.ctx.fillStyle = '#a52a2a';
                this.ctx.fillRect(screenX + 8, screenY + 24, 32, 14);

                // Coussins (rouge clair)
                this.ctx.fillStyle = '#dc143c';
                this.ctx.fillRect(screenX + 10, screenY + 16, 12, 8);
                this.ctx.fillRect(screenX + 26, screenY + 16, 12, 8);

                // Pieds
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 12, screenY + 38, 3, 5);
                this.ctx.fillRect(screenX + 33, screenY + 38, 3, 5);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 10, screenY + 42, 28, 2);
                break;

            case 16: // Étagère de marchandises
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Structure (bois marron)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 4, screenY + 4, 40, 42);

                // Étagères (bois clair)
                this.ctx.fillStyle = '#8b6914';
                this.ctx.fillRect(screenX + 6, screenY + 10, 36, 3);
                this.ctx.fillRect(screenX + 6, screenY + 20, 36, 3);
                this.ctx.fillRect(screenX + 6, screenY + 30, 36, 3);
                this.ctx.fillRect(screenX + 6, screenY + 40, 36, 3);

                // Bocaux et marchandises (couleurs variées)
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fillRect(screenX + 8, screenY + 12, 6, 7);
                this.ctx.fillStyle = '#4ecdc4';
                this.ctx.fillRect(screenX + 16, screenY + 12, 6, 7);
                this.ctx.fillStyle = '#ffe66d';
                this.ctx.fillRect(screenX + 24, screenY + 12, 6, 7);
                this.ctx.fillStyle = '#95e1d3';
                this.ctx.fillRect(screenX + 32, screenY + 12, 6, 7);

                // Deuxième rangée
                this.ctx.fillStyle = '#f38181';
                this.ctx.fillRect(screenX + 10, screenY + 22, 7, 7);
                this.ctx.fillStyle = '#aa96da';
                this.ctx.fillRect(screenX + 20, screenY + 22, 8, 7);
                this.ctx.fillStyle = '#fcbad3';
                this.ctx.fillRect(screenX + 30, screenY + 22, 7, 7);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 6, screenY + 44, 36, 2);
                break;

            case 17: // Poisson accroché
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Crochet (métal)
                this.ctx.fillStyle = '#708090';
                this.ctx.fillRect(screenX + 22, screenY + 8, 2, 6);

                // Corps du poisson (argenté)
                this.ctx.fillStyle = '#c0c0c0';
                this.ctx.fillRect(screenX + 14, screenY + 16, 20, 12);

                // Détails du poisson
                this.ctx.fillStyle = '#a8a8a8';
                this.ctx.fillRect(screenX + 16, screenY + 18, 16, 8);

                // Nageoires
                this.ctx.fillStyle = '#c0c0c0';
                this.ctx.fillRect(screenX + 12, screenY + 20, 4, 4);
                this.ctx.fillRect(screenX + 32, screenY + 20, 4, 4);

                // Queue
                this.ctx.fillStyle = '#b0b0b0';
                this.ctx.fillRect(screenX + 34, screenY + 18, 6, 8);

                // Œil
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(screenX + 18, screenY + 20, 2, 2);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(screenX + 16, screenY + 30, 18, 2);
                break;

            case 18: // Cagette de légumes
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Cagette (bois clair)
                this.ctx.fillStyle = '#deb887';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 20);

                // Planches verticales
                this.ctx.fillStyle = '#d2a679';
                this.ctx.fillRect(screenX + 10, screenY + 22, 3, 16);
                this.ctx.fillRect(screenX + 16, screenY + 22, 3, 16);
                this.ctx.fillRect(screenX + 22, screenY + 22, 3, 16);
                this.ctx.fillRect(screenX + 28, screenY + 22, 3, 16);
                this.ctx.fillRect(screenX + 34, screenY + 22, 3, 16);

                // Légumes (tomates rouges)
                this.ctx.fillStyle = '#ff6347';
                this.ctx.fillRect(screenX + 12, screenY + 14, 6, 6);
                this.ctx.fillRect(screenX + 20, screenY + 16, 6, 6);
                this.ctx.fillRect(screenX + 28, screenY + 15, 6, 6);

                // Feuilles vertes
                this.ctx.fillStyle = '#228b22';
                this.ctx.fillRect(screenX + 14, screenY + 12, 2, 3);
                this.ctx.fillRect(screenX + 22, screenY + 14, 2, 3);
                this.ctx.fillRect(screenX + 30, screenY + 13, 2, 3);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 10, screenY + 40, 28, 2);
                break;

            case 19: // Baril
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Corps du baril (bois)
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 12, screenY + 16, 24, 24);

                // Cercles métalliques
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 10, screenY + 18, 28, 3);
                this.ctx.fillRect(screenX + 10, screenY + 28, 28, 3);
                this.ctx.fillRect(screenX + 10, screenY + 36, 28, 3);

                // Planches verticales (détails)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 16, screenY + 18, 2, 20);
                this.ctx.fillRect(screenX + 22, screenY + 18, 2, 20);
                this.ctx.fillRect(screenX + 28, screenY + 18, 2, 20);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 14, screenY + 40, 20, 2);
                break;

            case 20: // Étal de poissons (glace)
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Caisse en bois
                this.ctx.fillStyle = '#8b6914';
                this.ctx.fillRect(screenX + 6, screenY + 18, 36, 20);

                // Bordures
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 6, screenY + 18, 36, 3);
                this.ctx.fillRect(screenX + 6, screenY + 35, 36, 3);

                // Glace (bleu-blanc)
                this.ctx.fillStyle = '#e0f7fa';
                this.ctx.fillRect(screenX + 8, screenY + 22, 32, 12);

                // Reflets de glace
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(screenX + 10, screenY + 24, 8, 2);
                this.ctx.fillRect(screenX + 24, screenY + 26, 12, 2);

                // Poissons sur glace (argenté)
                this.ctx.fillStyle = '#c0c0c0';
                this.ctx.fillRect(screenX + 12, screenY + 26, 10, 4);
                this.ctx.fillRect(screenX + 26, screenY + 28, 10, 4);

                // Détails poissons
                this.ctx.fillStyle = '#a8a8a8';
                this.ctx.fillRect(screenX + 14, screenY + 27, 6, 2);
                this.ctx.fillRect(screenX + 28, screenY + 29, 6, 2);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 8, screenY + 38, 32, 2);
                break;

            case 21: // Cagette de carottes
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Cagette (bois clair)
                this.ctx.fillStyle = '#deb887';
                this.ctx.fillRect(screenX + 8, screenY + 24, 32, 16);

                // Planches
                this.ctx.fillStyle = '#d2a679';
                this.ctx.fillRect(screenX + 10, screenY + 26, 3, 12);
                this.ctx.fillRect(screenX + 18, screenY + 26, 3, 12);
                this.ctx.fillRect(screenX + 26, screenY + 26, 3, 12);
                this.ctx.fillRect(screenX + 34, screenY + 26, 3, 12);

                // Carottes (orange)
                this.ctx.fillStyle = '#ff8c00';
                this.ctx.fillRect(screenX + 12, screenY + 18, 4, 8);
                this.ctx.fillRect(screenX + 20, screenY + 16, 4, 10);
                this.ctx.fillRect(screenX + 28, screenY + 17, 4, 9);

                // Fanes vertes
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 13, screenY + 16, 2, 4);
                this.ctx.fillRect(screenX + 21, screenY + 14, 2, 4);
                this.ctx.fillRect(screenX + 29, screenY + 15, 2, 4);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 10, screenY + 40, 28, 2);
                break;

            case 22: // Enclume
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Base de l'enclume (gris foncé)
                this.ctx.fillStyle = '#2f4f4f';
                this.ctx.fillRect(screenX + 8, screenY + 32, 32, 8);

                // Corps de l'enclume (gris métallique)
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 10, screenY + 20, 28, 12);

                // Corne de l'enclume
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 32, screenY + 16, 10, 8);

                // Reflets métalliques
                this.ctx.fillStyle = '#a9a9a9';
                this.ctx.fillRect(screenX + 12, screenY + 22, 12, 3);
                this.ctx.fillRect(screenX + 34, screenY + 18, 4, 2);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.fillRect(screenX + 10, screenY + 40, 28, 2);
                break;

            case 23: // Forge/Fourneau
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Structure en pierre (gris)
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 6, screenY + 14, 36, 28);

                // Briques
                this.ctx.fillStyle = '#808080';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(screenX + 8, screenY + 16 + i * 8, 14, 6);
                    this.ctx.fillRect(screenX + 24, screenY + 16 + i * 8, 14, 6);
                }

                // Ouverture de la forge (rouge/orange - feu)
                this.ctx.fillStyle = '#ff4500';
                this.ctx.fillRect(screenX + 14, screenY + 24, 20, 12);

                // Flammes
                this.ctx.fillStyle = '#ff8c00';
                this.ctx.fillRect(screenX + 18, screenY + 26, 4, 8);
                this.ctx.fillRect(screenX + 26, screenY + 28, 4, 6);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 8, screenY + 42, 32, 2);
                break;

            case 24: // Étagère de potions
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Structure (bois marron)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 6, screenY + 6, 36, 40);

                // Étagères (bois clair)
                this.ctx.fillStyle = '#8b6914';
                this.ctx.fillRect(screenX + 8, screenY + 12, 32, 3);
                this.ctx.fillRect(screenX + 8, screenY + 22, 32, 3);
                this.ctx.fillRect(screenX + 8, screenY + 32, 32, 3);

                // Potions (rouge - santé)
                this.ctx.fillStyle = '#dc143c';
                this.ctx.fillRect(screenX + 10, screenY + 14, 5, 7);
                this.ctx.fillStyle = '#ff69b4';
                this.ctx.fillRect(screenX + 11, screenY + 15, 3, 3);

                // Potions (bleu - mana)
                this.ctx.fillStyle = '#1e90ff';
                this.ctx.fillRect(screenX + 18, screenY + 14, 5, 7);
                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(screenX + 19, screenY + 15, 3, 3);

                // Potions (vert - poison)
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 26, screenY + 14, 5, 7);
                this.ctx.fillStyle = '#90ee90';
                this.ctx.fillRect(screenX + 27, screenY + 15, 3, 3);

                // Potions (violet)
                this.ctx.fillStyle = '#9370db';
                this.ctx.fillRect(screenX + 34, screenY + 14, 5, 7);
                this.ctx.fillStyle = '#dda0dd';
                this.ctx.fillRect(screenX + 35, screenY + 15, 3, 3);

                // Deuxième rangée
                this.ctx.fillStyle = '#dc143c';
                this.ctx.fillRect(screenX + 14, screenY + 24, 5, 7);
                this.ctx.fillStyle = '#1e90ff';
                this.ctx.fillRect(screenX + 22, screenY + 24, 5, 7);
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 30, screenY + 24, 5, 7);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 8, screenY + 44, 32, 2);
                break;

            case 25: // Lit médical
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Cadre du lit (gris métallique)
                this.ctx.fillStyle = '#a9a9a9';
                this.ctx.fillRect(screenX + 6, screenY + 18, 36, 22);

                // Matelas (blanc)
                this.ctx.fillStyle = '#f5f5f5';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 16);

                // Oreiller (blanc cassé)
                this.ctx.fillStyle = '#fffaf0';
                this.ctx.fillRect(screenX + 10, screenY + 22, 12, 8);

                // Draps (blanc avec croix rouge)
                this.ctx.fillStyle = '#dc143c';
                this.ctx.fillRect(screenX + 26, screenY + 28, 8, 2); // Barre horizontale
                this.ctx.fillRect(screenX + 29, screenY + 25, 2, 8); // Barre verticale

                // Pieds du lit
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 8, screenY + 38, 3, 5);
                this.ctx.fillRect(screenX + 37, screenY + 38, 3, 5);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 8, screenY + 42, 32, 2);
                break;

            case 26: // Autel d'église
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Base de l'autel (pierre)
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(screenX + 4, screenY + 22, 40, 20);

                // Dessus de l'autel (marbre clair)
                this.ctx.fillStyle = '#d3d3d3';
                this.ctx.fillRect(screenX + 4, screenY + 20, 40, 4);

                // Nappe blanche
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(screenX + 6, screenY + 20, 36, 18);

                // Croix dorée sur l'autel
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(screenX + 22, screenY + 12, 4, 12); // Vertical
                this.ctx.fillRect(screenX + 18, screenY + 16, 12, 4); // Horizontal

                // Bougies
                this.ctx.fillStyle = '#fff8dc';
                this.ctx.fillRect(screenX + 10, screenY + 24, 3, 8);
                this.ctx.fillRect(screenX + 35, screenY + 24, 3, 8);

                // Flammes des bougies
                this.ctx.fillStyle = '#ff8c00';
                this.ctx.fillRect(screenX + 10, screenY + 22, 3, 3);
                this.ctx.fillRect(screenX + 35, screenY + 22, 3, 3);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 6, screenY + 42, 36, 2);
                break;

            case 27: // Banc d'église
                // Plancher
                this.ctx.fillStyle = '#c9b590';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Siège (bois marron)
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 6, screenY + 24, 36, 12);

                // Dossier
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 6, screenY + 12, 36, 12);

                // Détails du dossier
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 8, screenY + 14, 2, 8);
                this.ctx.fillRect(screenX + 16, screenY + 14, 2, 8);
                this.ctx.fillRect(screenX + 24, screenY + 14, 2, 8);
                this.ctx.fillRect(screenX + 32, screenY + 14, 2, 8);
                this.ctx.fillRect(screenX + 38, screenY + 14, 2, 8);

                // Pieds
                this.ctx.fillStyle = '#4a3010';
                this.ctx.fillRect(screenX + 10, screenY + 36, 3, 6);
                this.ctx.fillRect(screenX + 35, screenY + 36, 3, 6);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 8, screenY + 42, 32, 2);
                break;

            case 28: // Fontaine
                // Herbe en fond
                this.ctx.fillStyle = '#4a9d5f';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Bassin de la fontaine (pierre grise)
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 20);

                // Bordure du bassin (pierre claire)
                this.ctx.fillStyle = '#a9a9a9';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 4);
                this.ctx.fillRect(screenX + 8, screenY + 20, 4, 20);

                // Eau dans le bassin (bleu)
                this.ctx.fillStyle = '#4682b4';
                this.ctx.fillRect(screenX + 12, screenY + 24, 24, 14);

                // Reflets sur l'eau
                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(screenX + 14, screenY + 26, 8, 3);
                this.ctx.fillRect(screenX + 26, screenY + 30, 10, 3);

                // Colonne centrale (pierre)
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 20, screenY + 10, 8, 14);

                // Sommet de la colonne
                this.ctx.fillStyle = '#a9a9a9';
                this.ctx.fillRect(screenX + 18, screenY + 8, 12, 4);

                // Gouttes d'eau (bleu clair)
                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(screenX + 22, screenY + 12, 2, 3);
                this.ctx.fillRect(screenX + 16, screenY + 15, 2, 3);
                this.ctx.fillRect(screenX + 28, screenY + 14, 2, 3);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 10, screenY + 40, 28, 3);
                break;

            case 29: // Banc public
                // Herbe en fond
                this.ctx.fillStyle = '#4a9d5f';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Assise (bois marron)
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 8, screenY + 20, 32, 10);

                // Planches de l'assise
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 10, screenY + 22, 28, 2);
                this.ctx.fillRect(screenX + 10, screenY + 26, 28, 2);

                // Dossier
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(screenX + 8, screenY + 10, 32, 10);

                // Planches du dossier
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 10, screenY + 12, 28, 2);
                this.ctx.fillRect(screenX + 10, screenY + 16, 28, 2);

                // Pieds/supports (métal gris)
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 12, screenY + 30, 4, 8);
                this.ctx.fillRect(screenX + 32, screenY + 30, 4, 8);

                // Supports arrière
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(screenX + 12, screenY + 10, 4, 20);
                this.ctx.fillRect(screenX + 32, screenY + 10, 4, 20);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 10, screenY + 38, 28, 3);
                break;

            case 30: // Pavé de place (gris clair)
                // Pavé de base
                this.ctx.fillStyle = '#c0c0c0';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Joints entre pavés (gris foncé)
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(screenX, screenY, this.tileSize, 2);
                this.ctx.fillRect(screenX, screenY, 2, this.tileSize);

                // Variations de couleur pour le réalisme
                this.ctx.fillStyle = '#b8b8b8';
                this.ctx.fillRect(screenX + 4, screenY + 4, 18, 18);

                this.ctx.fillStyle = '#d0d0d0';
                this.ctx.fillRect(screenX + 26, screenY + 26, 18, 18);

                // Petites ombres sur les joints
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 2, 1);
                this.ctx.fillRect(screenX + 2, screenY + 2, 1, this.tileSize - 2);
                break;

            case 31: // Lampadaire
                // Herbe ou pavé en fond
                this.ctx.fillStyle = '#4a9d5f';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Poteau (fer noir)
                this.ctx.fillStyle = '#2f2f2f';
                this.ctx.fillRect(screenX + 20, screenY + 12, 8, 32);

                // Base du poteau
                this.ctx.fillStyle = '#404040';
                this.ctx.fillRect(screenX + 16, screenY + 40, 16, 4);

                // Lanterne (haut)
                this.ctx.fillStyle = '#2f2f2f';
                this.ctx.fillRect(screenX + 14, screenY + 6, 20, 8);

                // Verre de la lanterne (jaune/orange - lumière)
                this.ctx.fillStyle = '#ffdb58';
                this.ctx.fillRect(screenX + 18, screenY + 8, 12, 8);

                // Reflet de lumière
                this.ctx.fillStyle = '#fff5cc';
                this.ctx.fillRect(screenX + 20, screenY + 10, 8, 3);

                // Support de la lanterne
                this.ctx.fillStyle = '#2f2f2f';
                this.ctx.fillRect(screenX + 18, screenY + 10, 2, 4);
                this.ctx.fillRect(screenX + 28, screenY + 10, 2, 4);

                // Ombre
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 18, screenY + 44, 12, 2);
                break;

            case 32: // Champ de tomates
                // Terre labourée
                this.ctx.fillStyle = '#6b4423';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Sillons
                this.ctx.fillStyle = '#5a3a1e';
                this.ctx.fillRect(screenX, screenY + 10, this.tileSize, 4);
                this.ctx.fillRect(screenX, screenY + 22, this.tileSize, 4);
                this.ctx.fillRect(screenX, screenY + 34, this.tileSize, 4);

                // Plants de tomates (3 plants)
                // Plant 1
                this.ctx.fillStyle = '#228b22';
                this.ctx.fillRect(screenX + 10, screenY + 16, 6, 8);
                this.ctx.fillStyle = '#ff6347';
                this.ctx.fillRect(screenX + 12, screenY + 14, 4, 4);

                // Plant 2
                this.ctx.fillStyle = '#228b22';
                this.ctx.fillRect(screenX + 22, screenY + 28, 6, 8);
                this.ctx.fillStyle = '#ff6347';
                this.ctx.fillRect(screenX + 24, screenY + 26, 4, 4);

                // Plant 3
                this.ctx.fillStyle = '#228b22';
                this.ctx.fillRect(screenX + 34, screenY + 40, 6, 8);
                this.ctx.fillStyle = '#ff6347';
                this.ctx.fillRect(screenX + 36, screenY + 38, 4, 4);
                break;

            case 33: // Champ de carottes
                // Terre labourée
                this.ctx.fillStyle = '#6b4423';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Sillons
                this.ctx.fillStyle = '#5a3a1e';
                this.ctx.fillRect(screenX, screenY + 10, this.tileSize, 4);
                this.ctx.fillRect(screenX, screenY + 22, this.tileSize, 4);
                this.ctx.fillRect(screenX, screenY + 34, this.tileSize, 4);

                // Fanes de carottes (3 plants)
                // Plant 1
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 8, screenY + 12, 4, 6);
                this.ctx.fillRect(screenX + 10, screenY + 10, 4, 4);

                // Plant 2
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 20, screenY + 24, 4, 6);
                this.ctx.fillRect(screenX + 22, screenY + 22, 4, 4);

                // Plant 3
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 32, screenY + 36, 4, 6);
                this.ctx.fillRect(screenX + 34, screenY + 34, 4, 4);

                // Plant 4
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(screenX + 14, screenY + 40, 4, 6);
                this.ctx.fillRect(screenX + 16, screenY + 38, 4, 4);
                break;

            case 34: // Terre labourée vide
                // Terre labourée
                this.ctx.fillStyle = '#6b4423';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Sillons horizontaux
                this.ctx.fillStyle = '#5a3a1e';
                for (let i = 0; i < 4; i++) {
                    this.ctx.fillRect(screenX, screenY + 8 + i * 12, this.tileSize, 4);
                }

                // Mottes de terre
                this.ctx.fillStyle = '#7a5533';
                this.ctx.fillRect(screenX + 8, screenY + 14, 6, 4);
                this.ctx.fillRect(screenX + 24, screenY + 26, 6, 4);
                this.ctx.fillRect(screenX + 36, screenY + 38, 6, 4);
                break;
        }
    }

    drawHouseTile3D(screenX, screenY, x, y) {
        let houseInfo = null;
        for (const house of this.houses) {
            if (x >= house.x - 1 && x < house.x + house.width - 1 &&
                y >= house.y - 1 && y < house.y + house.height - 1) {
                houseInfo = {
                    house: house,
                    localX: x - (house.x - 1),
                    localY: y - (house.y - 1)
                };
                break;
            }
        }

        if (!houseInfo) return;

        const { localX, localY } = houseInfo;

        this.ctx.fillStyle = '#4a9d5f';
        this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

        if (localY === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(screenX + 2, screenY + this.tileSize - 2, this.tileSize - 2, 3);

            this.ctx.fillStyle = '#a52a2a';
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize - 2);

            this.ctx.fillStyle = '#8b0000';
            this.ctx.fillRect(screenX, screenY + 4, this.tileSize, 3);

            this.ctx.fillStyle = '#7d0000';
            for (let i = 0; i < 4; i++) {
                this.ctx.fillRect(screenX + i * 8, screenY + 2, 7, 2);
                this.ctx.fillRect(screenX + i * 8, screenY + 8, 7, 2);
            }

            if (localX === 1) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 22, screenY + 16, 8, 2);

                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 20, screenY, 8, 14);

                this.ctx.fillStyle = '#8b5a3c';
                this.ctx.fillRect(screenX + 20, screenY, 2, 14);

                this.ctx.fillStyle = '#4a3219';
                this.ctx.fillRect(screenX + 20, screenY, 8, 2);
            }
        } else {
            this.ctx.fillStyle = '#d2a679';
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(screenX, screenY + this.tileSize - 2, this.tileSize, 2);

            this.ctx.fillStyle = '#c49866';
            this.ctx.fillRect(screenX + 6, screenY, 2, this.tileSize);
            this.ctx.fillRect(screenX + 14, screenY, 2, this.tileSize);
            this.ctx.fillRect(screenX + 22, screenY, 2, this.tileSize);

            if (localY === 1 && (localX === 0 || localX === 2)) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 11, screenY + 11, 10, 10);

                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(screenX + 10, screenY + 10, 10, 10);

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.fillRect(screenX + 10, screenY + 10, 5, 5);

                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(screenX + 10, screenY + 10, 10, 10);

                this.ctx.beginPath();
                this.ctx.moveTo(screenX + 15, screenY + 10);
                this.ctx.lineTo(screenX + 15, screenY + 20);
                this.ctx.moveTo(screenX + 10, screenY + 15);
                this.ctx.lineTo(screenX + 20, screenY + 15);
                this.ctx.stroke();
            }

            if (localY === 2 && localX === 1) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.fillRect(screenX + 11, screenY + 6, 12, 20);

                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(screenX + 10, screenY + 5, 12, 20);

                this.ctx.fillStyle = '#7d5a3c';
                this.ctx.fillRect(screenX + 10, screenY + 5, 2, 20);

                this.ctx.fillStyle = '#5a3a1f';
                this.ctx.fillRect(screenX + 10, screenY + 7, 12, 2);
                this.ctx.fillRect(screenX + 10, screenY + 14, 12, 2);
                this.ctx.fillRect(screenX + 10, screenY + 21, 12, 2);

                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 17, screenY + 17, 2, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 16, screenY + 16, 2, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffeb3b';
                this.ctx.beginPath();
                this.ctx.arc(screenX + 15.5, screenY + 15.5, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawBoats() {
        this.boats.forEach(boat => {
            const screenX = (boat.x - this.camera.x) * this.tileSize;
            const screenY = (boat.y - this.camera.y) * this.tileSize;

            // Effet de balancement
            const bob = Math.sin(boat.bobTimer * 0.05) * 2;

            // Ombre du bateau
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(screenX + 16, screenY + 20, 20, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Coque du bateau
            this.ctx.fillStyle = boat.color;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 8, screenY + 8 + bob);
            this.ctx.lineTo(screenX + 24, screenY + 8 + bob);
            this.ctx.lineTo(screenX + 28, screenY + 16 + bob);
            this.ctx.lineTo(screenX + 4, screenY + 16 + bob);
            this.ctx.closePath();
            this.ctx.fill();

            // Côté clair de la coque
            this.ctx.fillStyle = this.lightenColor(boat.color, 30);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 8, screenY + 8 + bob);
            this.ctx.lineTo(screenX + 16, screenY + 8 + bob);
            this.ctx.lineTo(screenX + 16, screenY + 16 + bob);
            this.ctx.lineTo(screenX + 4, screenY + 16 + bob);
            this.ctx.closePath();
            this.ctx.fill();

            // Bord du bateau
            this.ctx.strokeStyle = this.darkenColor(boat.color, 30);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 8, screenY + 8 + bob);
            this.ctx.lineTo(screenX + 24, screenY + 8 + bob);
            this.ctx.lineTo(screenX + 28, screenY + 16 + bob);
            this.ctx.lineTo(screenX + 4, screenY + 16 + bob);
            this.ctx.closePath();
            this.ctx.stroke();

            // Bancs dans le bateau
            this.ctx.fillStyle = '#6B4423';
            this.ctx.fillRect(screenX + 10, screenY + 10 + bob, 12, 2);
            this.ctx.fillRect(screenX + 10, screenY + 13 + bob, 12, 2);

            // Corde d'amarrage
            this.ctx.strokeStyle = '#8B7355';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 28, screenY + 16 + bob);
            this.ctx.lineTo(screenX + 16, screenY - 10);
            this.ctx.stroke();
        });
    }

    drawNPCs() {
        this.npcs.forEach(npc => {
            const screenX = (npc.x - this.camera.x) * this.tileSize;
            const screenY = (npc.y - this.camera.y) * this.tileSize;

            // Ne dessiner que si visible
            if (screenX < -this.tileSize || screenX > this.canvas.width ||
                screenY < -this.tileSize || screenY > this.canvas.height) {
                return;
            }

            const size = 30; // Proportionné pour tuile 48px
            const px = screenX + (this.tileSize - size) / 2;
            const py = screenY + (this.tileSize - size) / 2;

            // Couleurs et taille selon le type
            let skinColor, clothesColor, hatColor, npcSize;
            switch(npc.type) {
                case 'man':
                    skinColor = '#f5c9a5';
                    clothesColor = '#4682B4'; // Bleu
                    hatColor = '#8B4513'; // Chapeau marron
                    npcSize = size;
                    break;
                case 'woman':
                    skinColor = '#f0d0b0';
                    clothesColor = '#DC143C'; // Rouge/rose
                    hatColor = '#9370DB'; // Chapeau violet
                    npcSize = size;
                    break;
                case 'child':
                    skinColor = '#ffd5b5';
                    clothesColor = '#32CD32'; // Vert clair
                    hatColor = '#FFD700'; // Chapeau jaune
                    npcSize = size * 0.75; // Plus petit
                    break;
                case 'assistant':
                    skinColor = '#e8b896';
                    clothesColor = '#2F4F4F'; // Gris-vert (uniforme)
                    hatColor = '#696969'; // Chapeau gris
                    npcSize = size;
                    break;
                default:
                    skinColor = '#f5d5b5';
                    clothesColor = '#556B2F';
                    hatColor = '#8B4513';
                    npcSize = size;
            }

            // Ajuster la taille pour les enfants
            const sizeRatio = npcSize / size;
            const adjustedPx = px + (size - npcSize) / 2;
            const adjustedPy = py + (size - npcSize);

            // Ombre (haute résolution, ajustée selon la taille)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(screenX + this.tileSize / 2, screenY + this.tileSize / 2 + 2, npcSize / 2, npcSize / 4, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Corps (haute résolution 48px, ajusté selon le type)
            this.ctx.fillStyle = clothesColor;
            this.ctx.fillRect(adjustedPx + 8 * sizeRatio, adjustedPy + 16 * sizeRatio, 14 * sizeRatio, 10 * sizeRatio);

            // Tête (haute résolution)
            this.ctx.fillStyle = skinColor;
            this.ctx.fillRect(adjustedPx + 9 * sizeRatio, adjustedPy + 6 * sizeRatio, 12 * sizeRatio, 10 * sizeRatio);

            // Chapeau (haute résolution)
            this.ctx.fillStyle = hatColor;
            this.ctx.fillRect(adjustedPx + 7 * sizeRatio, adjustedPy + 2 * sizeRatio, 16 * sizeRatio, 4 * sizeRatio);
            this.ctx.fillRect(adjustedPx + 9 * sizeRatio, adjustedPy + 0 * sizeRatio, 12 * sizeRatio, 3 * sizeRatio);

            // Yeux (haute résolution)
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(adjustedPx + 11 * sizeRatio, adjustedPy + 10 * sizeRatio, 2 * sizeRatio, 2 * sizeRatio);
            this.ctx.fillRect(adjustedPx + 17 * sizeRatio, adjustedPy + 10 * sizeRatio, 2 * sizeRatio, 2 * sizeRatio);

            // Jambes animées (haute résolution)
            this.ctx.fillStyle = this.darkenColor(clothesColor, 20);
            const legOffset = npc.animFrame * 2 * sizeRatio;
            this.ctx.fillRect(adjustedPx + 10 * sizeRatio, adjustedPy + 26 * sizeRatio - legOffset, 3 * sizeRatio, 4 * sizeRatio);
            this.ctx.fillRect(adjustedPx + 17 * sizeRatio, adjustedPy + 26 * sizeRatio + legOffset, 3 * sizeRatio, 4 * sizeRatio);
        });
    }

    drawEnemies() {
        // Ne pas dessiner les ennemis si on est dans une maison
        if (this.insideHouse) return;

        this.enemies.forEach(enemy => {
            const screenX = (enemy.x - this.camera.x) * this.tileSize;
            const screenY = (enemy.y - this.camera.y) * this.tileSize;

            // Ne dessiner que si visible
            if (screenX < -this.tileSize || screenX > this.canvas.width ||
                screenY < -this.tileSize || screenY > this.canvas.height) {
                return;
            }

            const size = 28;
            const px = screenX + (this.tileSize - size) / 2;
            const py = screenY + (this.tileSize - size) / 2;

            // Ombre
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(screenX + this.tileSize / 2, screenY + this.tileSize / 2 + 4, size / 2, size / 4, 0, 0, Math.PI * 2);
            this.ctx.fill();

            if (enemy.type === 'slime') {
                // Slime vert avec animation de rebond
                const bounce = Math.sin(enemy.animTimer * 0.3) * 3;

                // Corps du slime (vert)
                this.ctx.fillStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.ellipse(px + size / 2, py + size / 2 - bounce, size / 2 + 2, size / 2 - 2 + bounce / 2, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Highlight
                this.ctx.fillStyle = '#90EE90';
                this.ctx.beginPath();
                this.ctx.ellipse(px + size / 2 - 3, py + size / 2 - 5 - bounce, 6, 4, -0.3, 0, Math.PI * 2);
                this.ctx.fill();

                // Yeux
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(px + 8, py + size / 2 - 4 - bounce, 5, 5);
                this.ctx.fillRect(px + 16, py + size / 2 - 4 - bounce, 5, 5);

                // Pupilles
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(px + 10, py + size / 2 - 2 - bounce, 2, 2);
                this.ctx.fillRect(px + 18, py + size / 2 - 2 - bounce, 2, 2);

            } else if (enemy.type === 'goblin') {
                // Goblin (petit humanoïde vert)
                const legAnim = enemy.animFrame * 2;

                // Corps vert
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(px + 8, py + 10, 12, 12);

                // Tête
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(px + 6, py + 2, 16, 10);

                // Oreilles pointues
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(px + 2, py + 4, 5, 4);
                this.ctx.fillRect(px + 21, py + 4, 5, 4);

                // Yeux rouges
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(px + 8, py + 5, 4, 3);
                this.ctx.fillRect(px + 16, py + 5, 4, 3);

                // Pupilles
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(px + 9, py + 6, 2, 2);
                this.ctx.fillRect(px + 17, py + 6, 2, 2);

                // Jambes
                this.ctx.fillStyle = '#1a6b1a';
                this.ctx.fillRect(px + 9, py + 22 - legAnim, 4, 6);
                this.ctx.fillRect(px + 15, py + 22 + legAnim, 4, 6);
            }

            // Barre de vie de l'ennemi (si blessé)
            if (enemy.health < enemy.maxHealth) {
                const barWidth = 24;
                const barHeight = 4;
                const healthPercent = enemy.health / enemy.maxHealth;

                // Fond de la barre
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(px + (size - barWidth) / 2, py - 8, barWidth, barHeight);

                // Vie restante
                this.ctx.fillStyle = healthPercent > 0.5 ? '#32CD32' : healthPercent > 0.25 ? '#FFA500' : '#FF0000';
                this.ctx.fillRect(px + (size - barWidth) / 2, py - 8, barWidth * healthPercent, barHeight);
            }

            // Indicateur d'aggro
            if (enemy.isAggro) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText('!', px + size / 2 - 3, py - 10);
            }
        });
    }

    drawAttack() {
        if (!this.player.isAttacking) return;

        const screenX = (this.player.x - this.camera.x) * this.tileSize;
        const screenY = (this.player.y - this.camera.y) * this.tileSize - this.player.jumpHeight * 18;

        // Animation de l'épée selon la direction
        const attackProgress = 1 - (this.player.attackTimer / this.player.attackDuration);
        const swingAngle = attackProgress * Math.PI * 0.8; // Arc de 144 degrés

        this.ctx.save();
        this.ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);

        // Rotation selon la direction
        let baseAngle = 0;
        switch (this.player.direction) {
            case 'right': baseAngle = 0; break;
            case 'down': baseAngle = Math.PI / 2; break;
            case 'left': baseAngle = Math.PI; break;
            case 'up': baseAngle = -Math.PI / 2; break;
        }

        this.ctx.rotate(baseAngle + swingAngle - Math.PI / 4);

        // Dessiner l'épée (taille réduite)
        const swordLength = 22;
        const swordWidth = 4;

        // Lame
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(8, -swordWidth / 2, swordLength, swordWidth);

        // Pointe de l'épée
        this.ctx.beginPath();
        this.ctx.moveTo(8 + swordLength, -swordWidth / 2);
        this.ctx.lineTo(8 + swordLength + 5, 0);
        this.ctx.lineTo(8 + swordLength, swordWidth / 2);
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fill();

        // Garde
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(5, -6, 4, 12);

        // Poignée
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(-4, -2, 10, 4);

        // Effet de traînée lumineuse (plus petit)
        this.ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 28, -swingAngle, 0);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawShield() {
        if (!this.player.isBlocking || !this.weapons['Rusty Shield'] || this.player.shieldBroken) return;

        const screenX = (this.player.x - this.camera.x) * this.tileSize;
        const screenY = (this.player.y - this.camera.y) * this.tileSize - this.player.jumpHeight * 18;

        this.ctx.save();
        this.ctx.translate(screenX + this.tileSize / 2, screenY + this.tileSize / 2);

        // Position du bouclier selon la direction (plus proche du personnage)
        let offsetX = 0, offsetY = 0;
        switch (this.player.direction) {
            case 'right': offsetX = 14; break;
            case 'left': offsetX = -14; break;
            case 'down': offsetY = 14; break;
            case 'up': offsetY = -14; break;
        }

        this.ctx.translate(offsetX, offsetY);

        // Bouclier (taille réduite)
        // Ombre du bouclier
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(1, 1, 10, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Corps du bouclier (bois)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Bordure métallique
        this.ctx.strokeStyle = '#A0A0A0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        // Croix métallique (plus petite)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(-1.5, -10, 3, 20);
        this.ctx.fillRect(-8, -1.5, 16, 3);

        // Centre du bouclier (boss)
        this.ctx.fillStyle = '#D4AF37';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Indicateur de durabilité (couleur selon état)
        const durabilityPercent = this.player.shieldDurability / this.player.shieldMaxDurability;
        let auraColor;
        if (durabilityPercent > 0.6) {
            auraColor = 'rgba(100, 200, 255, 0.4)';
        } else if (durabilityPercent > 0.3) {
            auraColor = 'rgba(255, 200, 100, 0.4)';
        } else {
            auraColor = 'rgba(255, 100, 100, 0.5)';
        }

        this.ctx.strokeStyle = auraColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawPlayer() {
        const screenX = (this.player.x - this.camera.x) * this.tileSize;
        const screenY = (this.player.y - this.camera.y) * this.tileSize - this.player.jumpHeight * 18;

        const centerOffsetX = (this.tileSize - this.player.size) / 2;
        const centerOffsetY = (this.tileSize - this.player.size) / 2;

        const shadowOpacity = 0.3 + (this.player.jumpHeight * 0.02);
        const shadowScale = 1 - (this.player.jumpHeight * 0.03);
        this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
        this.ctx.save();
        this.ctx.translate(
            screenX + this.tileSize / 2,
            (this.player.y - this.camera.y) * this.tileSize + this.tileSize / 2
        );
        this.ctx.scale(shadowScale, shadowScale * 0.5);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        const px = screenX + centerOffsetX;
        const py = screenY + centerOffsetY;

        // Couleurs du husky
        const huskyGrayDark = '#4a5568';   // Gris foncé (dos, oreilles ext)
        const huskyGray = '#718096';       // Gris moyen
        const huskyWhite = '#ffffff';      // Blanc (ventre, museau, marques)
        const huskyBlue = '#3b82f6';       // Yeux bleus
        const huskyPink = '#fdb2b2';       // Intérieur oreilles

        // Sac à dos (dessiné en premier pour être derrière le corps)
        if (this.player.direction !== 'up') {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(px + 8, py + 22, 12, 10);
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(px + 9, py + 23, 10, 8);
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(px + 10, py + 18, 2, 6);
            this.ctx.fillRect(px + 18, py + 18, 2, 6);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(px + 13, py + 24, 4, 2);
        }

        // Oreilles de husky (petites, arrondies, sur le côté de la tête)
        this.ctx.fillStyle = huskyGrayDark;
        // Oreille gauche
        this.ctx.fillRect(px + 5, py + 6, 6, 8);
        // Oreille droite
        this.ctx.fillRect(px + 25, py + 6, 6, 8);

        // Intérieur des oreilles (rose)
        this.ctx.fillStyle = huskyPink;
        this.ctx.fillRect(px + 6, py + 8, 4, 5);
        this.ctx.fillRect(px + 26, py + 8, 4, 5);

        // Tête (base gris foncé)
        this.ctx.fillStyle = huskyGrayDark;
        this.ctx.fillRect(px + 8, py + 8, 20, 16);

        // Masque facial blanc (caractéristique du husky)
        this.ctx.fillStyle = huskyWhite;
        // Bande centrale blanche sur le front
        this.ctx.fillRect(px + 14, py + 8, 8, 6);
        // Zones blanches autour des yeux
        this.ctx.fillRect(px + 10, py + 12, 8, 5);
        this.ctx.fillRect(px + 18, py + 12, 8, 5);

        // Yeux bleus caractéristiques du husky
        this.ctx.fillStyle = huskyWhite;
        this.ctx.fillRect(px + 11, py + 12, 6, 5);
        this.ctx.fillRect(px + 19, py + 12, 6, 5);

        this.ctx.fillStyle = huskyBlue;
        const eyeOffset = this.player.direction === 'right' ? 2 :
                         this.player.direction === 'left' ? -2 : 0;
        this.ctx.fillRect(px + 12 + eyeOffset, py + 13, 4, 3);
        this.ctx.fillRect(px + 20 + eyeOffset, py + 13, 4, 3);

        // Pupilles noires
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px + 13 + eyeOffset, py + 14, 2, 2);
        this.ctx.fillRect(px + 21 + eyeOffset, py + 14, 2, 2);

        // Reflets dans les yeux
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(px + 14 + eyeOffset, py + 13, 1, 1);
        this.ctx.fillRect(px + 22 + eyeOffset, py + 13, 1, 1);

        // Museau blanc
        this.ctx.fillStyle = huskyWhite;
        this.ctx.fillRect(px + 12, py + 17, 12, 6);

        // Nez noir
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px + 15, py + 18, 6, 4);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(px + 16, py + 19, 4, 2);

        // Corps (gris foncé sur le dos)
        this.ctx.fillStyle = huskyGrayDark;
        this.ctx.fillRect(px + 9, py + 24, 18, 8);

        // Ventre blanc
        this.ctx.fillStyle = huskyWhite;
        this.ctx.fillRect(px + 12, py + 26, 12, 6);

        // Pattes grises avec extrémités blanches
        const legOffset = this.player.animFrame * 2;

        if (this.player.direction === 'down' || this.player.direction === 'up') {
            // Pattes grises
            this.ctx.fillStyle = huskyGray;
            this.ctx.fillRect(px + 10, py + 32 - legOffset, 6, 5);
            this.ctx.fillRect(px + 20, py + 32 + legOffset, 6, 5);
            // Extrémités blanches
            this.ctx.fillStyle = huskyWhite;
            this.ctx.fillRect(px + 10, py + 35 - legOffset, 6, 2);
            this.ctx.fillRect(px + 20, py + 35 + legOffset, 6, 2);
        } else {
            this.ctx.fillStyle = huskyGray;
            this.ctx.fillRect(px + 10, py + 32, 6, 5);
            this.ctx.fillRect(px + 20, py + 32, 6, 5);
            this.ctx.fillStyle = huskyWhite;
            this.ctx.fillRect(px + 10, py + 35, 6, 2);
            this.ctx.fillRect(px + 20, py + 35, 6, 2);
        }

        // Queue touffue de husky (gris avec bout blanc)
        const tailWag = Math.sin(Date.now() * 0.008 + legOffset) * 2;
        if (this.player.direction === 'left') {
            this.ctx.fillStyle = huskyGrayDark;
            this.ctx.fillRect(px + 27, py + 24 + tailWag, 8, 4);
            this.ctx.fillStyle = huskyWhite;
            this.ctx.fillRect(px + 32, py + 25 + tailWag, 3, 2);
        } else if (this.player.direction === 'right') {
            this.ctx.fillStyle = huskyGrayDark;
            this.ctx.fillRect(px + 1, py + 24 + tailWag, 8, 4);
            this.ctx.fillStyle = huskyWhite;
            this.ctx.fillRect(px + 1, py + 25 + tailWag, 3, 2);
        } else {
            // Queue enroulée vers le haut (typique husky)
            this.ctx.fillStyle = huskyGrayDark;
            this.ctx.fillRect(px + 14, py + 30 + Math.abs(tailWag), 8, 5);
            this.ctx.fillStyle = huskyWhite;
            this.ctx.fillRect(px + 16, py + 33 + Math.abs(tailWag), 4, 2);
        }
    }

    drawUI() {
        const pixelSize = 2; // Taille d'un "pixel" du cœur
        const heartSpacing = 36;
        const hearts = Math.ceil(this.player.maxHealth / 4);

        // Pattern du cœur en pixel art (13x11 pixels)
        // 0 = transparent, 1 = contour noir, 2 = rouge foncé, 3 = rouge moyen, 4 = rouge clair
        const heartPatternFull = [
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [0,1,4,4,3,1,0,1,4,4,3,1,0],
            [1,4,4,4,3,3,1,3,4,4,3,2,1],
            [1,4,4,4,3,3,3,3,3,3,3,2,1],
            [1,4,4,3,3,3,3,3,3,3,2,2,1],
            [1,4,3,3,3,3,3,3,3,2,2,2,1],
            [0,1,3,3,3,3,3,3,2,2,2,1,0],
            [0,0,1,3,3,3,3,2,2,2,1,0,0],
            [0,0,0,1,3,3,2,2,2,1,0,0,0],
            [0,0,0,0,1,2,2,2,1,0,0,0,0],
            [0,0,0,0,0,1,1,1,0,0,0,0,0]
        ];

        const heartPatternHalf = [
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [0,1,4,4,3,1,0,1,5,5,5,1,0],
            [1,4,4,4,3,3,1,5,5,5,5,5,1],
            [1,4,4,4,3,3,3,5,5,5,5,5,1],
            [1,4,4,3,3,3,3,5,5,5,5,5,1],
            [1,4,3,3,3,3,3,5,5,5,5,5,1],
            [0,1,3,3,3,3,3,5,5,5,5,1,0],
            [0,0,1,3,3,3,3,5,5,5,1,0,0],
            [0,0,0,1,3,3,5,5,5,1,0,0,0],
            [0,0,0,0,1,2,5,5,1,0,0,0,0],
            [0,0,0,0,0,1,1,1,0,0,0,0,0]
        ];

        const heartPatternEmpty = [
            [0,0,1,1,1,0,0,0,1,1,1,0,0],
            [0,1,5,5,5,1,0,1,5,5,5,1,0],
            [1,5,5,5,5,5,1,5,5,5,5,5,1],
            [1,5,5,5,5,5,5,5,5,5,5,5,1],
            [1,5,5,5,5,5,5,5,5,5,5,5,1],
            [1,5,5,5,5,5,5,5,5,5,5,5,1],
            [0,1,5,5,5,5,5,5,5,5,5,1,0],
            [0,0,1,5,5,5,5,5,5,5,1,0,0],
            [0,0,0,1,5,5,5,5,5,1,0,0,0],
            [0,0,0,0,1,5,5,5,1,0,0,0,0],
            [0,0,0,0,0,1,1,1,0,0,0,0,0]
        ];

        const colors = {
            0: 'transparent',
            1: '#000000',      // Noir (contour)
            2: '#8B0000',      // Rouge très foncé
            3: '#DC143C',      // Rouge moyen
            4: '#FF6B6B',      // Rouge clair (highlights)
            5: '#3d3d3d'       // Gris foncé (vide)
        };

        for (let i = 0; i < hearts; i++) {
            const startX = 15 + i * heartSpacing;
            const startY = 15;

            const heartValue = i * 4;
            const isFull = this.player.health >= heartValue + 4;
            const isHalf = this.player.health >= heartValue + 2 && this.player.health < heartValue + 4;
            const isEmpty = this.player.health < heartValue + 2;

            let pattern;
            if (isEmpty) {
                pattern = heartPatternEmpty;
            } else if (isHalf) {
                pattern = heartPatternHalf;
            } else {
                pattern = heartPatternFull;
            }

            // Dessiner chaque pixel du cœur
            for (let row = 0; row < pattern.length; row++) {
                for (let col = 0; col < pattern[row].length; col++) {
                    const pixelValue = pattern[row][col];
                    if (pixelValue !== 0) {
                        this.ctx.fillStyle = colors[pixelValue];
                        this.ctx.fillRect(
                            startX + col * pixelSize,
                            startY + row * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }
        }

        // Affichage du niveau en haut à droite (style pixel art)
        this.drawLevel();

        // Affichage des effets actifs des potions
        this.drawActiveEffects();

        // Affichage du dialogue en cours
        if (this.currentDialogue) {
            this.ctx.font = 'bold 18px monospace';
            const lines = this.wrapText(this.currentDialogue, 500);
            const lineHeight = 25;
            const boxHeight = lines.length * lineHeight + 40;
            const boxWidth = 520;

            // Fond du dialogue
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(
                this.canvas.width / 2 - boxWidth / 2,
                this.canvas.height - boxHeight - 20,
                boxWidth,
                boxHeight
            );

            // Bordure dorée
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                this.canvas.width / 2 - boxWidth / 2,
                this.canvas.height - boxHeight - 20,
                boxWidth,
                boxHeight
            );

            // Texte du dialogue
            this.ctx.fillStyle = '#ffffff';
            lines.forEach((line, i) => {
                this.ctx.fillText(
                    line,
                    this.canvas.width / 2 - boxWidth / 2 + 20,
                    this.canvas.height - boxHeight + 10 + (i + 1) * lineHeight
                );
            });

            // Indication pour fermer
            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText(
                'Press E to close',
                this.canvas.width / 2 - boxWidth / 2 + 20,
                this.canvas.height - 30
            );
        }

        // Indicateur d'interaction
        let message = null;

        // Priorité 0: Coffre au trésor
        if (this.treasureChest && !this.treasureChest.opened && !this.insideHouse) {
            const distX = this.player.x - this.treasureChest.x;
            const distY = this.player.y - this.treasureChest.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < 2) {
                if (this.inventory['Treasure Key']) {
                    message = '🔑 Press E to open the treasure chest';
                } else {
                    message = '🔒 The chest is locked...';
                }
            }
        }

        // Priorité 1: PNJ (si pas de dialogue ouvert)
        if (this.nearNPC && !this.currentDialogue) {
            // Message spécial pour les boutiques
            if (this.nearNPC.type === 'blacksmith' && this.insideHouse && this.insideHouse.type === 'blacksmith') {
                message = 'Press E to shop';
            } else if (this.nearNPC.type === 'farmer' && this.insideHouse && this.insideHouse.type === 'farmer') {
                message = 'Press E to shop';
            } else if (this.nearNPC.type === 'doctor' && this.insideHouse && this.insideHouse.type === 'doctor') {
                message = 'Press E to shop';
            } else if (this.nearNPC.type === 'fisher' && this.insideHouse && this.insideHouse.type === 'fisher') {
                message = 'Press E to shop';
            } else if (this.nearNPC.type === 'merchant' && this.insideHouse && this.insideHouse.type === 'merchant') {
                message = 'Press E to shop';
            } else {
                const npcNames = {
                    'man': 'to villager',
                    'woman': 'to villager',
                    'child': 'to child',
                    'assistant': 'to assistant',
                    'farmer': 'to farmer',
                    'fisher': 'to fisherman',
                    'merchant': 'to merchant',
                    'elder': 'to elder',
                    'doctor': 'to doctor',
                    'blacksmith': 'to blacksmith',
                    'priest': 'to priest'
                };
                message = `Press E to talk ${npcNames[this.nearNPC.type] || 'to villager'}`;
            }
        }
        // Priorité 2: Maison
        else if (this.nearHouse && !this.currentDialogue) {
            if (this.insideHouse) {
                message = 'Press E to exit';
            } else {
                const houseNames = {
                    'player': 'your house',
                    'farmer': 'farmer\'s house',
                    'fisher': 'fish market',
                    'merchant': 'merchant\'s house',
                    'elder': 'elder\'s house',
                    'doctor': 'doctor\'s office',
                    'blacksmith': 'forge',
                    'church': 'church',
                    'villager1': 'villager\'s house',
                    'villager2': 'villager\'s house',
                    'villager3': 'villager\'s house'
                };
                message = `Press E to enter ${houseNames[this.nearHouse.type] || 'house'}`;
            }
        }
        // Priorité 3: Bateau
        else if (this.nearBoat && !this.currentDialogue) {
            message = this.currentIsland === 'main'
                ? 'Press E to travel to desert island'
                : 'Press E to return to main island';
        }

        // Afficher le message s'il y en a un
        if (message) {
            this.ctx.font = 'bold 20px monospace';
            const textWidth = this.ctx.measureText(message).width;

            // Fond
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(
                this.canvas.width / 2 - textWidth / 2 - 15,
                this.canvas.height / 2 - 40,
                textWidth + 30,
                45
            );

            // Bordure
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                this.canvas.width / 2 - textWidth / 2 - 15,
                this.canvas.height / 2 - 40,
                textWidth + 30,
                45
            );

            // Texte
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(
                message,
                this.canvas.width / 2 - textWidth / 2,
                this.canvas.height / 2 - 10
            );
        }

        // Affichage de la boutique
        if (this.shopMode && this.currentShop) {
            const shopWidth = 550;
            const shopHeight = 450;
            const shopX = this.canvas.width / 2 - shopWidth / 2;
            const shopY = this.canvas.height / 2 - shopHeight / 2;

            // Fond de la boutique (couleur selon le type)
            if (this.currentShop.type === 'blacksmith') {
                this.ctx.fillStyle = 'rgba(60, 60, 60, 0.95)'; // Gris foncé pour forgeron
            } else if (this.currentShop.type === 'doctor') {
                this.ctx.fillStyle = 'rgba(200, 50, 80, 0.95)'; // Rouge/rose pour médecin
            } else if (this.currentShop.type === 'merchant') {
                this.ctx.fillStyle = 'rgba(100, 50, 150, 0.95)'; // Violet/mauve pour marchand
            } else if (this.currentShop.type === 'fisher') {
                this.ctx.fillStyle = 'rgba(30, 100, 180, 0.95)'; // Bleu pour poissonnier
            } else {
                this.ctx.fillStyle = 'rgba(34, 139, 34, 0.95)'; // Vert pour le fermier
            }
            this.ctx.fillRect(shopX, shopY, shopWidth, shopHeight);

            // Bordure dorée
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);

            // Titre
            this.ctx.font = 'bold 26px monospace';
            this.ctx.fillStyle = '#ffd700';
            let title = '🌾 FARMER\'S SHOP 🌾';
            if (this.currentShop.type === 'blacksmith') {
                title = '⚒️ FORGE - ARMORY ⚒️';
            } else if (this.currentShop.type === 'doctor') {
                title = '⚕️ MEDICAL OFFICE ⚕️';
            } else if (this.currentShop.type === 'merchant') {
                title = '🔮 POTION SHOP 🔮';
            } else if (this.currentShop.type === 'fisher') {
                title = '🐟 FISH MARKET 🐟';
            }
            this.ctx.fillText(title, shopX + 30, shopY + 40);

            // Ligne séparatrice
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(shopX + 20, shopY + 55);
            this.ctx.lineTo(shopX + shopWidth - 20, shopY + 55);
            this.ctx.stroke();

            // Afficher l'argent
            this.ctx.font = 'bold 20px monospace';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`💰 Your money: ${this.money} coins`, shopX + 30, shopY + 90);

            // Liste des articles
            this.ctx.font = 'bold 20px monospace';
            this.ctx.fillStyle = '#ffffff';

            let yOffset = 130;
            this.currentShop.items.forEach((item, index) => {
                // Fond de l'item
                const canAfford = this.money >= item.price;
                this.ctx.fillStyle = canAfford ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(shopX + 30, shopY + yOffset - 22, shopWidth - 60, 38);

                // Bordure
                this.ctx.strokeStyle = canAfford ? '#ffffff' : '#666666';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(shopX + 30, shopY + yOffset - 22, shopWidth - 60, 38);

                // Texte de l'item
                this.ctx.fillStyle = canAfford ? '#ffffff' : '#888888';
                let itemText = `[${item.key}] ${item.name} - ${item.price}💰`;

                // Pour les armes, afficher l'icône
                if (this.currentShop.type === 'blacksmith' && item.icon) {
                    itemText = `[${item.key}] ${item.icon} ${item.name} - ${item.price}💰`;
                }

                this.ctx.fillText(itemText, shopX + 40, shopY + yOffset);

                yOffset += 50;
            });

            // Instructions
            this.ctx.font = '15px monospace';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('Press number to buy', shopX + 30, shopY + shopHeight - 45);
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText('Appuyez sur E pour fermer', shopX + 30, shopY + shopHeight - 20);
        }

        // Affichage du choix de récompense de level up
        if (this.levelUpChoice) {
            const boxWidth = 600;
            const boxHeight = 380;
            const boxX = this.canvas.width / 2 - boxWidth / 2;
            const boxY = this.canvas.height / 2 - boxHeight / 2;

            // Fond noir avec ombre
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 30;
            this.ctx.fillStyle = 'rgba(10, 10, 10, 0.98)';
            this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

            // Reset shadow
            this.ctx.shadowBlur = 0;

            // Bordure dorée épaisse
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 6;
            this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

            // Titre "LEVEL UP!"
            this.ctx.font = 'bold 42px monospace';
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('LEVEL UP!', boxX + boxWidth / 2 - 130, boxY + 57);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('LEVEL UP!', boxX + boxWidth / 2 - 132, boxY + 55);

            // Level reached
            this.ctx.font = 'bold 28px monospace';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`Level ${this.player.level} reached!`, boxX + boxWidth / 2 - 140, boxY + 100);

            // Instruction
            this.ctx.font = 'bold 20px monospace';
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText('Choose your reward:', boxX + boxWidth / 2 - 180, boxY + 145);

            // Option 1: Cœur
            const option1Y = boxY + 190;
            const option1Height = 70;

            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
            this.ctx.fillRect(boxX + 30, option1Y, boxWidth - 60, option1Height);
            this.ctx.strokeStyle = '#ff6666';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(boxX + 30, option1Y, boxWidth - 60, option1Height);

            this.ctx.font = 'bold 32px monospace';
            this.ctx.fillStyle = '#ff6666';
            this.ctx.fillText('❤️', boxX + 50, option1Y + 45);

            this.ctx.font = 'bold 24px monospace';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('+1 Heart', boxX + 100, option1Y + 30);
            this.ctx.font = '16px monospace';
            this.ctx.fillStyle = '#cccccc';
            this.ctx.fillText('Increases your max health', boxX + 100, option1Y + 55);

            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillText('[Press 1]', boxX + boxWidth - 220, option1Y + 45);

            // Option 2: Gems
            const option2Y = boxY + 280;
            const option2Height = 70;

            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
            this.ctx.fillRect(boxX + 30, option2Y, boxWidth - 60, option2Height);
            this.ctx.strokeStyle = '#66ccff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(boxX + 30, option2Y, boxWidth - 60, option2Height);

            this.ctx.font = 'bold 32px monospace';
            this.ctx.fillStyle = '#66ccff';
            this.ctx.fillText('💎', boxX + 50, option2Y + 45);

            this.ctx.font = 'bold 24px monospace';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('+2 Gems', boxX + 100, option2Y + 30);
            this.ctx.font = '16px monospace';
            this.ctx.fillStyle = '#cccccc';
            this.ctx.fillText('To buy special weapons', boxX + 100, option2Y + 55);

            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.fillText('[Press 2]', boxX + boxWidth - 220, option2Y + 45);
        }

        // Affichage de l'inventaire (touche TAB)
        if (this.showInventory) {
            const invWidth = 520;
            const invHeight = 680;
            const invX = this.canvas.width / 2 - invWidth / 2;
            const invY = this.canvas.height / 2 - invHeight / 2;

            // Fond de l'inventaire avec dégradé
            const gradient = this.ctx.createLinearGradient(invX, invY, invX, invY + invHeight);
            gradient.addColorStop(0, 'rgba(30, 30, 40, 0.98)');
            gradient.addColorStop(1, 'rgba(15, 15, 20, 0.98)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(invX, invY, invWidth, invHeight);

            // Ombre extérieure
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 10;

            // Bordure dorée double
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(invX, invY, invWidth, invHeight);

            this.ctx.strokeStyle = '#ffaa00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(invX + 3, invY + 3, invWidth - 6, invHeight - 6);

            // Reset shadow
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            // Titre avec ombre
            this.ctx.font = 'bold 28px monospace';
            this.ctx.fillStyle = '#000';
            this.ctx.fillText('🎒 INVENTORY 🎒', invX + 22, invY + 42);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎒 INVENTORY 🎒', invX + 20, invY + 40);

            // Ligne séparatrice principale
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(invX + 20, invY + 55);
            this.ctx.lineTo(invX + invWidth - 20, invY + 55);
            this.ctx.stroke();

            // Panneau argent avec fond
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
            this.ctx.fillRect(invX + 20, invY + 65, invWidth - 40, 40);
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(invX + 20, invY + 65, invWidth - 40, 40);

            this.ctx.font = 'bold 22px monospace';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`💰 Money: ${this.money} coins`, invX + 35, invY + 92);

            let yOffset = 130;

            // ====== Section ARMES ======
            this.ctx.font = 'bold 22px monospace';
            // Fond de section
            this.ctx.fillStyle = 'rgba(255, 136, 0, 0.2)';
            this.ctx.fillRect(invX + 20, yOffset - 5, invWidth - 40, 30);
            // Texte
            this.ctx.fillStyle = '#ff8800';
            this.ctx.fillText('⚔️ WEAPONS', invX + 30, yOffset + 18);
            yOffset += 35;

            // Ligne séparatrice armes
            this.ctx.strokeStyle = '#ff8800';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(invX + 30, yOffset);
            this.ctx.lineTo(invX + invWidth - 30, yOffset);
            this.ctx.stroke();
            yOffset += 25;

            const weaponsList = Object.entries(this.weapons);
            if (weaponsList.length === 0) {
                this.ctx.font = 'italic 16px monospace';
                this.ctx.fillStyle = '#777777';
                this.ctx.fillText('~ No weapons ~', invX + 40, yOffset);
                yOffset += 35;
            } else {
                this.ctx.font = 'bold 18px monospace';
                weaponsList.forEach(([weaponName, weaponData]) => {
                    const isEquipped = this.equippedWeapon === weaponName;

                    // Fond de l'arme avec effet
                    if (isEquipped) {
                        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
                    } else {
                        this.ctx.fillStyle = 'rgba(255, 136, 0, 0.08)';
                    }
                    this.ctx.fillRect(invX + 30, yOffset - 25, invWidth - 60, 45);

                    // Bordure
                    this.ctx.strokeStyle = isEquipped ? '#00ff00' : '#ff8800';
                    this.ctx.lineWidth = isEquipped ? 3 : 2;
                    this.ctx.strokeRect(invX + 30, yOffset - 25, invWidth - 60, 45);

                    // Icône de l'arme (grande)
                    this.ctx.font = 'bold 28px monospace';
                    this.ctx.fillStyle = isEquipped ? '#00ff00' : '#ffaa00';
                    this.ctx.fillText(weaponData.icon, invX + 45, yOffset + 5);

                    // Nom de l'arme
                    this.ctx.font = 'bold 18px monospace';
                    this.ctx.fillStyle = isEquipped ? '#00ff00' : '#ffffff';
                    this.ctx.fillText(weaponName, invX + 90, yOffset);

                    // Badge ÉQUIPÉ
                    if (isEquipped) {
                        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                        this.ctx.fillRect(invX + invWidth - 150, yOffset - 15, 100, 25);
                        this.ctx.strokeStyle = '#00ff00';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(invX + invWidth - 150, yOffset - 15, 100, 25);

                        this.ctx.font = 'bold 14px monospace';
                        this.ctx.fillStyle = '#00ff00';
                        this.ctx.fillText('✓ ÉQUIPÉ', invX + invWidth - 140, yOffset + 2);
                    }

                    yOffset += 55;
                });
            }

            // ====== Section RESSOURCES/NOURRITURE ======
            yOffset += 15;
            this.ctx.font = 'bold 22px monospace';
            // Fond de section
            this.ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
            this.ctx.fillRect(invX + 20, yOffset - 5, invWidth - 40, 30);
            // Texte
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillText('🍎 HEAL', invX + 30, yOffset + 18);
            yOffset += 35;

            // Ligne séparatrice nourriture
            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(invX + 30, yOffset);
            this.ctx.lineTo(invX + invWidth - 30, yOffset);
            this.ctx.stroke();
            yOffset += 25;

            const foodItems = Object.entries(this.food);
            if (foodItems.length === 0) {
                this.ctx.font = 'italic 16px monospace';
                this.ctx.fillStyle = '#777777';
                this.ctx.fillText('~ No food ~', invX + 40, yOffset);
                yOffset += 35;
            } else {
                this.ctx.font = 'bold 17px monospace';
                foodItems.forEach(([itemName, quantity], index) => {
                    // Icône et effet selon le type d'objet
                    let icon = '🍽️';
                    let healAmount = 0;

                    // Food
                    if (itemName.includes('tomato') || itemName.includes('Tomato')) {
                        icon = '🍅';
                        healAmount = 0.25; // 1/4 heart
                    }
                    if (itemName.includes('carrot') || itemName.includes('Carrot')) {
                        icon = '🥕';
                        healAmount = 0.25; // 1/4 heart
                    }
                    if (itemName.includes('Basket') && itemName.includes('Vegetable')) {
                        icon = '🧺';
                        healAmount = 0.5; // 1/2 heart
                    }

                    // Poissons
                    if (itemName === 'Fish') {
                        icon = '🐟';
                        healAmount = 0.25; // 1/4 heart
                    }
                    if (itemName === 'Salmon') {
                        icon = '🐠';
                        healAmount = 0.5; // 1/2 heart
                    }
                    if (itemName.includes('Basket') && itemName.includes('Fish')) {
                        icon = '🧺';
                        healAmount = 0.75; // 3/4 heart
                    }

                    // Objets médicaux
                    if (itemName === 'Bandage') {
                        icon = '🩹';
                        healAmount = 1; // 1 cœur
                    }
                    if (itemName === 'Medical Kit') {
                        icon = '💊';
                        healAmount = 2; // 2 hearts
                    }

                    // Fond de l'item
                    this.ctx.fillStyle = 'rgba(0, 255, 100, 0.08)';
                    this.ctx.fillRect(invX + 30, yOffset - 25, invWidth - 60, 45);

                    // Bordure
                    this.ctx.strokeStyle = '#00ff88';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(invX + 30, yOffset - 25, invWidth - 60, 45);

                    // Icône (grande)
                    this.ctx.font = 'bold 28px monospace';
                    this.ctx.fillStyle = '#00ffaa';
                    this.ctx.fillText(icon, invX + 45, yOffset + 5);

                    // Nom de l'objet
                    this.ctx.font = 'bold 17px monospace';
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillText(`[${index + 1}] ${itemName}`, invX + 90, yOffset - 5);

                    // Effet de soin
                    if (healAmount > 0) {
                        this.ctx.font = '13px monospace';
                        this.ctx.fillStyle = '#ff6666';
                        this.ctx.fillText(`❤️ +${healAmount}`, invX + 90, yOffset + 12);
                    }

                    // Badge quantité
                    this.ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
                    this.ctx.fillRect(invX + invWidth - 120, yOffset - 15, 80, 25);
                    this.ctx.strokeStyle = '#00ff88';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(invX + invWidth - 120, yOffset - 15, 80, 25);

                    this.ctx.font = 'bold 16px monospace';
                    this.ctx.fillStyle = '#00ffaa';
                    this.ctx.fillText(`x${quantity}`, invX + invWidth - 100, yOffset + 2);

                    yOffset += 55;
                });
            }

            // ====== Section OBJETS ======
            yOffset += 15;
            this.ctx.font = 'bold 22px monospace';
            // Fond de section
            this.ctx.fillStyle = 'rgba(170, 100, 255, 0.2)';
            this.ctx.fillRect(invX + 20, yOffset - 5, invWidth - 40, 30);
            // Texte
            this.ctx.fillStyle = '#aa66ff';
            this.ctx.fillText('📦 ITEMS', invX + 30, yOffset + 18);
            yOffset += 35;

            // Ligne séparatrice objets
            this.ctx.strokeStyle = '#aa66ff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(invX + 30, yOffset);
            this.ctx.lineTo(invX + invWidth - 30, yOffset);
            this.ctx.stroke();
            yOffset += 25;

            const items = Object.entries(this.inventory);
            if (items.length === 0) {
                this.ctx.font = 'italic 16px monospace';
                this.ctx.fillStyle = '#777777';
                this.ctx.fillText('~ No items ~', invX + 40, yOffset);
            } else {
                // Calculer l'index global en tenant compte des items de nourriture
                const foodItemsCount = Object.entries(this.food).length;

                this.ctx.font = 'bold 17px monospace';
                items.forEach(([itemName, quantity], index) => {
                    // Déterminer l'icône selon le type d'objet
                    let icon = '📦';
                    let isPotion = false;

                    // Potions magiques
                    if (itemName === 'Speed Potion') {
                        icon = '⚡';
                        isPotion = true;
                    } else if (itemName === 'Invisibility Potion') {
                        icon = '👻';
                        isPotion = true;
                    } else if (itemName === 'Strength Potion') {
                        icon = '💪';
                        isPotion = true;
                    } else if (itemName === 'Invincibility Potion') {
                        icon = '💫';
                        isPotion = true;
                    } else if (itemName === 'Treasure Key') {
                        icon = '🔑';
                    }

                    // Index global (après les items de nourriture)
                    const globalIndex = foodItemsCount + index + 1;

                    // Fond de l'item
                    this.ctx.fillStyle = 'rgba(170, 100, 255, 0.08)';
                    this.ctx.fillRect(invX + 30, yOffset - 25, invWidth - 60, 45);

                    // Bordure
                    this.ctx.strokeStyle = '#aa66ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(invX + 30, yOffset - 25, invWidth - 60, 45);

                    // Icône
                    this.ctx.font = 'bold 28px monospace';
                    this.ctx.fillStyle = isPotion ? '#ffaa66' : '#bb88ff';
                    this.ctx.fillText(icon, invX + 45, yOffset + 5);

                    // Nom de l'objet (avec numéro si potion)
                    this.ctx.font = 'bold 17px monospace';
                    this.ctx.fillStyle = '#ffffff';
                    if (isPotion) {
                        this.ctx.fillText(`[${globalIndex}] ${itemName}`, invX + 90, yOffset);
                    } else {
                        this.ctx.fillText(itemName, invX + 90, yOffset);
                    }

                    // Badge quantité
                    this.ctx.fillStyle = 'rgba(170, 100, 255, 0.3)';
                    this.ctx.fillRect(invX + invWidth - 120, yOffset - 15, 80, 25);
                    this.ctx.strokeStyle = '#aa66ff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(invX + invWidth - 120, yOffset - 15, 80, 25);

                    this.ctx.font = 'bold 16px monospace';
                    this.ctx.fillStyle = '#bb88ff';
                    this.ctx.fillText(`x${quantity}`, invX + invWidth - 100, yOffset + 2);

                    yOffset += 55;
                });
            }

            // Instructions avec fond
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(invX + 20, invY + invHeight - 70, invWidth - 40, 50);

            this.ctx.font = '14px monospace';
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillText('🍎 Number: Use food/potions', invX + 30, invY + invHeight - 45);
            this.ctx.fillStyle = '#aaaaaa';
            this.ctx.fillText('⌨️  TAB: Close inventory', invX + 30, invY + invHeight - 25);
        }
    }

    drawLevel() {
        // Affichage du niveau en pixel art en haut à droite
        const pixelSize = 3; // Pixels plus gros pour meilleure visibilité
        const startX = this.canvas.width - 150; // Position en haut à droite (décalé pour la taille)
        const startY = 18;

        // Texte "NIV" en pixel art (pattern 3x5 pixels par lettre)
        const nivPattern = {
            'N': [
                [1,0,0,0,1],
                [1,1,0,0,1],
                [1,0,1,0,1],
                [1,0,0,1,1],
                [1,0,0,0,1]
            ],
            'I': [
                [0,1,1,1,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,1,1,1,0]
            ],
            'V': [
                [1,0,0,0,1],
                [1,0,0,0,1],
                [0,1,0,1,0],
                [0,1,0,1,0],
                [0,0,1,0,0]
            ]
        };

        // Chiffres en pixel art (5x5 pixels par chiffre)
        const numberPatterns = {
            '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
            '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
            '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,1,1,1,1]],
            '3': [[1,1,1,1,0],[0,0,0,1,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
            '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,1,1,1,1],[0,0,0,1,0]],
            '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
            '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
            '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
            '8': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
            '9': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,1,1,1,0]]
        };

        let xOffset = startX;

        // Dessiner "NIV"
        ['N', 'I', 'V'].forEach((letter, letterIndex) => {
            const pattern = nivPattern[letter];
            for (let row = 0; row < pattern.length; row++) {
                for (let col = 0; col < pattern[row].length; col++) {
                    if (pattern[row][col] === 1) {
                        this.ctx.fillStyle = '#000000';
                        this.ctx.fillRect(
                            xOffset + col * pixelSize,
                            startY + row * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }
            xOffset += 5 * pixelSize + 2; // Espacement entre lettres
        });

        // Espace avant le numéro
        xOffset += 4;

        // Dessiner le niveau (nombre)
        const levelStr = this.player.level.toString();
        levelStr.split('').forEach((digit, digitIndex) => {
            const pattern = numberPatterns[digit];
            for (let row = 0; row < pattern.length; row++) {
                for (let col = 0; col < pattern[row].length; col++) {
                    if (pattern[row][col] === 1) {
                        this.ctx.fillStyle = '#000000';
                        this.ctx.fillRect(
                            xOffset + col * pixelSize,
                            startY + row * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }
            xOffset += 5 * pixelSize + 2; // Espacement entre chiffres
        });

        // Afficher les gemmes en dessous du niveau
        if (this.player.gems > 0) {
            this.ctx.font = 'bold 18px monospace';
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(`💎 ${this.player.gems}`, startX, startY + 34);
        }
    }

    drawActiveEffects() {
        // Afficher les effets de potions actifs en haut à droite, sous le niveau
        const startX = this.canvas.width - 150;
        let startY = 60; // Commence sous le niveau et les gemmes

        const effectsInfo = [
            { name: 'speed', icon: '⚡', color: '#ffff00', label: 'Vitesse' },
            { name: 'invisibility', icon: '👻', color: '#9999ff', label: 'Invisible' },
            { name: 'strength', icon: '💪', color: '#ff6666', label: 'Force' },
            { name: 'invincibility', icon: '💫', color: '#00ffff', label: 'Invincible' }
        ];

        effectsInfo.forEach(effectInfo => {
            const effect = this.activeEffects[effectInfo.name];

            if (effect.active) {
                // Fond semi-transparent
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(startX, startY - 18, 140, 24);

                // Bordure colorée selon l'effet
                this.ctx.strokeStyle = effectInfo.color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(startX, startY - 18, 140, 24);

                // Icône de l'effet
                this.ctx.font = 'bold 18px monospace';
                this.ctx.fillStyle = effectInfo.color;
                this.ctx.fillText(effectInfo.icon, startX + 5, startY);

                // Timer ou compteur
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillStyle = '#ffffff';

                if (effectInfo.name === 'invincibility') {
                    // Show number of hits remaining
                    this.ctx.fillText(`${effect.hitsRemaining} hits`, startX + 30, startY);
                } else {
                    // Afficher le temps restant en secondes
                    const secondsLeft = Math.ceil(effect.duration / 60);
                    this.ctx.fillText(`${secondsLeft}s`, startX + 30, startY);
                }

                // Barre de progression pour les effets à durée
                if (effect.duration !== undefined) {
                    const barWidth = 60;
                    const barHeight = 4;
                    const barX = startX + 70;
                    const barY = startY - 8;
                    const progress = effect.duration / effect.maxDuration;

                    // Fond de la barre
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.fillRect(barX, barY, barWidth, barHeight);

                    // Barre de progression
                    this.ctx.fillStyle = effectInfo.color;
                    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                    // Contour
                    this.ctx.strokeStyle = effectInfo.color;
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
                }

                startY += 28; // Espacement entre les effets
            }
        });
    }

    gainXP(amount) {
        // Ajouter de l'XP au joueur
        this.player.xp += amount;

        // Message de gain d'XP
        this.currentDialogue = `+${amount} XP !`;
        this.dialogueTimer = 0;

        // Vérifier si le joueur monte de niveau
        if (this.player.xp >= this.player.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        // Monter de niveau
        this.player.level++;
        this.player.xp = this.player.xp - this.player.xpToNextLevel;
        this.player.xpToNextLevel = Math.floor(this.player.xpToNextLevel * 1.5); // XP nécessaire augmente de 50%

        // Afficher le choix de récompense
        this.levelUpChoice = true;
        this.currentDialogue = null; // Fermer les autres dialogues
    }

    chooseLevelUpReward(choice) {
        // Appliquer la récompense choisie
        if (choice === 'heart') {
            this.player.maxHealth += 4; // +1 cœur (4 points)
            this.player.health = this.player.maxHealth; // Restaurer toute la vie
            this.currentDialogue = `Level ${this.player.level}! +1 ❤️ (max health increased)`;
        } else if (choice === 'gems') {
            this.player.gems += 2; // +2 gems
            this.currentDialogue = `Level ${this.player.level}! +2 💎 (gems obtained)`;
        }

        this.dialogueTimer = 0;
        this.levelUpChoice = false;
    }

    getHouseTypeAtPosition(x, y) {
        // Trouver à quelle maison appartient cette position
        for (const house of this.houses) {
            if (x >= house.x - 1 && x < house.x + house.width - 1 &&
                y >= house.y - 1 && y < house.y + house.height - 1) {
                return house.type;
            }
        }
        return null;
    }

    getHouseColor(houseType) {
        const houseColors = {
            'player': '#FFD700',        // Or/Jaune (Votre maison)
            'farmer': '#32CD32',        // Vert lime (Agriculture)
            'fisher': '#00CED1',        // Turquoise (Eau/Poisson)
            'merchant': '#FF8C00',      // Orange foncé (Commerce)
            'elder': '#9370DB',         // Violet (Sagesse)
            'doctor': '#FF1493',        // Rose vif (Médical)
            'blacksmith': '#696969',    // Gris foncé (Métal/Forge)
            'church': '#FFFFFF',        // Blanc (Spirituel)
            'villager1': '#1E90FF',     // Bleu Dodger (bien distinct)
            'villager2': '#FF4500',     // Rouge-Orange vif (bien distinct)
            'villager3': '#ADFF2F'      // Vert jaune (bien distinct)
        };
        return houseColors[houseType] || '#8B4513';
    }

    drawFullMap() {
        const scaleX = this.canvas.width / this.mapWidth;
        const scaleY = this.canvas.height / this.mapHeight;
        const scale = Math.min(scaleX, scaleY) * 0.75; // Réduit pour laisser place à la légende

        const offsetX = 50; // Décalé à droite pour la légende
        const offsetY = (this.canvas.height - this.mapHeight * scale) / 2;

        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(offsetX - 3, offsetY - 3,
                           this.mapWidth * scale + 6,
                           this.mapHeight * scale + 6);

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.map[y][x];
                const px = offsetX + x * scale;
                const py = offsetY + y * scale;

                // Pour les maisons, utiliser la couleur selon le type
                if (tile === 3) {
                    const houseType = this.getHouseTypeAtPosition(x, y);
                    this.ctx.fillStyle = this.getHouseColor(houseType);
                } else {
                    switch(tile) {
                        case 0: this.ctx.fillStyle = '#3a7d44'; break; // Herbe
                        case 1: this.ctx.fillStyle = '#c9b590'; break; // Chemin
                        case 2: this.ctx.fillStyle = '#228B22'; break; // Arbre
                        case 4: this.ctx.fillStyle = '#4169E1'; break; // Eau
                        case 5: this.ctx.fillStyle = '#ff69b4'; break; // Fleurs
                        case 6: this.ctx.fillStyle = '#808080'; break; // Rocher
                        case 7: this.ctx.fillStyle = '#A0791A'; break; // Dock
                        case 8: this.ctx.fillStyle = '#a52a2a'; break; // Lit
                        case 9: this.ctx.fillStyle = '#8b4513'; break; // Table
                        case 10: this.ctx.fillStyle = '#654321'; break; // Chaise
                        case 11: this.ctx.fillStyle = '#ffd700'; break; // Coffre
                        case 12: this.ctx.fillStyle = '#696969'; break; // Établi
                        case 13: this.ctx.fillStyle = '#654321'; break; // Bibliothèque
                        case 14: this.ctx.fillStyle = '#cd853f'; break; // Comptoir
                        case 15: this.ctx.fillStyle = '#8b0000'; break; // Canapé
                        case 16: this.ctx.fillStyle = '#654321'; break; // Étagère marchandises
                        case 17: this.ctx.fillStyle = '#c0c0c0'; break; // Poisson accroché
                        case 18: this.ctx.fillStyle = '#ff6347'; break; // Cagette tomates
                        case 19: this.ctx.fillStyle = '#8b4513'; break; // Baril
                        case 20: this.ctx.fillStyle = '#e0f7fa'; break; // Étal poissons
                        case 21: this.ctx.fillStyle = '#ff8c00'; break; // Cagette carottes
                        case 22: this.ctx.fillStyle = '#696969'; break; // Enclume
                        case 23: this.ctx.fillStyle = '#ff4500'; break; // Forge
                        case 24: this.ctx.fillStyle = '#9370db'; break; // Étagère potions
                        case 25: this.ctx.fillStyle = '#f5f5f5'; break; // Lit médical
                        case 26: this.ctx.fillStyle = '#ffd700'; break; // Autel
                        case 27: this.ctx.fillStyle = '#654321'; break; // Banc église
                        case 28: this.ctx.fillStyle = '#4682b4'; break; // Fontaine
                        case 29: this.ctx.fillStyle = '#8b4513'; break; // Banc public
                        case 30: this.ctx.fillStyle = '#c0c0c0'; break; // Pavé
                        case 31: this.ctx.fillStyle = '#ffdb58'; break; // Lampadaire
                        case 32: this.ctx.fillStyle = '#ff6347'; break; // Champ tomates
                        case 33: this.ctx.fillStyle = '#32cd32'; break; // Champ carottes
                        case 34: this.ctx.fillStyle = '#6b4423'; break; // Terre labourée
                        default: this.ctx.fillStyle = '#3a7d44'; break; // Par défaut herbe
                    }
                }

                this.ctx.fillRect(px, py, Math.max(1, scale), Math.max(1, scale));
            }
        }

        // Dessiner la légende sur le côté droit
        this.drawMapLegend(offsetX + this.mapWidth * scale + 20, offsetY);

        // PNJ sur la map (en blanc pour les différencier du joueur)
        this.npcs.forEach(npc => {
            // Contour noir
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + npc.x * scale,
                offsetY + npc.y * scale,
                scale * 0.8 + 1,
                0, Math.PI * 2
            );
            this.ctx.fill();

            // Point blanc
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + npc.x * scale,
                offsetY + npc.y * scale,
                scale * 0.8,
                0, Math.PI * 2
            );
            this.ctx.fill();
        });

        // Joueur
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(
            offsetX + this.player.x * scale,
            offsetY + this.player.y * scale,
            scale * 1.5 + 2,
            0, Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(
            offsetX + this.player.x * scale,
            offsetY + this.player.y * scale,
            scale * 1.5,
            0, Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText('Appuyez sur M pour fermer', this.canvas.width / 2 + 2, 32);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText('Appuyez sur M pour fermer', this.canvas.width / 2, 30);

        this.ctx.textAlign = 'left';
    }

    drawMapLegend(startX, startY) {
        const houseInfo = [
            { type: 'player', name: 'Votre maison' },
            { type: 'farmer', name: 'Fermier' },
            { type: 'fisher', name: 'Poissonnier' },
            { type: 'merchant', name: 'Marchand' },
            { type: 'elder', name: 'Ancien' },
            { type: 'doctor', name: 'Médecin' },
            { type: 'blacksmith', name: 'Forgeron' },
            { type: 'church', name: 'Église' },
            { type: 'villager1', name: 'Villageois 1' },
            { type: 'villager2', name: 'Villageois 2' },
            { type: 'villager3', name: 'Villageois 3' }
        ];

        // Titre de la légende
        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText('LÉGENDE', startX, startY);

        // Ligne sous le titre
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY + 5);
        this.ctx.lineTo(startX + 180, startY + 5);
        this.ctx.stroke();

        // Afficher chaque maison avec sa couleur
        this.ctx.font = '13px monospace';
        houseInfo.forEach((house, index) => {
            const y = startY + 30 + index * 25;

            // Carré de couleur
            this.ctx.fillStyle = this.getHouseColor(house.type);
            this.ctx.fillRect(startX, y - 10, 15, 15);

            // Bordure du carré
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(startX, y - 10, 15, 15);

            // Nom de la maison
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(house.name, startX + 22, y + 2);
        });

        // Autres symboles utiles
        const legendY = startY + 30 + houseInfo.length * 25 + 20;

        // Séparateur
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, legendY - 10);
        this.ctx.lineTo(startX + 180, legendY - 10);
        this.ctx.stroke();

        // Vous (point jaune)
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(startX + 7, legendY + 5, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Vous', startX + 22, legendY + 10);

        // PNJ (point blanc)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(startX + 7, legendY + 30, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillText('PNJ', startX + 22, legendY + 35);
    }

    // Fonctions utilitaires pour les couleurs
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}

// Démarrer le jeu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.zeldaGame = new ZeldaGame();
    });
} else {
    window.zeldaGame = new ZeldaGame();
}
