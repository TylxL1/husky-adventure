// ========================================
// GAME - Main orchestrator with deltaTime loop
// ========================================
import {
    TILE_SIZE, VIEWPORT_TILES_X, VIEWPORT_TILES_Y,
    MAP_WIDTH, MAP_HEIGHT, PLAYER_DEFAULTS,
    DIALOGUE_TIMEOUT, INTRO_DIALOGUES
} from './constants.js';
import { handlePlayerMovement, handleJump, updatePlayerAnimation } from './player.js';
import { updateCamera } from './camera.js';
import { createMap } from './map.js';
import { createNPCs, updateNPCs, drawNPCs, checkNearNPC, drawIntroElder, createAnimals, updateAnimals, drawAnimals } from './npc.js';
import { createEnemies, createTreasureChest, updateEnemies, drawEnemies } from './enemy.js';
import { updateCombat, updatePotionEffects } from './combat.js';
import { checkNearHouse, checkNearBed, checkNearChest, createHouseInterior } from './house.js';
import { createBoats, updateBoats, checkNearBoat } from './island.js';
import { drawMap, drawBoats, drawTreasureChest, drawPlayer, drawAttack, drawShield, drawNightOverlay, drawSleepAnimation } from './renderer.js';
import { drawUI, drawHelp, drawIntroDialogue, drawFullMap } from './ui.js';
import { setupControls } from './input.js';

// ----------------------------------------
// Create initial game state
// ----------------------------------------
function createGameState(canvas, ctx) {
    const gs = {
        canvas,
        ctx,

        // Config
        tileSize: TILE_SIZE,
        viewportTilesX: VIEWPORT_TILES_X,
        viewportTilesY: VIEWPORT_TILES_Y,
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,

        // Player
        player: { ...PLAYER_DEFAULTS },

        // Enemies
        enemies: [],

        // Intro system
        introActive: true,
        introPhase: 0,
        introDialogueIndex: 0,
        introDialogues: INTRO_DIALOGUES,
        introTimer: 0,
        introKeyReceived: false,
        introElder: null,

        // Treasure
        treasureChest: null,
        treasureFound: false,

        // Camera
        camera: {
            x: 0,
            y: 0,
            smoothing: 0.12
        },

        // UI toggles
        showMinimap: false,
        showHelp: false,
        showInventory: false,

        // Controls
        keys: {},

        // Map
        map: [],
        houses: [],
        npcs: [],
        animals: [],
        boats: [],
        portLocation: null,
        waterDirection: null,
        desertDockLocation: null,
        snowDockLocation: null,
        snowReturnDockLocation: null,

        // Island system
        currentIsland: 'main',
        savedMainIsland: null,
        savedMainPlayer: null,
        savedDesertIsland: null,
        savedDesertPlayer: null,
        nearBoat: null,

        // House system
        insideHouse: null,
        houseInterior: null,
        nearHouse: null,
        savedOutdoorState: null,
        savedOutdoorPosition: null,

        // Dialogue system
        nearNPC: null,
        currentDialogue: null,
        dialogueTimer: 0,

        // Inventory & economy
        inventory: {},
        food: {},
        money: 100,
        shopMode: false,
        currentShop: null,

        // Weapons
        weapons: {},
        equippedWeapon: null,

        // Leveling
        levelUpChoice: false,
        levelUpOptions: ['heart', 'gems'],

        // Day/night cycle
        isNight: false,
        nearBed: false,
        sleepAnim: {
            active: false,
            phase: 0,
            timer: 0,
            fadeDuration: 90,
            messageDuration: 120,
            targetIsNight: false
        },

        // Storage system
        nearChest: false,
        playerStorage: {},
        storageOpen: false,
        storageMode: 'deposit',

        // Potion effects
        activeEffects: {
            speed: { active: false, duration: 0, maxDuration: 600 },
            invisibility: { active: false, duration: 0, maxDuration: 480 },
            strength: { active: false, duration: 0, maxDuration: 600, bonus: 1.5 },
            invincibility: { active: false, hitsRemaining: 0, maxHits: 2 }
        }
    };

    return gs;
}

