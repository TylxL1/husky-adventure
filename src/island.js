// ========================================
// ISLAND - Travel between main/desert islands
// ========================================
import { TILE_WATER, TILE_PATH, TILE_ROCK, TILE_TREE, TILE_DOCK, TILE_SNOW, TILE_ICE, TILE_PINE_TREE, TILE_MOUNTAIN } from './constants.js';
import { saveGame } from './save.js';

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

    saveGame(gs);
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

    saveGame(gs);
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

    // --- West dock (return to main island) ---
    const dockX = islandLeft + 3;
    const dockY = Math.floor(gs.mapHeight / 2);

    gs.desertDockLocation = { x: dockX, y: dockY, direction: 'west' };

    // Clear dock area
    for (let dy = dockY - 3; dy <= dockY + 3; dy++) {
        for (let dx = dockX; dx <= dockX + 4; dx++) {
            if (dx >= 0 && dx < gs.mapWidth && dy >= 0 && dy < gs.mapHeight) {
                gs.map[dy][dx] = TILE_PATH;
            }
        }
    }

    // Water to the left of dock
    for (let dy = dockY - 3; dy <= dockY + 3; dy++) {
        for (let dx = 0; dx < dockX; dx++) {
            if (dy >= 0 && dy < gs.mapHeight) gs.map[dy][dx] = TILE_WATER;
        }
    }

    // Place west dock tiles
    for (let dy = dockY - 2; dy <= dockY + 2; dy++) {
        for (let dx = dockX - 2; dx <= dockX; dx++) {
            if (dx >= 0 && dx < gs.mapWidth && dy >= 0 && dy < gs.mapHeight) {
                gs.map[dy][dx] = TILE_DOCK;
            }
        }
    }

    // West boat in water
    gs.boats.push({
        x: dockX - 3.5, y: dockY,
        type: 'small', color: '#A0522D', bobTimer: 0
    });

    // --- East dock (travel to snow island) ---
    const eastDockX = islandRight - 3;
    const eastDockY = dockY;

    gs.snowDockLocation = { x: eastDockX, y: eastDockY, direction: 'east' };

    // Clear east dock area
    for (let dy = eastDockY - 3; dy <= eastDockY + 3; dy++) {
        for (let dx = eastDockX - 4; dx <= eastDockX; dx++) {
            if (dx >= 0 && dx < gs.mapWidth && dy >= 0 && dy < gs.mapHeight) {
                gs.map[dy][dx] = TILE_PATH;
            }
        }
    }

    // Water to the right of east dock
    for (let dy = eastDockY - 3; dy <= eastDockY + 3; dy++) {
        for (let dx = eastDockX + 1; dx < gs.mapWidth; dx++) {
            if (dy >= 0 && dy < gs.mapHeight) gs.map[dy][dx] = TILE_WATER;
        }
    }

    // Place east dock tiles
    for (let dy = eastDockY - 2; dy <= eastDockY + 2; dy++) {
        for (let dx = eastDockX; dx <= eastDockX + 2; dx++) {
            if (dx >= 0 && dx < gs.mapWidth && dy >= 0 && dy < gs.mapHeight) {
                gs.map[dy][dx] = TILE_DOCK;
            }
        }
    }

    // East boat in water
    gs.boats.push({
        x: eastDockX + 3.5, y: eastDockY,
        type: 'small', color: '#5a7d9a', bobTimer: 0
    });
}

