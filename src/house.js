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

    // Decorate based on house type
    switch (type) {
        case 'player':
            // Bed (top left) - 2x2
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            // Chest (top right)
            gs.map[2][15] = TILE_CHEST;
            // Table + 4 chairs (center)
            gs.map[6][8] = TILE_TABLE; gs.map[6][9] = TILE_TABLE;
            gs.map[7][8] = TILE_TABLE; gs.map[7][9] = TILE_TABLE;
            gs.map[5][8] = TILE_CHAIR; gs.map[8][9] = TILE_CHAIR;
            gs.map[6][7] = TILE_CHAIR; gs.map[7][10] = TILE_CHAIR;
            // Sofa (bottom left)
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA;
            // Shelf (bottom right)
            gs.map[10][15] = TILE_SHELF;
            break;

        case 'farmer':
            // Bed
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            // Workbench
            gs.map[2][14] = TILE_WORKBENCH; gs.map[2][15] = TILE_WORKBENCH;
            // Vegetable crates
            gs.map[2][10] = TILE_VEGETABLE_CRATE; gs.map[3][10] = TILE_CARROT_CRATE;
            gs.map[2][11] = TILE_VEGETABLE_CRATE;
            // Table
            gs.map[7][7] = TILE_TABLE; gs.map[7][8] = TILE_TABLE;
            gs.map[8][7] = TILE_CHAIR; gs.map[6][8] = TILE_CHAIR;
            // Tool chest
            gs.map[6][2] = TILE_CHEST;
            // Barrels
            gs.map[10][14] = TILE_BARREL; gs.map[10][3] = TILE_BARREL;
            // NPC farmer
            gs.npcs.push({
                x: 12, y: 8, type: 'farmer', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'fisher':
            // Counter with passage
            for (let x = 2; x < 7; x++) gs.map[6][x] = TILE_COUNTER;
            for (let x = 11; x < 16; x++) gs.map[6][x] = TILE_COUNTER;
            // Fish stalls
            gs.map[2][3] = TILE_FISH_STALL; gs.map[2][4] = TILE_FISH_STALL;
            gs.map[3][3] = TILE_FISH_STALL; gs.map[3][4] = TILE_FISH_STALL;
            gs.map[2][12] = TILE_FISH_STALL; gs.map[2][13] = TILE_FISH_STALL;
            gs.map[3][12] = TILE_FISH_STALL; gs.map[3][13] = TILE_FISH_STALL;
            // Hanging fish
            gs.map[2][7] = TILE_HANGING_FISH; gs.map[2][9] = TILE_HANGING_FISH;
            // Barrels
            gs.map[4][3] = TILE_BARREL; gs.map[4][13] = TILE_BARREL;
            // Cash chest
            gs.map[2][15] = TILE_CHEST;
            // Chairs
            gs.map[9][3] = TILE_CHAIR; gs.map[9][13] = TILE_CHAIR;
            // Display table
            gs.map[11][4] = TILE_TABLE; gs.map[11][5] = TILE_TABLE;
            // NPC fisher
            gs.npcs.push({
                x: 8, y: 4, type: 'fisher', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'merchant':
            // Counter with passage
            for (let x = 2; x < 7; x++) gs.map[6][x] = TILE_COUNTER;
            for (let x = 11; x < 16; x++) gs.map[6][x] = TILE_COUNTER;
            // Potion shelves (back area)
            gs.map[2][2] = TILE_POTION_SHELF; gs.map[3][2] = TILE_POTION_SHELF;
            gs.map[2][4] = TILE_POTION_SHELF; gs.map[2][5] = TILE_POTION_SHELF;
            gs.map[3][4] = TILE_POTION_SHELF; gs.map[3][5] = TILE_POTION_SHELF;
            gs.map[2][11] = TILE_POTION_SHELF; gs.map[2][12] = TILE_POTION_SHELF;
            gs.map[3][11] = TILE_POTION_SHELF; gs.map[3][12] = TILE_POTION_SHELF;
            gs.map[2][14] = TILE_POTION_SHELF; gs.map[3][14] = TILE_POTION_SHELF;
            // Chests
            gs.map[4][3] = TILE_CHEST; gs.map[4][13] = TILE_CHEST;
            gs.map[2][15] = TILE_CHEST;
            // Client area shelves
            gs.map[8][3] = TILE_POTION_SHELF; gs.map[8][5] = TILE_POTION_SHELF;
            gs.map[8][12] = TILE_POTION_SHELF; gs.map[8][14] = TILE_POTION_SHELF;
            // Chairs
            gs.map[11][4] = TILE_CHAIR; gs.map[11][13] = TILE_CHAIR;
            // NPC merchant
            gs.npcs.push({
                x: 8, y: 4, type: 'merchant', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'elder':
            // Bed
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            // Bookshelves (right wall)
            gs.map[2][15] = TILE_BOOKSHELF; gs.map[3][15] = TILE_BOOKSHELF;
            gs.map[4][15] = TILE_BOOKSHELF; gs.map[6][15] = TILE_BOOKSHELF;
            gs.map[7][15] = TILE_BOOKSHELF; gs.map[8][15] = TILE_BOOKSHELF;
            // Bookshelves (left wall)
            gs.map[6][2] = TILE_BOOKSHELF; gs.map[7][2] = TILE_BOOKSHELF;
            gs.map[8][2] = TILE_BOOKSHELF;
            // Table + chairs (center)
            gs.map[7][8] = TILE_TABLE; gs.map[7][9] = TILE_TABLE;
            gs.map[8][8] = TILE_TABLE; gs.map[8][9] = TILE_TABLE;
            gs.map[6][8] = TILE_CHAIR; gs.map[9][9] = TILE_CHAIR;
            gs.map[7][7] = TILE_CHAIR; gs.map[8][10] = TILE_CHAIR;
            // Chest
            gs.map[2][13] = TILE_CHEST;
            // NPC elder
            gs.npcs.push({
                x: 10, y: 4, type: 'elder', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'doctor':
            // Medical beds
            gs.map[2][2] = TILE_MEDICAL_BED; gs.map[2][3] = TILE_MEDICAL_BED;
            gs.map[3][2] = TILE_MEDICAL_BED; gs.map[3][3] = TILE_MEDICAL_BED;
            gs.map[2][6] = TILE_MEDICAL_BED; gs.map[2][7] = TILE_MEDICAL_BED;
            gs.map[3][6] = TILE_MEDICAL_BED; gs.map[3][7] = TILE_MEDICAL_BED;
            // Potion shelves
            gs.map[2][14] = TILE_POTION_SHELF; gs.map[3][14] = TILE_POTION_SHELF;
            gs.map[4][14] = TILE_POTION_SHELF;
            gs.map[2][15] = TILE_POTION_SHELF; gs.map[3][15] = TILE_POTION_SHELF;
            gs.map[4][15] = TILE_POTION_SHELF;
            // Examination table
            gs.map[7][3] = TILE_TABLE; gs.map[7][4] = TILE_TABLE;
            gs.map[8][3] = TILE_TABLE; gs.map[8][4] = TILE_TABLE;
            // Chair
            gs.map[7][6] = TILE_CHAIR;
            // Medical chests
            gs.map[10][2] = TILE_CHEST; gs.map[10][3] = TILE_CHEST;
            // Desk
            gs.map[10][13] = TILE_TABLE; gs.map[10][14] = TILE_TABLE;
            gs.map[10][15] = TILE_CHAIR;
            // NPC doctor
            gs.npcs.push({
                x: 8, y: 5, type: 'doctor', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'blacksmith':
            // Large forge
            gs.map[3][2] = TILE_FORGE; gs.map[3][3] = TILE_FORGE;
            gs.map[4][2] = TILE_FORGE; gs.map[4][3] = TILE_FORGE;
            // Anvil
            gs.map[2][5] = TILE_ANVIL;
            // Workbench
            gs.map[3][13] = TILE_WORKBENCH; gs.map[3][14] = TILE_WORKBENCH;
            gs.map[4][13] = TILE_WORKBENCH; gs.map[4][14] = TILE_WORKBENCH;
            // Weapons chest
            gs.map[2][15] = TILE_CHEST;
            // Barrels
            gs.map[10][2] = TILE_BARREL; gs.map[10][4] = TILE_BARREL;
            gs.map[10][15] = TILE_BARREL;
            // Work table
            gs.map[10][5] = TILE_TABLE; gs.map[10][6] = TILE_TABLE;
            // NPC blacksmith
            gs.npcs.push({
                x: 5, y: 5, type: 'blacksmith', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'church':
            // Altar (top center)
            gs.map[2][7] = TILE_ALTAR; gs.map[2][8] = TILE_ALTAR;
            gs.map[2][9] = TILE_ALTAR; gs.map[2][10] = TILE_ALTAR;
            gs.map[3][7] = TILE_ALTAR; gs.map[3][8] = TILE_ALTAR;
            gs.map[3][9] = TILE_ALTAR; gs.map[3][10] = TILE_ALTAR;
            // Pews (left rows)
            gs.map[6][3] = TILE_CHURCH_PEW; gs.map[6][4] = TILE_CHURCH_PEW; gs.map[6][5] = TILE_CHURCH_PEW;
            gs.map[8][3] = TILE_CHURCH_PEW; gs.map[8][4] = TILE_CHURCH_PEW; gs.map[8][5] = TILE_CHURCH_PEW;
            gs.map[10][3] = TILE_CHURCH_PEW; gs.map[10][4] = TILE_CHURCH_PEW; gs.map[10][5] = TILE_CHURCH_PEW;
            // Pews (right rows)
            gs.map[6][12] = TILE_CHURCH_PEW; gs.map[6][13] = TILE_CHURCH_PEW; gs.map[6][14] = TILE_CHURCH_PEW;
            gs.map[8][12] = TILE_CHURCH_PEW; gs.map[8][13] = TILE_CHURCH_PEW; gs.map[8][14] = TILE_CHURCH_PEW;
            gs.map[10][12] = TILE_CHURCH_PEW; gs.map[10][13] = TILE_CHURCH_PEW; gs.map[10][14] = TILE_CHURCH_PEW;
            // Small side altars
            gs.map[5][2] = TILE_ALTAR; gs.map[5][15] = TILE_ALTAR;
            // NPC priest
            gs.npcs.push({
                x: 8, y: 5, type: 'priest', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'villager1':
            // Double bed (parents)
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            // Single bed (children)
            gs.map[2][14] = TILE_BED; gs.map[2][15] = TILE_BED;
            // Family table
            gs.map[7][7] = TILE_TABLE; gs.map[7][8] = TILE_TABLE;
            gs.map[8][7] = TILE_TABLE; gs.map[8][8] = TILE_TABLE;
            gs.map[6][7] = TILE_CHAIR; gs.map[9][8] = TILE_CHAIR;
            gs.map[7][6] = TILE_CHAIR; gs.map[8][9] = TILE_CHAIR;
            // Chests
            gs.map[2][10] = TILE_CHEST; gs.map[3][10] = TILE_CHEST;
            // Sofa
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA;
            // Shelf
            gs.map[10][14] = TILE_SHELF;
            // NPC
            gs.npcs.push({
                x: 10, y: 7, type: 'villager', direction: 'down',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'villager2':
            // Double bed
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            // Small table
            gs.map[7][13] = TILE_TABLE; gs.map[7][14] = TILE_TABLE;
            gs.map[6][13] = TILE_CHAIR; gs.map[8][14] = TILE_CHAIR;
            // Bookshelf
            gs.map[2][14] = TILE_BOOKSHELF; gs.map[3][14] = TILE_BOOKSHELF;
            gs.map[4][14] = TILE_BOOKSHELF;
            // Chest
            gs.map[2][15] = TILE_CHEST;
            // Large sofa
            gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA; gs.map[10][5] = TILE_SOFA;
            // Coffee table
            gs.map[9][4] = TILE_TABLE;
            // Shelf
            gs.map[2][8] = TILE_SHELF;
            // NPC
            gs.npcs.push({
                x: 12, y: 6, type: 'villager', direction: 'left',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;

        case 'villager3':
            // Double bed
            gs.map[2][2] = TILE_BED; gs.map[2][3] = TILE_BED;
            gs.map[3][2] = TILE_BED; gs.map[3][3] = TILE_BED;
            // Dining table
            gs.map[6][12] = TILE_TABLE; gs.map[6][13] = TILE_TABLE;
            gs.map[7][12] = TILE_TABLE; gs.map[7][13] = TILE_TABLE;
            gs.map[5][12] = TILE_CHAIR; gs.map[8][13] = TILE_CHAIR;
            gs.map[6][11] = TILE_CHAIR; gs.map[7][14] = TILE_CHAIR;
            // Storage chests
            gs.map[2][14] = TILE_CHEST; gs.map[2][15] = TILE_CHEST;
            // Modern sofa
            gs.map[10][2] = TILE_SOFA; gs.map[10][3] = TILE_SOFA; gs.map[10][4] = TILE_SOFA;
            // Shelves
            gs.map[3][8] = TILE_SHELF; gs.map[4][8] = TILE_SHELF;
            // Desk
            gs.map[10][14] = TILE_TABLE; gs.map[10][15] = TILE_CHAIR;
            // NPC
            gs.npcs.push({
                x: 9, y: 9, type: 'villager', direction: 'right',
                animFrame: 0, animTimer: 0, moveTimer: 0, idleTime: 999999
            });
            break;
    }

    // Update map dimensions
    gs.mapWidth = INTERIOR_WIDTH;
    gs.mapHeight = INTERIOR_HEIGHT;
}
