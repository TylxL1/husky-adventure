// ========================================
// MAP - Island generation, paths, fields, plaza
// ========================================
import {
    TILE_GRASS, TILE_PATH, TILE_TREE, TILE_HOUSE, TILE_WATER,
    TILE_FLOWER, TILE_ROCK, TILE_DOCK, TILE_FOUNTAIN,
    TILE_BENCH, TILE_COBBLESTONE, TILE_LAMPPOST,
    TILE_TOMATO_FIELD, TILE_CARROT_FIELD, TILE_PLOWED_SOIL,
    TILE_FENCE,
    MAP_WIDTH, MAP_HEIGHT
} from './constants.js';

// ----------------------------------------
// Main map creation
// ----------------------------------------
export function createMap(gs) {
    gs.map = [];
    gs.mapWidth = MAP_WIDTH;
    gs.mapHeight = MAP_HEIGHT;

    // Initialize with grass
    for (let y = 0; y < gs.mapHeight; y++) {
        gs.map[y] = [];
        for (let x = 0; x < gs.mapWidth; x++) {
            gs.map[y][x] = TILE_GRASS;
        }
    }

    // Organic borders (water)
    for (let x = 0; x < gs.mapWidth; x++) {
        for (let y = 0; y < gs.mapHeight; y++) {
            const leftBorder = 3 + Math.sin(y * 0.25) * 2.5;
            if (x < leftBorder) gs.map[y][x] = TILE_WATER;

            const rightBorder = gs.mapWidth - 3 - Math.sin(y * 0.2) * 2.5;
            if (x > rightBorder) gs.map[y][x] = TILE_WATER;

            const topBorder = 3 + Math.cos(x * 0.25) * 2.5;
            if (y < topBorder) gs.map[y][x] = TILE_WATER;

            const bottomBorder = gs.mapHeight - 3 - Math.cos(x * 0.2) * 2.5;
            if (y > bottomBorder) gs.map[y][x] = TILE_WATER;
        }
    }

    // Place 3x3 houses with types
    gs.houses = [];
    const housePositions = [
        // Northwest zone (residential)
        { x: 15, y: 10, type: 'player' },
        { x: 25, y: 12, type: 'villager1' },
        // Northeast zone
        { x: 55, y: 10, type: 'villager2' },
        { x: 68, y: 14, type: 'farmer' },
        // East zone (commercial)
        { x: 75, y: 25, type: 'merchant' },
        { x: 70, y: 35, type: 'fisher' },
        // Southeast zone
        { x: 60, y: 46, type: 'doctor' },
        { x: 48, y: 48, type: 'elder' },
        // Southwest zone
        { x: 20, y: 48, type: 'blacksmith' },
        { x: 12, y: 40, type: 'villager3' },
        // Church west of plaza
        { x: 30, y: 28, type: 'church' }
    ];

    housePositions.forEach(pos => addHouse(gs, pos.x, pos.y, pos.type));

    // Farmer fields
    createFarmerFields(gs);

    // Goat pen next to farmer fields
    createGoatPen(gs);

    // Central plaza and paths
    createCentralPlaza(gs);
    createPathsFromPlaza(gs);

    // Port with docks
    createPort(gs);

    // Fishing pier near east coast
    createFishingSpot(gs);

    // Lampposts along paths
    placeLamppostsOnPaths(gs);

    // Trees
    for (let i = 0; i < 80; i++) {
        const x = Math.floor(Math.random() * (gs.mapWidth - 10)) + 5;
        const y = Math.floor(Math.random() * (gs.mapHeight - 10)) + 5;

        if (gs.map[y][x] === TILE_GRASS &&
            Math.abs(x - gs.player.x) > 5 &&
            Math.abs(y - gs.player.y) > 5 &&
            gs.portLocation &&
            Math.abs(x - gs.portLocation.x) > 8 &&
            Math.abs(y - gs.portLocation.y) > 8) {
            gs.map[y][x] = TILE_TREE;
        }
    }

    // Flowers
    for (let i = 0; i < 120; i++) {
        const x = Math.floor(Math.random() * (gs.mapWidth - 10)) + 5;
        const y = Math.floor(Math.random() * (gs.mapHeight - 10)) + 5;
        if (gs.map[y][x] === TILE_GRASS) gs.map[y][x] = TILE_FLOWER;
    }

    // Rocks
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * (gs.mapWidth - 10)) + 5;
        const y = Math.floor(Math.random() * (gs.mapHeight - 10)) + 5;
        if (gs.map[y][x] === TILE_GRASS) gs.map[y][x] = TILE_ROCK;
    }
}