// ----------------------------------------
// Start intro sequence
// ----------------------------------------
function startIntro(gs) {
    const playerHouse = gs.houses.find(h => h.type === 'player');
    if (playerHouse) {
        // Save outdoor state
        gs.savedOutdoorState = {
            map: JSON.parse(JSON.stringify(gs.map)),
            npcs: JSON.parse(JSON.stringify(gs.npcs)),
            mapWidth: gs.mapWidth,
            mapHeight: gs.mapHeight
        };
        gs.savedOutdoorPosition = {
            x: playerHouse.x + 1,
            y: playerHouse.y + 3
        };

        // Enter player's house for intro
        gs.insideHouse = playerHouse;
        createHouseInterior(gs, 'player');

        // Position player inside house
        gs.player.x = 9;
        gs.player.y = 10;

        // Add elder NPC for intro
        gs.introElder = {
            x: 9,
            y: 5,
            type: 'elder',
            direction: 'down',
            animFrame: 0,
            animTimer: 0
        };
    }
}

// ----------------------------------------
// Update game logic
// ----------------------------------------
function update(gs, dt) {
    handlePlayerMovement(gs, dt);
    handleJump(gs, dt);
    updateCamera(gs);
    updatePlayerAnimation(gs, dt);
    updateNPCs(gs, dt);
    updateAnimals(gs, dt);
    updateBoats(gs, dt);
    updateEnemies(gs, dt);
    updateCombat(gs, dt);
    checkNearBoat(gs);
    checkNearHouse(gs);
    checkNearBed(gs);
    checkNearChest(gs);
    checkNearNPC(gs);
    updatePotionEffects(gs, dt);

    // Sleep animation state machine
    if (gs.sleepAnim.active) {
        const anim = gs.sleepAnim;
        anim.timer += dt;

        if (anim.phase === 1 && anim.timer >= anim.fadeDuration) {
            // Fade-to-black complete → show message, toggle day/night
            anim.phase = 2;
            anim.timer = 0;
            gs.isNight = anim.targetIsNight;
        } else if (anim.phase === 2 && anim.timer >= anim.messageDuration) {
            // Message shown → fade from black
            anim.phase = 3;
            anim.timer = 0;
        } else if (anim.phase === 3 && anim.timer >= anim.fadeDuration) {
            // Fade-from-black complete → done
            anim.active = false;
            anim.phase = 0;
            anim.timer = 0;
        }
    }

    // Dialogue timer
    if (gs.currentDialogue) {
        gs.dialogueTimer += dt;
        if (gs.dialogueTimer > DIALOGUE_TIMEOUT) {
            gs.currentDialogue = null;
            gs.dialogueTimer = 0;
        }
    }
}

// ----------------------------------------
// Draw everything
// ----------------------------------------
function draw(gs) {
    const ctx = gs.ctx;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, gs.canvas.width, gs.canvas.height);

    if (gs.showMinimap) {
        drawFullMap(ctx, gs);
    } else {
        drawMap(ctx, gs);
        drawBoats(ctx, gs);
        drawNPCs(ctx, gs);
        drawAnimals(ctx, gs);
        drawEnemies(ctx, gs);
        drawTreasureChest(ctx, gs);
        drawPlayer(ctx, gs);
        drawAttack(ctx, gs);
        drawShield(ctx, gs);
        drawNightOverlay(ctx, gs);
        drawIntroElder(ctx, gs);
        drawUI(ctx, gs);
        drawIntroDialogue(ctx, gs);
        drawHelp(ctx, gs);
        drawSleepAnimation(ctx, gs);
    }
}

// ----------------------------------------
// Initialize and start the game
// ----------------------------------------
export function initGame() {
    const canvas = document.getElementById('renderCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = TILE_SIZE * VIEWPORT_TILES_X;   // 960px
    canvas.height = TILE_SIZE * VIEWPORT_TILES_Y;   // 720px

    // Create game state
    const gs = createGameState(canvas, ctx);

    // Generate world
    createMap(gs);
    createNPCs(gs);
    createAnimals(gs);
    createBoats(gs);
    createEnemies(gs);
    createTreasureChest(gs);

    // Setup controls
    setupControls(gs);

    // Start intro
    startIntro(gs);

    // DeltaTime game loop
    // dt normalized so 1.0 = one frame at 60fps
    let lastTime = performance.now();

    const gameLoop = (now) => {
        const dt = Math.min((now - lastTime) / 16.667, 3);
        lastTime = now;

        update(gs, dt);
        draw(gs);

        requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
}
