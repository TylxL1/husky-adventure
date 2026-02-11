// ========================================
// HOUSE - Interiors, enter/exit, interactions
// ========================================
import {
    TILE_PATH, TILE_HOUSE,
    TILE_BED, TILE_TABLE, TILE_CHAIR, TILE_CHEST,
    TILE_WORKBENCH, TILE_BOOKSHELF, TILE_COUNTER, TILE_SOFA,
    TILE_SHELF, TILE_HANGING_FISH, TILE_VEGETABLE_CRATE, TILE_BARREL,
    TILE_FISH_STALL, TILE_CARROT_CRATE, TILE_ANVIL, TILE_FORGE,
    TILE_POTION_SHELF, TILE_MEDICAL_BED, TILE_ALTAR, TILE_CHURCH_PEW,
    INTERIOR_WIDTH, INTERIOR_HEIGHT
} from './constants.js';
import { saveGame } from './save.js';

// ----------------------------------------
// Check proximity to house doors
// ----------------------------------------
export function checkNearHouse(gs) {
    gs.nearHouse = null;

    // If inside, check exit proximity
    if (gs.insideHouse) {
        const doorX = 8.5;
        const doorY = 13;
        const doorDist = Math.sqrt(
            Math.pow(gs.player.x - doorX, 2) +
            Math.pow(gs.player.y - doorY, 2)
        );
        if (doorDist < 2) {
            gs.nearHouse = gs.insideHouse;
        }
        return;
    }

    // If outside, check house doors
    const interactionDistance = 1.5;
    gs.houses.forEach(house => {
        const distance = Math.sqrt(
            Math.pow(gs.player.x - house.doorX, 2) +
            Math.pow(gs.player.y - house.doorY, 2)
        );
        if (distance < interactionDistance) {
            gs.nearHouse = house;
        }
    });
}

// ----------------------------------------
// Check proximity to bed (player's house only)
// ----------------------------------------
export function checkNearBed(gs) {
    gs.nearBed = false;
    if (!gs.insideHouse || gs.insideHouse.type !== 'player') return;

    // Bed tiles at (2-3, 2-4), center ~(2.5, 3)
    const bedCenterX = 2.5;
    const bedCenterY = 3;
    const dist = Math.sqrt(
        Math.pow(gs.player.x - bedCenterX, 2) +
        Math.pow(gs.player.y - bedCenterY, 2)
    );
    if (dist < 2.5) {
        gs.nearBed = true;
    }
}

// ----------------------------------------
// Check proximity to chests (player's house only)
// ----------------------------------------
export function checkNearChest(gs) {
    gs.nearChest = false;
    if (!gs.insideHouse || gs.insideHouse.type !== 'player') return;

    // Chests at (14-16, 10), center ~(15, 10)
    const chestCenterX = 15;
    const chestCenterY = 10;
    const dist = Math.sqrt(
        Math.pow(gs.player.x - chestCenterX, 2) +
        Math.pow(gs.player.y - chestCenterY, 2)
    );
    if (dist < 2.5) {
        gs.nearChest = true;
    }
}

// ----------------------------------------
// Enter a house
// ----------------------------------------
export function enterHouse(gs, house) {
    // Save outdoor position
    gs.savedOutdoorPosition = {
        x: gs.player.x,
        y: gs.player.y
    };

    // Save outdoor state
    gs.savedOutdoorState = {
        map: JSON.parse(JSON.stringify(gs.map)),
        npcs: JSON.parse(JSON.stringify(gs.npcs)),
        mapWidth: gs.mapWidth,
        mapHeight: gs.mapHeight
    };

    // Create interior
    gs.insideHouse = house;
    createHouseInterior(gs, house.type);

    // Position player at entrance (for 18x14 interior)
    gs.player.x = 8.5;
    gs.player.y = 11;
}