// ----------------------------------------
// Add a house to the map
// ----------------------------------------
export function addHouse(gs, centerX, centerY, type = 'villager') {
    const house = {
        x: centerX,
        y: centerY,
        width: 3,
        height: 3,
        type,
        doorX: centerX,
        doorY: centerY + 1
    };

    gs.houses.push(house);

    for (let y = 0; y < house.height; y++) {
        for (let x = 0; x < house.width; x++) {
            const mapX = centerX + x - 1;
            const mapY = centerY + y - 1;
            if (mapX >= 0 && mapX < gs.mapWidth && mapY >= 0 && mapY < gs.mapHeight) {
                gs.map[mapY][mapX] = TILE_HOUSE;
            }
        }
    }
}

// ----------------------------------------
// Farmer fields
// ----------------------------------------
function createFarmerFields(gs) {
    const farmerHouse = gs.houses.find(h => h.type === 'farmer');
    if (!farmerHouse) return;

    const fx = farmerHouse.x;
    const fy = farmerHouse.y;

    for (let y = fy - 2; y < fy + 4; y++) {
        for (let x = fx + 3; x < fx + 11; x++) {
            if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                const pattern = (x + y) % 3;
                if (pattern === 0) gs.map[y][x] = TILE_TOMATO_FIELD;
                else if (pattern === 1) gs.map[y][x] = TILE_CARROT_FIELD;
                else gs.map[y][x] = TILE_PLOWED_SOIL;
            }
        }
    }
}

// ----------------------------------------
// Central plaza
// ----------------------------------------
function createCentralPlaza(gs) {
    const plazaCenterX = 45;
    const plazaCenterY = 30;
    const plazaSize = 12;

    gs.plazaCenter = { x: plazaCenterX, y: plazaCenterY };

    for (let y = plazaCenterY - plazaSize / 2; y <= plazaCenterY + plazaSize / 2; y++) {
        for (let x = plazaCenterX - plazaSize / 2; x <= plazaCenterX + plazaSize / 2; x++) {
            if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                const tile = gs.map[y][x];
                if (tile !== TILE_HOUSE && tile !== TILE_WATER) {
                    gs.map[y][x] = TILE_COBBLESTONE;
                }
            }
        }
    }

    // Fountain at center
    gs.map[plazaCenterY][plazaCenterX] = TILE_FOUNTAIN;

    // 4 benches near fountain
    gs.map[plazaCenterY - 3][plazaCenterX - 3] = TILE_BENCH;
    gs.map[plazaCenterY - 3][plazaCenterX + 3] = TILE_BENCH;
    gs.map[plazaCenterY + 3][plazaCenterX - 3] = TILE_BENCH;
    gs.map[plazaCenterY + 3][plazaCenterX + 3] = TILE_BENCH;

    // 4 lampposts at plaza corners
    gs.map[plazaCenterY - 5][plazaCenterX - 5] = TILE_LAMPPOST;
    gs.map[plazaCenterY - 5][plazaCenterX + 5] = TILE_LAMPPOST;
    gs.map[plazaCenterY + 5][plazaCenterX - 5] = TILE_LAMPPOST;
    gs.map[plazaCenterY + 5][plazaCenterX + 5] = TILE_LAMPPOST;
}

