// ========================================
// GAME - Main orchestrator with deltaTime loop
// ========================================
import {
    TILE_SIZE, VIEWPORT_TILES_X, VIEWPORT_TILES_Y,
    MAP_WIDTH, MAP_HEIGHT, PLAYER_DEFAULTS,
    DIALOGUE_TIMEOUT, INTRO_DIALOGUES,
    QUICK_HEAL_HOLD_THRESHOLD,
    TIME_SPEED, DAWN_START, DAWN_END, DUSK_END,
    CAMERA_ZOOM_NORMAL
} from './constants.js';
import { handlePlayerMovement, handleJump, updatePlayerAnimation } from './player.js';
import { updateCamera } from './camera.js';
import { createMap } from './map.js';
import { createNPCs, updateNPCs, drawNPCs, checkNearNPC, drawIntroElder, createAnimals, updateAnimals, drawAnimals } from './npc.js';
import { createEnemies, createTreasureChest, updateEnemies, drawEnemies } from './enemy.js';
import { updateCombat, updatePotionEffects, performAttack } from './combat.js';
import { checkNearHouse, checkNearBed, checkNearChest, createHouseInterior } from './house.js';
import { createBoats, updateBoats, checkNearBoat } from './island.js';
import { drawMap, drawBoats, drawTreasureChest, drawPlayer, drawAttack, drawShield, drawNightOverlay, drawSleepAnimation } from './renderer.js';
import { drawUI, drawHelp, drawIntroDialogue, drawFullMap, drawTitleScreen } from './ui.js';
import { setupControls } from './input.js';
import { saveGame, loadGame, hasSaveData, deleteSaveData } from './save.js';

// ----------------------------------------
// Create initial game state
// ----------------------------------------
function createGameState(canvas, ctx) {
    const gs = {
        canvas,
        ctx,

        // Title screen
        showTitleScreen: true,
        titleScreenSelection: 0,

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
            smoothing: 0.12,
            zoom: CAMERA_ZOOM_NORMAL
        },

        // UI toggles
        showMinimap: false,
        showHelp: false,
        showInventory: false,
        inventoryTab: 0,  // 0=Weapons, 1=Food, 2=Items

        // Controls
        keys: {},
        mouse: { x: 0, y: 0, leftDown: false, rightDown: false, leftClick: false, rightClick: false },

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

        // Minimap cache
        minimapCache: null,
        minimapCacheIsland: null,

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
        dialoguePersist: false,

        // Quick heal
        quickHealPressed: false,
        quickHealTimer: 0,

        // Inventory & economy
        inventory: {},
        food: {},
        money: 10,
        shopMode: false,
        currentShop: null,

        // Weapons
        weapons: {},
        equippedWeapon: null,

        // Leveling
        levelUpChoice: false,
        levelUpOptions: ['heart', 'gems'],

        // Day/night cycle
        timeOfDay: 7.0,          // Start at 7 AM
        dayCount: 1,
        isNight: false,           // Derived from timeOfDay
        nearBed: false,
        sleepAnim: {
            active: false,
            phase: 0,
            timer: 0,
            fadeDuration: 90,
            messageDuration: 120,
            wasDaytime: false
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

        // Phase 0: Player starts in bed
        gs.introPhase = 0;
        gs.player.x = 3;
        gs.player.y = 3.5;
        gs.player.direction = 'down';

        // Elder not present yet (appears when door is opened)
        gs.introElder = null;
    }
}

// ----------------------------------------
// Start a new game (from title screen)
// ----------------------------------------
function startNewGame(gs) {
    deleteSaveData();

    // Generate world
    createMap(gs);
    createNPCs(gs);
    createAnimals(gs);
    createBoats(gs);
    createEnemies(gs);
    createTreasureChest(gs);

    // Starting equipment in storage chest
    gs.playerStorage['Wooden Sword'] = 1;
    gs.playerStorage['Wooden Shield'] = 1;

    // Setup controls
    setupControls(gs);

    // Start intro
    startIntro(gs);
}

// ----------------------------------------
// Continue saved game (from title screen)
// ----------------------------------------
function continueGame(gs) {
    // Generate world fresh
    createMap(gs);
    createNPCs(gs);
    createAnimals(gs);
    createBoats(gs);
    createEnemies(gs);
    createTreasureChest(gs);

    // Setup controls
    setupControls(gs);

    // Load saved state onto fresh world
    loadGame(gs);
}

// ----------------------------------------
// Setup title screen controls
// ----------------------------------------
function setupTitleScreenControls(gs) {
    const handler = (e) => {
        const key = e.key.toLowerCase();

        // Navigate up
        if (key === 'z' || key === 'arrowup') {
            gs.titleScreenSelection = 0;
            e.preventDefault();
        }

        // Navigate down
        if (key === 's' || key === 'arrowdown') {
            gs.titleScreenSelection = 1;
            e.preventDefault();
        }

        // Confirm selection
        if (key === 'enter' || key === 'e') {
            if (gs.titleScreenSelection === 0) {
                // New Game
                gs.showTitleScreen = false;
                window.removeEventListener('keydown', handler);
                startNewGame(gs);
            } else if (gs.titleScreenSelection === 1 && hasSaveData()) {
                // Continue
                gs.showTitleScreen = false;
                window.removeEventListener('keydown', handler);
                continueGame(gs);
            }
            e.preventDefault();
        }

        // Direct number keys
        if (key === '1') {
            gs.showTitleScreen = false;
            window.removeEventListener('keydown', handler);
            startNewGame(gs);
            e.preventDefault();
        }
        if (key === '2' && hasSaveData()) {
            gs.showTitleScreen = false;
            window.removeEventListener('keydown', handler);
            continueGame(gs);
            e.preventDefault();
        }
    };

    window.addEventListener('keydown', handler);
}