// ----------------------------------------
// Exit a house
// ----------------------------------------
export function exitHouse(gs) {
    // Restore outdoor map
    gs.map = JSON.parse(JSON.stringify(gs.savedOutdoorState.map));
    gs.npcs = JSON.parse(JSON.stringify(gs.savedOutdoorState.npcs));
    gs.mapWidth = gs.savedOutdoorState.mapWidth;
    gs.mapHeight = gs.savedOutdoorState.mapHeight;

    // Restore player position
    gs.player.x = gs.savedOutdoorPosition.x;
    gs.player.y = gs.savedOutdoorPosition.y;

    gs.insideHouse = null;
    gs.houseInterior = null;

    saveGame(gs);
}

// ----------------------------------------
// Create house interior map
// ----------------------------------------
export function createHouseInterior(gs, type) {
    gs.map = [];

    // Initialize with floor
    for (let y = 0; y < INTERIOR_HEIGHT; y++) {
        gs.map[y] = [];
        for (let x = 0; x < INTERIOR_WIDTH; x++) {
            gs.map[y][x] = TILE_PATH; // Wood floor
        }
    }

    // Walls
    for (let x = 0; x < INTERIOR_WIDTH; x++) {
        gs.map[0][x] = TILE_HOUSE;
        gs.map[INTERIOR_HEIGHT - 1][x] = TILE_HOUSE;
    }
    for (let y = 0; y < INTERIOR_HEIGHT; y++) {
        gs.map[y][0] = TILE_HOUSE;
        gs.map[y][INTERIOR_WIDTH - 1] = TILE_HOUSE;
    }

    // Door at bottom center
    gs.map[INTERIOR_HEIGHT - 1][8] = TILE_PATH;
    gs.map[INTERIOR_HEIGHT - 1][9] = TILE_PATH;

    // Reset interior NPCs
    gs.npcs = [];

    // Shop types that close at night (no shopkeeper spawned)
    const shopTypes = ['farmer', 'fisher', 'merchant', 'doctor', 'blacksmith'];
    const isShopClosed = gs.isNight && shopTypes.includes(type);

    // Decorate based on house type
    switch (type) {
        case 'player':
            // Bed 2x3 (top left, medium-large)
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            gs.map[4][2] = TILE_BED; gs.map[4][3] = TILE_BED;
            // 2 bookshelves side by side (top right, 2x2)
            gs.map[2][14] = TILE_BOOKSHELF; gs.map[2][15] = TILE_BOOKSHELF;
            gs.map[3][14] = TILE_BOOKSHELF; gs.map[3][15] = TILE_BOOKSHELF;
            // Large table 2x3 (center) + 4 chairs
            gs.map[6][8] = TILE_TABLE; gs.map[6][9] = TILE_TABLE; gs.map[6][10] = TILE_TABLE;
            gs.map[7][8] = TILE_TABLE; gs.map[7][9] = TILE_TABLE; gs.map[7][10] = TILE_TABLE;
            gs.map[5][9] = TILE_CHAIR; gs.map[8][9] = TILE_CHAIR;
            gs.map[6][7] = TILE_CHAIR; gs.map[7][11] = TILE_CHAIR;
            // 3 chests along bottom-right wall
            gs.map[10][14] = TILE_CHEST; gs.map[10][15] = TILE_CHEST; gs.map[10][16] = TILE_CHEST;
            // Sofa 1x3 (bottom left, medium-wide)
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA;
            break;

        case 'farmer':
            // === FARM SHOP — produce crates, workbench, counter ===
            // Vegetable crates left wall (behind counter)
            gs.map[2][2] = TILE_VEGETABLE_CRATE; gs.map[3][2] = TILE_VEGETABLE_CRATE;
            gs.map[4][2] = TILE_CARROT_CRATE;
            // Workbench right wall (behind counter)
            gs.map[2][14] = TILE_WORKBENCH; gs.map[2][15] = TILE_WORKBENCH;
            gs.map[3][14] = TILE_CARROT_CRATE; gs.map[3][15] = TILE_VEGETABLE_CRATE;
            // Counter with center gap
            gs.map[5][3] = TILE_COUNTER; gs.map[5][4] = TILE_COUNTER; gs.map[5][5] = TILE_COUNTER;
            gs.map[5][6] = TILE_COUNTER; gs.map[5][7] = TILE_COUNTER;
            gs.map[5][10] = TILE_COUNTER; gs.map[5][11] = TILE_COUNTER;
            gs.map[5][12] = TILE_COUNTER; gs.map[5][13] = TILE_COUNTER; gs.map[5][14] = TILE_COUNTER;
            // Chest (behind counter)
            gs.map[3][8] = TILE_CHEST;
            // Front produce displays
            gs.map[8][3] = TILE_VEGETABLE_CRATE; gs.map[9][3] = TILE_CARROT_CRATE;
            gs.map[8][14] = TILE_VEGETABLE_CRATE; gs.map[9][14] = TILE_CARROT_CRATE;
            // Barrels
            gs.map[8][6] = TILE_BARREL; gs.map[8][11] = TILE_BARREL;
            // NPC farmer (behind counter)
            if (!isShopClosed) {
                gs.npcs.push({
                    x: 8, y: 3, type: 'farmer', direction: 'down',
                    animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999, visible: true
                });
            }
            break;

        case 'fisher':
            // === FISH MARKET — fish stalls, hanging fish, counter ===
            // Fish stalls left wall (behind counter)
            gs.map[2][2] = TILE_FISH_STALL; gs.map[3][2] = TILE_FISH_STALL;
            gs.map[4][2] = TILE_FISH_STALL;
            // Fish stalls right wall (behind counter)
            gs.map[2][15] = TILE_FISH_STALL; gs.map[3][15] = TILE_FISH_STALL;
            gs.map[4][15] = TILE_FISH_STALL;
            // Hanging fish display (back wall)
            gs.map[2][7] = TILE_HANGING_FISH; gs.map[2][8] = TILE_HANGING_FISH;
            gs.map[2][9] = TILE_HANGING_FISH; gs.map[2][10] = TILE_HANGING_FISH;
            // Counter with center gap
            gs.map[5][3] = TILE_COUNTER; gs.map[5][4] = TILE_COUNTER; gs.map[5][5] = TILE_COUNTER;
            gs.map[5][6] = TILE_COUNTER; gs.map[5][7] = TILE_COUNTER;
            gs.map[5][10] = TILE_COUNTER; gs.map[5][11] = TILE_COUNTER;
            gs.map[5][12] = TILE_COUNTER; gs.map[5][13] = TILE_COUNTER; gs.map[5][14] = TILE_COUNTER;
            // Barrels (front)
            gs.map[8][3] = TILE_BARREL; gs.map[8][14] = TILE_BARREL;
            // Chest (behind counter)
            gs.map[3][12] = TILE_CHEST;
            // NPC fisher (behind counter)
            if (!isShopClosed) {
                gs.npcs.push({
                    x: 8, y: 3, type: 'fisher', direction: 'down',
                    animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999, visible: true
                });
            }
            break;

        case 'merchant':
            // === POTION SHOP — potion shelves on walls, counter ===
            // Potion shelves left wall
            gs.map[2][2] = TILE_POTION_SHELF; gs.map[3][2] = TILE_POTION_SHELF;
            gs.map[4][2] = TILE_POTION_SHELF;
            gs.map[7][2] = TILE_POTION_SHELF; gs.map[8][2] = TILE_POTION_SHELF;
            // Potion shelves right wall
            gs.map[2][15] = TILE_POTION_SHELF; gs.map[3][15] = TILE_POTION_SHELF;
            gs.map[4][15] = TILE_POTION_SHELF;
            gs.map[7][15] = TILE_POTION_SHELF; gs.map[8][15] = TILE_POTION_SHELF;
            // Counter with center gap
            gs.map[5][3] = TILE_COUNTER; gs.map[5][4] = TILE_COUNTER; gs.map[5][5] = TILE_COUNTER;
            gs.map[5][6] = TILE_COUNTER; gs.map[5][7] = TILE_COUNTER;
            gs.map[5][10] = TILE_COUNTER; gs.map[5][11] = TILE_COUNTER;
            gs.map[5][12] = TILE_COUNTER; gs.map[5][13] = TILE_COUNTER; gs.map[5][14] = TILE_COUNTER;
            // Chest (behind counter)
            gs.map[3][8] = TILE_CHEST;
            // Front display shelves
            gs.map[8][5] = TILE_POTION_SHELF; gs.map[9][5] = TILE_POTION_SHELF;
            gs.map[8][12] = TILE_POTION_SHELF; gs.map[9][12] = TILE_POTION_SHELF;
            // NPC merchant (behind counter)
            if (!isShopClosed) {
                gs.npcs.push({
                    x: 8, y: 3, type: 'merchant', direction: 'down',
                    animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999, visible: true
                });
            }
            break;

        case 'elder':
            // === ELDER STUDY — big bookcase, bed, study table ===
            // Bed 2x3 (top left)
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            gs.map[4][2] = TILE_BED; gs.map[4][3] = TILE_BED;
            // Large bookcase (top right, 3x2)
            gs.map[2][14] = TILE_BOOKSHELF; gs.map[2][15] = TILE_BOOKSHELF;
            gs.map[3][14] = TILE_BOOKSHELF; gs.map[3][15] = TILE_BOOKSHELF;
            gs.map[4][14] = TILE_BOOKSHELF; gs.map[4][15] = TILE_BOOKSHELF;
            // Extra bookshelf (left wall)
            gs.map[6][2] = TILE_BOOKSHELF; gs.map[7][2] = TILE_BOOKSHELF;
            // Table 2x3 + 4 chairs (center)
            gs.map[6][8] = TILE_TABLE; gs.map[6][9] = TILE_TABLE; gs.map[6][10] = TILE_TABLE;
            gs.map[7][8] = TILE_TABLE; gs.map[7][9] = TILE_TABLE; gs.map[7][10] = TILE_TABLE;
            gs.map[5][9] = TILE_CHAIR; gs.map[8][9] = TILE_CHAIR;
            gs.map[6][7] = TILE_CHAIR; gs.map[7][11] = TILE_CHAIR;
            // Sofa 1x3 (bottom left)
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA;
            // Chest
            gs.map[10][15] = TILE_CHEST;
            // NPC elder
            gs.npcs.push({
                x: 12, y: 8, type: 'elder', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'doctor':
            // === MEDICAL OFFICE — medicine shelves, exam bed, counter ===
            // Potion shelves left wall (medicine cabinet)
            gs.map[2][2] = TILE_POTION_SHELF; gs.map[3][2] = TILE_POTION_SHELF;
            gs.map[4][2] = TILE_POTION_SHELF;
            // Potion shelves right wall
            gs.map[2][15] = TILE_POTION_SHELF; gs.map[3][15] = TILE_POTION_SHELF;
            gs.map[4][15] = TILE_POTION_SHELF;
            // Counter/desk with center gap
            gs.map[5][3] = TILE_COUNTER; gs.map[5][4] = TILE_COUNTER; gs.map[5][5] = TILE_COUNTER;
            gs.map[5][6] = TILE_COUNTER; gs.map[5][7] = TILE_COUNTER;
            gs.map[5][10] = TILE_COUNTER; gs.map[5][11] = TILE_COUNTER;
            gs.map[5][12] = TILE_COUNTER; gs.map[5][13] = TILE_COUNTER; gs.map[5][14] = TILE_COUNTER;
            // Medical bed (patient area, front left)
            gs.map[7][2] = TILE_MEDICAL_BED; gs.map[7][3] = TILE_MEDICAL_BED;
            gs.map[8][2] = TILE_MEDICAL_BED; gs.map[8][3] = TILE_MEDICAL_BED;
            // Chair (patient)
            gs.map[9][4] = TILE_CHAIR;
            // Chest (behind counter)
            gs.map[3][8] = TILE_CHEST;
            // NPC doctor (behind counter)
            if (!isShopClosed) {
                gs.npcs.push({
                    x: 8, y: 3, type: 'doctor', direction: 'down',
                    animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999, visible: true
                });
            }
            break;

        case 'blacksmith':
            // === FORGE — forge, anvil, workbench, counter ===
            // Forge 2x2 (behind counter, left)
            gs.map[2][2] = TILE_FORGE; gs.map[2][3] = TILE_FORGE;
            gs.map[3][2] = TILE_FORGE; gs.map[3][3] = TILE_FORGE;
            // Anvil
            gs.map[4][4] = TILE_ANVIL;
            // Workbench 2x2 (behind counter, right)
            gs.map[2][14] = TILE_WORKBENCH; gs.map[2][15] = TILE_WORKBENCH;
            gs.map[3][14] = TILE_WORKBENCH; gs.map[3][15] = TILE_WORKBENCH;
            // Counter with center gap
            gs.map[5][3] = TILE_COUNTER; gs.map[5][4] = TILE_COUNTER; gs.map[5][5] = TILE_COUNTER;
            gs.map[5][6] = TILE_COUNTER; gs.map[5][7] = TILE_COUNTER;
            gs.map[5][10] = TILE_COUNTER; gs.map[5][11] = TILE_COUNTER;
            gs.map[5][12] = TILE_COUNTER; gs.map[5][13] = TILE_COUNTER; gs.map[5][14] = TILE_COUNTER;
            // Barrels (front left)
            gs.map[8][2] = TILE_BARREL; gs.map[8][3] = TILE_BARREL;
            // Display table (front right)
            gs.map[8][14] = TILE_TABLE; gs.map[8][15] = TILE_TABLE;
            // Chest (behind counter)
            gs.map[3][8] = TILE_CHEST;
            // NPC blacksmith (behind counter)
            if (!isShopClosed) {
                gs.npcs.push({
                    x: 8, y: 3, type: 'blacksmith', direction: 'down',
                    animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999, visible: true
                });
            }
            break;

        case 'church':
            // === CHURCH — altar, pews, center aisle ===
            // Altar (back center, 1x4)
            gs.map[2][7] = TILE_ALTAR; gs.map[2][8] = TILE_ALTAR;
            gs.map[2][9] = TILE_ALTAR; gs.map[2][10] = TILE_ALTAR;
            // Pews left (2 rows of 4)
            gs.map[6][3] = TILE_CHURCH_PEW; gs.map[6][4] = TILE_CHURCH_PEW;
            gs.map[6][5] = TILE_CHURCH_PEW; gs.map[6][6] = TILE_CHURCH_PEW;
            gs.map[8][3] = TILE_CHURCH_PEW; gs.map[8][4] = TILE_CHURCH_PEW;
            gs.map[8][5] = TILE_CHURCH_PEW; gs.map[8][6] = TILE_CHURCH_PEW;
            // Pews right (2 rows of 4)
            gs.map[6][11] = TILE_CHURCH_PEW; gs.map[6][12] = TILE_CHURCH_PEW;
            gs.map[6][13] = TILE_CHURCH_PEW; gs.map[6][14] = TILE_CHURCH_PEW;
            gs.map[8][11] = TILE_CHURCH_PEW; gs.map[8][12] = TILE_CHURCH_PEW;
            gs.map[8][13] = TILE_CHURCH_PEW; gs.map[8][14] = TILE_CHURCH_PEW;
            // NPC priest (in front of altar)
            gs.npcs.push({
                x: 8, y: 4, type: 'priest', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'villager1':
            // === FAMILY HOME — 2 beds, table, sofa ===
            // Parent bed 2x3 (top left)
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            gs.map[4][2] = TILE_BED; gs.map[4][3] = TILE_BED;
            // Child bed 2x2 (top right)
            gs.map[2][14] = TILE_BED; gs.map[2][15] = TILE_BED;
            gs.map[3][14] = TILE_BED; gs.map[3][15] = TILE_BED;
            // Table 2x3 + 4 chairs (center)
            gs.map[6][8] = TILE_TABLE; gs.map[6][9] = TILE_TABLE; gs.map[6][10] = TILE_TABLE;
            gs.map[7][8] = TILE_TABLE; gs.map[7][9] = TILE_TABLE; gs.map[7][10] = TILE_TABLE;
            gs.map[5][9] = TILE_CHAIR; gs.map[8][9] = TILE_CHAIR;
            gs.map[6][7] = TILE_CHAIR; gs.map[7][11] = TILE_CHAIR;
            // Sofa 1x3 (bottom left)
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA;
            // Chests (bottom right)
            gs.map[10][14] = TILE_CHEST; gs.map[10][15] = TILE_CHEST; gs.map[10][16] = TILE_CHEST;
            // Shelf
            gs.map[5][2] = TILE_SHELF;
            // NPC
            gs.npcs.push({
                x: 12, y: 8, type: 'villager', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'villager2':
            // === SINGLE HOME — bed, table, bookshelf ===
            // Bed 2x3 (top left)
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            gs.map[4][2] = TILE_BED; gs.map[4][3] = TILE_BED;
            // Bookshelves 2x2 (top right)
            gs.map[2][14] = TILE_BOOKSHELF; gs.map[2][15] = TILE_BOOKSHELF;
            gs.map[3][14] = TILE_BOOKSHELF; gs.map[3][15] = TILE_BOOKSHELF;
            // Table 2x3 + 4 chairs (center)
            gs.map[6][8] = TILE_TABLE; gs.map[6][9] = TILE_TABLE; gs.map[6][10] = TILE_TABLE;
            gs.map[7][8] = TILE_TABLE; gs.map[7][9] = TILE_TABLE; gs.map[7][10] = TILE_TABLE;
            gs.map[5][9] = TILE_CHAIR; gs.map[8][9] = TILE_CHAIR;
            gs.map[6][7] = TILE_CHAIR; gs.map[7][11] = TILE_CHAIR;
            // Sofa 1x3 (bottom left)
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA;
            // Chests (bottom right)
            gs.map[10][14] = TILE_CHEST; gs.map[10][15] = TILE_CHEST;
            // NPC
            gs.npcs.push({
                x: 12, y: 8, type: 'villager', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'villager3':
            // === SINGLE HOME (variant) — bed right, table, desk ===
            // Bed 2x3 (top right)
            gs.map[2][14] = TILE_BED; gs.map[2][15] = TILE_BED;
            gs.map[3][14] = TILE_BED; gs.map[3][15] = TILE_BED;
            gs.map[4][14] = TILE_BED; gs.map[4][15] = TILE_BED;
            // Bookshelves 1x2 (top left)
            gs.map[2][2] = TILE_BOOKSHELF; gs.map[2][3] = TILE_BOOKSHELF;
            // Table 2x3 + 4 chairs (center)
            gs.map[6][6] = TILE_TABLE; gs.map[6][7] = TILE_TABLE; gs.map[6][8] = TILE_TABLE;
            gs.map[7][6] = TILE_TABLE; gs.map[7][7] = TILE_TABLE; gs.map[7][8] = TILE_TABLE;
            gs.map[5][7] = TILE_CHAIR; gs.map[8][7] = TILE_CHAIR;
            gs.map[6][5] = TILE_CHAIR; gs.map[7][9] = TILE_CHAIR;
            // Sofa 1x3 (bottom left)
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA;
            // Chests (bottom right)
            gs.map[10][13] = TILE_CHEST; gs.map[10][14] = TILE_CHEST; gs.map[10][15] = TILE_CHEST;
            // Desk + chair (mid right)
            gs.map[4][2] = TILE_TABLE; gs.map[4][3] = TILE_TABLE;
            gs.map[4][4] = TILE_CHAIR;
            // NPC
            gs.npcs.push({
                x: 12, y: 8, type: 'villager', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;
    }

    // Update map dimensions
    gs.mapWidth = INTERIOR_WIDTH;
    gs.mapHeight = INTERIOR_HEIGHT;
}