// ----------------------------------------
// Paths from plaza to houses
// ----------------------------------------
function createPathsFromPlaza(gs) {
    const plaza = gs.plazaCenter;

    // Paths from plaza to each house/zone
    createPath(gs, plaza.x, plaza.y, 15, 10);
    createPath(gs, plaza.x, plaza.y, 25, 12);
    createPath(gs, plaza.x, plaza.y, 55, 10);
    createPath(gs, plaza.x, plaza.y, 68, 14);
    createPath(gs, plaza.x, plaza.y, 75, 25);
    createPath(gs, plaza.x, plaza.y, 70, 35);
    createPath(gs, plaza.x, plaza.y, 60, 46);
    createPath(gs, plaza.x, plaza.y, 48, 48);
    createPath(gs, plaza.x, plaza.y, 20, 48);
    createPath(gs, plaza.x, plaza.y, 12, 40);
    createPath(gs, plaza.x, plaza.y, 30, 28);

    // Path from spawn to plaza
    createPath(gs, gs.player.x, gs.player.y, plaza.x, plaza.y);

    // Connecting paths between nearby houses
    createPath(gs, 15, 10, 25, 12);
    createPath(gs, 55, 10, 68, 14);
    createPath(gs, 75, 25, 70, 35);
    createPath(gs, 60, 46, 48, 48);
    createPath(gs, 20, 48, 12, 40);
}

// ----------------------------------------
// Create a 2-tile-wide path
// ----------------------------------------
function createPath(gs, x1, y1, x2, y2) {
    let currentX = Math.floor(x1);
    let currentY = Math.floor(y1);
    const targetX = Math.floor(x2);
    const targetY = Math.floor(y2);
    let lastDirection = null;

    while (currentX !== targetX || currentY !== targetY) {
        placePath(gs, currentX, currentY);

        const distX = targetX - currentX;
        const distY = targetY - currentY;
        let moveDirection = null;

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

        // Add adjacent tile for 2-wide path
        if (moveDirection === 'horizontal') {
            placePath(gs, currentX, currentY + 1);
        } else if (moveDirection === 'vertical') {
            placePath(gs, currentX + 1, currentY);
        }

        lastDirection = moveDirection;
    }

    // Final position
    placePath(gs, currentX, currentY);
    if (lastDirection === 'horizontal') {
        placePath(gs, currentX, currentY + 1);
    } else {
        placePath(gs, currentX + 1, currentY);
    }
}

function placePath(gs, x, y) {
    if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
        const tile = gs.map[y][x];
        // Don't overwrite houses, water, docks, fountain, bench, cobblestone, lamppost, fence
        if (tile !== TILE_HOUSE && tile !== TILE_WATER && tile !== TILE_DOCK &&
            tile !== TILE_FOUNTAIN && tile !== TILE_BENCH &&
            tile !== TILE_COBBLESTONE && tile !== TILE_LAMPPOST && tile !== TILE_FENCE) {
            gs.map[y][x] = TILE_PATH;
        }
    }
}

