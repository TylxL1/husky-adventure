// ========================================
// ISLAND - Travel between main/desert islands
// ========================================
import { TILE_WATER, TILE_PATH, TILE_ROCK, TILE_TREE, TILE_DOCK } from './constants.js';

// ----------------------------------------
// Check proximity to boats
// ----------------------------------------
export function checkNearBoat(gs) {
    gs.nearBoat = null;
    const interactionDistance = 3;

    gs.boats.forEach(boat => {
        const distance = Math.sqrt(
            Math.pow(gs.player.x - boat.x, 2) +
            Math.pow(gs.player.y - boat.y, 2)
        );
        if (distance < interactionDistance) {
            gs.nearBoat = boat;
        }
    });
}

// ----------------------------------------
// Update boat bobbing
// ----------------------------------------
export function updateBoats(gs, dt) {
    gs.boats.forEach(boat => {
        boat.bobTimer += dt;
    });
}

// ----------------------------------------
// Create boats at port
// ----------------------------------------
export function createBoats(gs) {
    if (!gs.portLocation || !gs.waterDirection) return;

    const portX = gs.portLocation.x;
    const portY = gs.portLocation.y;

    if (gs.waterDirection === 'east') {
        gs.boats.push(
            { x: portX + 4, y: portY - 2, type: 'fishing', color: '#8B4513', bobTimer: 0 },
            { x: portX + 4.5, y: portY, type: 'small', color: '#A0522D', bobTimer: 30 },
            { x: portX + 4, y: portY + 2, type: 'fishing', color: '#654321', bobTimer: 60 }
        );
    } else {
        gs.boats.push(
            { x: portX - 2, y: portY + 4, type: 'fishing', color: '#8B4513', bobTimer: 0 },
            { x: portX, y: portY + 4.5, type: 'small', color: '#A0522D', bobTimer: 30 },
            { x: portX + 2, y: portY + 4, type: 'fishing', color: '#654321', bobTimer: 60 }
        );
    }
}

// ----------------------------------------
// Travel to desert island
// ----------------------------------------
export function travelToDesertIsland(gs) {
    // Save main island state
    gs.savedMainIsland = {
        map: JSON.parse(JSON.stringify(gs.map)),
        houses: JSON.parse(JSON.stringify(gs.houses)),
        npcs: JSON.parse(JSON.stringify(gs.npcs)),
        boats: JSON.parse(JSON.stringify(gs.boats)),
        portLocation: gs.portLocation,
        waterDirection: gs.waterDirection
    };

    gs.savedMainPlayer = { x: gs.player.x, y: gs.player.y };

    gs.currentIsland = 'desert';
    createDesertIsland(gs);

    // Position player on desert dock
    if (gs.desertDockLocation) {
        if (gs.desertDockLocation.direction === 'west') {
            gs.player.x = gs.desertDockLocation.x + 1;
            gs.player.y = gs.desertDockLocation.y;
        } else if (gs.desertDockLocation.direction === 'south') {
            gs.player.x = gs.desertDockLocation.x;
            gs.player.y = gs.desertDockLocation.y + 1;
        }
    }
}

// ----------------------------------------
// Travel back to main island
// ----------------------------------------
export function travelToMainIsland(gs) {
    gs.map = JSON.parse(JSON.stringify(gs.savedMainIsland.map));
    gs.houses = JSON.parse(JSON.stringify(gs.savedMainIsland.houses));
    gs.npcs = JSON.parse(JSON.stringify(gs.savedMainIsland.npcs));
    gs.boats = JSON.parse(JSON.stringify(gs.savedMainIsland.boats));
    gs.portLocation = gs.savedMainIsland.portLocation;
    gs.waterDirection = gs.savedMainIsland.waterDirection;

    gs.player.x = gs.savedMainPlayer.x;
    gs.player.y = gs.savedMainPlayer.y;

    gs.currentIsland = 'main';
}

// ----------------------------------------
// Create desert island map
// ----------------------------------------
function createDesertIsland(gs) {
    gs.map = [];
    gs.houses = [];
    gs.npcs = [];
    gs.boats = [];
    gs.portLocation = null;
    gs.waterDirection = null;

    // Fill with water
    for (let y = 0; y < gs.mapHeight; y++) {
        gs.map[y] = [];
        for (let x = 0; x < gs.mapWidth; x++) {
            gs.map[y][x] = TILE_WATER;
        }
    }

    // Create island with sand
    const islandLeft = 8;
    const islandRight = gs.mapWidth - 8;
    const islandTop = 6;
    const islandBottom = gs.mapHeight - 6;

    for (let y = islandTop; y < islandBottom; y++) {
        for (let x = islandLeft; x < islandRight; x++) {
            const leftEdge = islandLeft + Math.sin(y * 0.3) * 2;
            const rightEdge = islandRight - Math.sin(y * 0.25) * 2;
            const topEdge = islandTop + Math.cos(x * 0.3) * 2;
            const bottomEdge = islandBottom - Math.cos(x * 0.25) * 2;

            if (x > leftEdge && x < rightEdge && y > topEdge && y < bottomEdge) {
                gs.map[y][x] = TILE_PATH; // Sand
            }
        }
    }

    // Rocks
    for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * (gs.mapWidth - 20)) + 10;
        const y = Math.floor(Math.random() * (gs.mapHeight - 12)) + 8;
        if (gs.map[y][x] === TILE_PATH) gs.map[y][x] = TILE_ROCK;
    }

    // Cacti (using tree tile)
    for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * (gs.mapWidth - 20)) + 10;
        const y = Math.floor(Math.random() * (gs.mapHeight - 12)) + 8;
        if (gs.map[y][x] === TILE_PATH) gs.map[y][x] = TILE_TREE;
    }

    // Desert dock on left edge
    const dockX = islandLeft + 3;
    const dockY = Math.floor(gs.mapHeight / 2);
    const dockDirection = 'west';

    gs.desertDockLocation = { x: dockX, y: dockY, direction: dockDirection };

    // Clear dock area
    for (let y = dockY - 3; y <= dockY + 3; y++) {
        for (let x = dockX; x <= dockX + 4; x++) {
            if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                gs.map[y][x] = TILE_PATH;
            }
        }
    }

    // Water to the left of dock
    for (let y = dockY - 3; y <= dockY + 3; y++) {
        for (let x = 0; x < dockX; x++) {
            if (y >= 0 && y < gs.mapHeight) gs.map[y][x] = TILE_WATER;
        }
    }

    // Place dock tiles
    for (let y = dockY - 2; y <= dockY + 2; y++) {
        for (let x = dockX - 2; x <= dockX; x++) {
            if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                gs.map[y][x] = TILE_DOCK;
            }
        }
    }

    // Boat in water
    gs.boats.push({
        x: dockX - 3.5, y: dockY,
        type: 'small', color: '#A0522D', bobTimer: 0
    });
}