// ----------------------------------------
// Create snow/mountain island
// ----------------------------------------
function createSnowIsland(gs) {
    gs.map = [];
    gs.houses = [];
    gs.npcs = [];
    gs.boats = [];
    gs.portLocation = null;
    gs.waterDirection = null;

    const mapW = gs.mapWidth;
    const mapH = gs.mapHeight;

    // Fill with water
    for (let y = 0; y < mapH; y++) {
        gs.map[y] = [];
        for (let x = 0; x < mapW; x++) {
            gs.map[y][x] = TILE_WATER;
        }
    }

    // Create island with organic sine edges
    const islandLeft = 8;
    const islandRight = mapW - 8;
    const islandTop = 4;
    const islandBottom = mapH - 4;

    for (let y = islandTop; y < islandBottom; y++) {
        for (let x = islandLeft; x < islandRight; x++) {
            const leftEdge = islandLeft + Math.sin(y * 0.35) * 2 + Math.sin(y * 0.15) * 1.5;
            const rightEdge = islandRight - Math.sin(y * 0.3) * 2 - Math.sin(y * 0.18) * 1.5;
            const topEdge = islandTop + Math.cos(x * 0.25) * 2 + Math.cos(x * 0.12) * 1.5;
            const bottomEdge = islandBottom - Math.cos(x * 0.3) * 2 - Math.cos(x * 0.15) * 1.5;

            if (x > leftEdge && x < rightEdge && y > topEdge && y < bottomEdge) {
                gs.map[y][x] = TILE_SNOW;
            }
        }
    }

    // Mountain range across top-center (y ≈ 10-18, x ≈ 20-70)
    for (let x = 20; x < 70; x++) {
        const peakY = 13 + Math.sin(x * 0.3) * 2 + Math.sin(x * 0.15) * 1.5;
        const rangeTop = Math.floor(peakY - 3);
        const rangeBottom = Math.floor(peakY + 4);
        for (let y = rangeTop; y <= rangeBottom; y++) {
            if (y >= 0 && y < mapH && x >= 0 && x < mapW && gs.map[y][x] === TILE_SNOW) {
                gs.map[y][x] = TILE_MOUNTAIN;
            }
        }
    }

    // Frozen lake patches (2-3 organic ovals)
    const lakes = [
        { cx: 35, cy: 35, rx: 4, ry: 3 },
        { cx: 55, cy: 40, rx: 3, ry: 4 },
        { cx: 45, cy: 28, rx: 3, ry: 3 }
    ];
    for (const lake of lakes) {
        for (let y = lake.cy - lake.ry - 1; y <= lake.cy + lake.ry + 1; y++) {
            for (let x = lake.cx - lake.rx - 1; x <= lake.cx + lake.rx + 1; x++) {
                if (x >= 0 && x < mapW && y >= 0 && y < mapH) {
                    const dx = (x - lake.cx) / lake.rx;
                    const dy = (y - lake.cy) / lake.ry;
                    if (dx * dx + dy * dy < 1.0 && gs.map[y][x] === TILE_SNOW) {
                        gs.map[y][x] = TILE_ICE;
                    }
                }
            }
        }
    }

    // Scatter pine trees on snow
    for (let i = 0; i < 25; i++) {
        const x = Math.floor(Math.random() * (mapW - 20)) + 10;
        const y = Math.floor(Math.random() * (mapH - 12)) + 8;
        if (gs.map[y][x] === TILE_SNOW) gs.map[y][x] = TILE_PINE_TREE;
    }

    // Scatter rocks on snow
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * (mapW - 20)) + 10;
        const y = Math.floor(Math.random() * (mapH - 12)) + 8;
        if (gs.map[y][x] === TILE_SNOW) gs.map[y][x] = TILE_ROCK;
    }

    // --- West dock (return to desert island) ---
    const dockX = islandLeft + 3;
    const dockY = 30;

    gs.snowReturnDockLocation = { x: dockX, y: dockY, direction: 'west' };

    // Clear dock area
    for (let dy = dockY - 3; dy <= dockY + 3; dy++) {
        for (let dx = dockX; dx <= dockX + 4; dx++) {
            if (dx >= 0 && dx < mapW && dy >= 0 && dy < mapH) {
                gs.map[dy][dx] = TILE_SNOW;
            }
        }
    }

    // Water to the left of dock
    for (let dy = dockY - 3; dy <= dockY + 3; dy++) {
        for (let dx = 0; dx < dockX; dx++) {
            if (dy >= 0 && dy < mapH) gs.map[dy][dx] = TILE_WATER;
        }
    }

    // Place dock tiles
    for (let dy = dockY - 2; dy <= dockY + 2; dy++) {
        for (let dx = dockX - 2; dx <= dockX; dx++) {
            if (dx >= 0 && dx < mapW && dy >= 0 && dy < mapH) {
                gs.map[dy][dx] = TILE_DOCK;
            }
        }
    }

    // Return boat in water
    gs.boats.push({
        x: dockX - 3.5, y: dockY,
        type: 'small', color: '#5a7d9a', bobTimer: 0
    });
}

// ----------------------------------------
// Travel to snow island (from desert)
// ----------------------------------------
export function travelToSnowIsland(gs) {
    // Save desert state
    gs.savedDesertIsland = {
        map: JSON.parse(JSON.stringify(gs.map)),
        houses: JSON.parse(JSON.stringify(gs.houses)),
        npcs: JSON.parse(JSON.stringify(gs.npcs)),
        boats: JSON.parse(JSON.stringify(gs.boats)),
        desertDockLocation: gs.desertDockLocation,
        snowDockLocation: gs.snowDockLocation
    };
    gs.savedDesertPlayer = { x: gs.player.x, y: gs.player.y };

    gs.currentIsland = 'snow';
    createSnowIsland(gs);

    // Position player at snow dock
    if (gs.snowReturnDockLocation) {
        gs.player.x = gs.snowReturnDockLocation.x + 1;
        gs.player.y = gs.snowReturnDockLocation.y;
    }

    saveGame(gs);
}

// ----------------------------------------
// Travel back to desert from snow
// ----------------------------------------
export function travelToDesertFromSnow(gs) {
    gs.map = JSON.parse(JSON.stringify(gs.savedDesertIsland.map));
    gs.houses = JSON.parse(JSON.stringify(gs.savedDesertIsland.houses));
    gs.npcs = JSON.parse(JSON.stringify(gs.savedDesertIsland.npcs));
    gs.boats = JSON.parse(JSON.stringify(gs.savedDesertIsland.boats));
    gs.desertDockLocation = gs.savedDesertIsland.desertDockLocation;
    gs.snowDockLocation = gs.savedDesertIsland.snowDockLocation;

    // Position player at the east dock on desert
    if (gs.snowDockLocation) {
        gs.player.x = gs.snowDockLocation.x - 1;
        gs.player.y = gs.snowDockLocation.y;
    } else {
        gs.player.x = gs.savedDesertPlayer.x;
        gs.player.y = gs.savedDesertPlayer.y;
    }

    gs.currentIsland = 'desert';

    saveGame(gs);
}