// ----------------------------------------
// Place lampposts along paths at regular intervals
// ----------------------------------------
function placeLamppostsOnPaths(gs) {
    const spacing = 8;  // one lamppost every 8 path tiles
    const placed = [];
    const minDist = 6;  // minimum distance between any two lampposts

    function isTooClose(x, y) {
        return placed.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < minDist);
    }

    function tryPlaceAdjacentToPath(px, py) {
        // Try to place on grass next to the path tile (alternating sides)
        const sides = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        for (const s of sides) {
            const lx = px + s.dx;
            const ly = py + s.dy;
            if (lx >= 1 && lx < gs.mapWidth - 1 && ly >= 1 && ly < gs.mapHeight - 1) {
                const tile = gs.map[ly][lx];
                if (tile === TILE_GRASS && !isTooClose(lx, ly)) {
                    gs.map[ly][lx] = TILE_LAMPPOST;
                    placed.push({ x: lx, y: ly });
                    return true;
                }
            }
        }
        return false;
    }

    // Collect all path tiles
    const pathTiles = [];
    for (let y = 0; y < gs.mapHeight; y++) {
        for (let x = 0; x < gs.mapWidth; x++) {
            if (gs.map[y][x] === TILE_PATH) {
                pathTiles.push({ x, y });
            }
        }
    }

    // Walk along path tiles and place lampposts at regular intervals
    const visited = new Set();
    const queue = [];

    // Start from first path tile found
    if (pathTiles.length > 0) {
        queue.push(pathTiles[0]);
        visited.add(`${pathTiles[0].x},${pathTiles[0].y}`);
    }

    let stepCount = 0;
    while (queue.length > 0) {
        const cur = queue.shift();
        stepCount++;

        // Place lamppost every N steps
        if (stepCount % spacing === 0) {
            tryPlaceAdjacentToPath(cur.x, cur.y);
        }

        // Explore neighboring path tiles (4-directional)
        const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        for (const d of dirs) {
            const nx = cur.x + d.dx;
            const ny = cur.y + d.dy;
            const key = `${nx},${ny}`;
            if (!visited.has(key) && nx >= 0 && nx < gs.mapWidth && ny >= 0 && ny < gs.mapHeight) {
                if (gs.map[ny][nx] === TILE_PATH || gs.map[ny][nx] === TILE_COBBLESTONE) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }

    // Also place lampposts around the plaza corners (if plaza exists)
    if (gs.plazaCenter) {
        const pcx = gs.plazaCenter.x;
        const pcy = gs.plazaCenter.y;
        const corners = [
            { x: pcx - 5, y: pcy - 5 }, { x: pcx + 5, y: pcy - 5 },
            { x: pcx - 5, y: pcy + 5 }, { x: pcx + 5, y: pcy + 5 }
        ];
        corners.forEach(c => {
            if (c.x >= 0 && c.x < gs.mapWidth && c.y >= 0 && c.y < gs.mapHeight) {
                if (!isTooClose(c.x, c.y)) {
                    const tile = gs.map[c.y][c.x];
                    if (tile === TILE_GRASS || tile === TILE_PATH || tile === TILE_COBBLESTONE) {
                        gs.map[c.y][c.x] = TILE_LAMPPOST;
                        placed.push({ x: c.x, y: c.y });
                    }
                }
            }
        });
    }
}

// ----------------------------------------
// Port creation
// ----------------------------------------
function createPort(gs) {
    let portX = 0;
    let portY = 0;

    // Try right side (water to the east)
    for (let y = 15; y < gs.mapHeight - 5; y++) {
        for (let x = gs.mapWidth - 15; x < gs.mapWidth - 5; x++) {
            if (x + 1 < gs.mapWidth && gs.map[y][x] === TILE_GRASS && gs.map[y][x + 1] === TILE_WATER) {
                let tooClose = false;
                for (const house of gs.houses) {
                    const dist = Math.sqrt((x - house.x) ** 2 + (y - house.y) ** 2);
                    if (dist < 8) { tooClose = true; break; }
                }
                if (!tooClose) {
                    portX = x; portY = y;
                    gs.waterDirection = 'east';
                    break;
                }
            }
        }
        if (portX !== 0) break;
    }

    // Fallback: try bottom side (water to the south)
    if (portX === 0) {
        for (let x = 15; x < gs.mapWidth - 15; x++) {
            for (let y = gs.mapHeight - 15; y < gs.mapHeight - 5; y++) {
                if (y + 1 < gs.mapHeight && gs.map[y][x] === TILE_GRASS && gs.map[y + 1][x] === TILE_WATER) {
                    let tooClose = false;
                    for (const house of gs.houses) {
                        const dist = Math.sqrt((x - house.x) ** 2 + (y - house.y) ** 2);
                        if (dist < 8) { tooClose = true; break; }
                    }
                    if (!tooClose) {
                        portX = x; portY = y;
                        gs.waterDirection = 'south';
                        break;
                    }
                }
            }
            if (portX !== 0) break;
        }
    }

    if (portX === 0) {
        console.log("ERROR: No valid port location found!");
        gs.portLocation = null;
        gs.waterDirection = null;
        return;
    }

    gs.portLocation = { x: portX, y: portY };

    // Create docks based on water orientation
    if (gs.waterDirection === 'east') {
        for (let y = portY - 3; y <= portY + 3; y++) {
            for (let x = portX - 1; x <= portX; x++) {
                if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                    if (gs.map[y][x] !== TILE_WATER) gs.map[y][x] = TILE_DOCK;
                }
            }
        }
        for (let i = 0; i < 3; i++) {
            const dockY = portY - 2 + i * 2;
            for (let x = portX + 1; x <= portX + 3; x++) {
                if (x >= 0 && x < gs.mapWidth && dockY >= 0 && dockY < gs.mapHeight) {
                    gs.map[dockY][x] = TILE_DOCK;
                }
            }
        }
    } else {
        for (let x = portX - 3; x <= portX + 3; x++) {
            for (let y = portY - 1; y <= portY; y++) {
                if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                    if (gs.map[y][x] !== TILE_WATER) gs.map[y][x] = TILE_DOCK;
                }
            }
        }
        for (let i = 0; i < 3; i++) {
            const dockX = portX - 2 + i * 2;
            for (let y = portY + 1; y <= portY + 3; y++) {
                if (dockX >= 0 && dockX < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                    gs.map[y][dockX] = TILE_DOCK;
                }
            }
        }
    }

    // Path from spawn to port
    createPath(gs, gs.player.x, gs.player.y, portX, portY - 3);
}