// ----------------------------------------
// Update game logic
// ----------------------------------------
function update(gs, dt) {
    // Advance time of day (skip during intro and sleep animation)
    if (!gs.introActive && !gs.sleepAnim.active) {
        gs.timeOfDay += TIME_SPEED * dt;
        if (gs.timeOfDay >= 24.0) {
            gs.timeOfDay -= 24.0;
            gs.dayCount++;
        }
        gs.isNight = (gs.timeOfDay >= DUSK_END || gs.timeOfDay < DAWN_START);
    }

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

    // Intro phase 1: auto-detect when player reaches the door
    if (gs.introActive && gs.introPhase === 1 && gs.player.y >= 11.5) {
        gs.introPhase = 2;
    }

    // Sleep animation state machine
    if (gs.sleepAnim.active) {
        const anim = gs.sleepAnim;
        anim.timer += dt;

        if (anim.phase === 1 && anim.timer >= anim.fadeDuration) {
            // Fade-to-black complete -> show message, advance to morning
            anim.phase = 2;
            anim.timer = 0;
            gs.timeOfDay = DAWN_END;  // Wake up at 7:00 AM
            gs.dayCount++;
            gs.isNight = false;
        } else if (anim.phase === 2 && anim.timer >= anim.messageDuration) {
            // Message shown -> fade from black
            anim.phase = 3;
            anim.timer = 0;
        } else if (anim.phase === 3 && anim.timer >= anim.fadeDuration) {
            // Fade-from-black complete -> done, auto-save
            anim.active = false;
            anim.phase = 0;
            anim.timer = 0;
            saveGame(gs);
        }
    }

    // Shield blocking (right mouse button only)
    const hasShield = (gs.weapons['Rusty Shield'] || gs.weapons['Wooden Shield']) && !gs.player.shieldBroken;
    gs.player.isBlocking = gs.mouse.rightDown && hasShield;

    // Mouse left-click attack
    if (gs.mouse.leftClick && !gs.player.isAttacking && !gs.introActive &&
        (gs.weapons['Rusty Sword'] || gs.weapons['Wooden Sword']) &&
        !gs.showInventory && !gs.shopMode && !gs.storageOpen && !gs.showHelp && !gs.showMinimap) {
        gs.player.isAttacking = true;
        gs.player.attackTimer = gs.player.attackDuration;
        performAttack(gs);
    }

    // Quick heal hold detection
    if (gs.quickHealPressed) {
        gs.quickHealTimer += dt;
        if (gs.quickHealTimer >= QUICK_HEAL_HOLD_THRESHOLD) {
            gs.quickHealPressed = false;
            gs.showInventory = true;
            gs.inventoryTab = 1; // Food tab
        }
    }

    // Dialogue timer
    if (gs.currentDialogue) {
        if (!gs.dialoguePersist) {
            gs.dialogueTimer += dt;
            if (gs.dialogueTimer > DIALOGUE_TIMEOUT) {
                gs.currentDialogue = null;
                gs.dialogueTimer = 0;
            }
        }
    }

}

// ----------------------------------------
// Draw everything
// ----------------------------------------
function draw(gs) {
    const ctx = gs.ctx;
    const zoom = gs.camera.zoom;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, gs.canvas.width, gs.canvas.height);

    if (gs.showMinimap) {
        drawFullMap(ctx, gs);
    } else {
        // World rendering with camera zoom
        ctx.save();
        ctx.scale(zoom, zoom);

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

        ctx.restore();

        // UI rendering (not zoomed)
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

    // Create game state (title screen mode)
    const gs = createGameState(canvas, ctx);

    // Setup title screen controls
    setupTitleScreenControls(gs);

    // DeltaTime game loop
    // dt normalized so 1.0 = one frame at 60fps
    let lastTime = performance.now();

    const gameLoop = (now) => {
        const dt = Math.min((now - lastTime) / 16.667, 3);
        lastTime = now;

        // Hide cursor during gameplay, show when a menu is open
        const menuOpen = gs.showTitleScreen || gs.showInventory || gs.shopMode ||
            gs.storageOpen || gs.showHelp || gs.showMinimap || gs.levelUpChoice;
        canvas.style.cursor = menuOpen ? 'default' : 'none';

        if (gs.showTitleScreen) {
            drawTitleScreen(ctx, gs);
        } else {
            update(gs, dt);
            draw(gs);
            // Reset mouse click pulses after both update and draw have consumed them
            gs.mouse.leftClick = false;
            gs.mouse.rightClick = false;
        }

        requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
}