// ----------------------------------------
// Goat pen next to farmer fields
// ----------------------------------------
function createGoatPen(gs) {
    // Above-left of farmer fields, away from paths
    const penX = 73;
    const penY = 6;
    const penW = 6;
    const penH = 5;

    for (let x = penX; x < penX + penW; x++) {
        for (let y = penY; y < penY + penH; y++) {
            if (x < 0 || x >= gs.mapWidth || y < 0 || y >= gs.mapHeight) continue;

            const isEdge = x === penX || x === penX + penW - 1 ||
                           y === penY || y === penY + penH - 1;

            if (isEdge) {
                // Skip entrance gap on south side
                if (y === penY + penH - 1 && x === penX + 1) continue;
                gs.map[y][x] = TILE_FENCE;
            } else {
                gs.map[y][x] = TILE_GRASS;
            }
        }
    }

    // Replace water above the pen with grass (2 rows buffer)
    for (let y = penY - 2; y < penY; y++) {
        for (let x = penX - 1; x < penX + penW + 1; x++) {
            if (x >= 0 && x < gs.mapWidth && y >= 0 && y < gs.mapHeight) {
                if (gs.map[y][x] === TILE_WATER) {
                    gs.map[y][x] = TILE_GRASS;
                }
            }
        }
    }

    // Store pen bounds for animal clamping (interior only)
    gs.goatPenBounds = {
        x1: penX + 1,
        y1: penY + 1,
        x2: penX + penW - 2,
        y2: penY + penH - 2
    };
}

// ----------------------------------------
// Fishing pier on south coast (below port)
// ----------------------------------------
function createFishingSpot(gs) {
    const fisherHouse = gs.houses.find(h => h.type === 'fisher');
    if (!fisherHouse) return;

    // Place pier on south coast near fisher house x position
    const pierX = fisherHouse.x;

    // Scan south to find where water starts
    let waterEdge = -1;
    for (let y = gs.mapHeight - 15; y < gs.mapHeight; y++) {
        if (pierX >= 0 && pierX < gs.mapWidth && gs.map[y][pierX] === TILE_WATER) {
            waterEdge = y;
            break;
        }
    }
    if (waterEdge < 0) return;

    // Path tiles leading down to the water edge
    for (let y = waterEdge - 2; y < waterEdge; y++) {
        if (y >= 0 && y < gs.mapHeight) {
            gs.map[y][pierX] = TILE_PATH;
        }
    }

    // Dock tiles extending south into the water
    for (let y = waterEdge; y < waterEdge + 3 && y < gs.mapHeight; y++) {
        gs.map[y][pierX] = TILE_DOCK;
    }

    // Store pier location for fisher NPC placement
    gs.fishingPier = { x: pierX, y: waterEdge - 1 };

    // Path connecting fisher house to pier
    createPath(gs, fisherHouse.x, fisherHouse.y, pierX, waterEdge - 2);
}
