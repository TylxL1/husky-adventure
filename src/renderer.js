// ========================================
// RENDERER - Tile registry + entity drawing
// ========================================
import {
    TILE_SIZE, TILE_GRASS, TILE_PATH, TILE_TREE, TILE_HOUSE, TILE_WATER,
    TILE_FLOWER, TILE_ROCK, TILE_DOCK, TILE_BED, TILE_TABLE, TILE_CHAIR,
    TILE_CHEST, TILE_WORKBENCH, TILE_BOOKSHELF, TILE_COUNTER, TILE_SOFA,
    TILE_SHELF, TILE_HANGING_FISH, TILE_VEGETABLE_CRATE, TILE_BARREL,
    TILE_FISH_STALL, TILE_CARROT_CRATE, TILE_ANVIL, TILE_FORGE,
    TILE_POTION_SHELF, TILE_MEDICAL_BED, TILE_ALTAR, TILE_CHURCH_PEW,
    TILE_FOUNTAIN, TILE_BENCH, TILE_COBBLESTONE, TILE_LAMPPOST,
    TILE_TOMATO_FIELD, TILE_CARROT_FIELD, TILE_PLOWED_SOIL,
    TILE_SNOW, TILE_ICE, TILE_PINE_TREE, TILE_MOUNTAIN,
    JUMP_VISUAL_SCALE
} from './constants.js';

// ========================================
// Color utilities (exported for use by npc.js etc.)
// ========================================
export function lightenColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export function darkenColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ========================================
// Tile renderers
// ========================================

function renderGrass(ctx, sx, sy, x, y) {
    const grassVar = (x * 23 + y * 17) % 4;
    const grassColors = ['#4a9d5f', '#3d8d52', '#5aad6f', '#498c5e'];
    ctx.fillStyle = grassColors[grassVar];
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#2d6b40';
    for (let i = 0; i < 4; i++) {
        const px = ((x * 13 + y * 19 + i * 7) % 26) + 3;
        const py = ((x * 17 + y * 11 + i * 5) % 26) + 3;
        ctx.fillRect(sx + px, sy + py, 1, 2);
    }
}

function renderPath(ctx, sx, sy, x, y) {
    ctx.fillStyle = '#c9b590';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#b5a380';
    ctx.fillRect(sx, sy, TILE_SIZE, 1);
    ctx.fillRect(sx, sy + TILE_SIZE - 1, TILE_SIZE, 1);
    ctx.fillStyle = '#9d8b6f';
    const stones = ((x + y) % 3) + 1;
    for (let i = 0; i < stones; i++) {
        const px = ((x * 11 + y * 13 + i * 5) % 28) + 2;
        const py = ((x * 17 + y * 19 + i * 7) % 28) + 2;
        ctx.fillRect(sx + px, sy + py, 2, 2);
    }
}

function renderTree(ctx, sx, sy) {
    ctx.fillStyle = '#4a9d5f';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath(); ctx.ellipse(sx + 16, sy + 26, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6d4c28'; ctx.fillRect(sx + 13, sy + 16, 6, 10);
    ctx.fillStyle = '#8b6234'; ctx.fillRect(sx + 13, sy + 16, 2, 10);
    ctx.fillStyle = '#1a5a1a'; ctx.beginPath(); ctx.arc(sx + 16, sy + 14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d7d2d'; ctx.beginPath(); ctx.arc(sx + 15, sy + 12, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d9d3d'; ctx.beginPath(); ctx.arc(sx + 14, sy + 10, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4dbd4d'; ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 3, 0, Math.PI * 2); ctx.fill();
}

function renderWater(ctx, sx, sy, x, y) {
    const time = Date.now() * 0.001;
    const waterPhase = Math.sin((x + y + time * 2) * 0.5);
    ctx.fillStyle = waterPhase > 0 ? '#3a7ba8' : '#4a8bc8';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
    const wave = Math.sin((x * 0.5 + time * 3)) * 3;
    ctx.fillRect(sx + 6 + wave, sy + 8, 8, 2);
    ctx.fillRect(sx + 16 - wave, sy + 20, 8, 2);
}

function renderFlower(ctx, sx, sy, x, y) {
    ctx.fillStyle = '#4a9d5f'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath(); ctx.ellipse(sx + 16, sy + 20, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    const flowerType = (x * 11 + y * 13) % 3;
    const flowerColors = ['#ff6b9d', '#ff1493', '#ffc0cb'];
    ctx.fillStyle = flowerColors[flowerType];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const px = sx + 16 + Math.cos(angle) * 3;
        const py = sy + 15 + Math.sin(angle) * 3;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(sx + 16, sy + 15, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2d7440'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx + 16, sy + 17); ctx.lineTo(sx + 16, sy + 26); ctx.stroke();
}

function renderRock(ctx, sx, sy) {
    ctx.fillStyle = '#4a9d5f'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath(); ctx.ellipse(sx + 16, sy + 24, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#606060'; ctx.beginPath(); ctx.ellipse(sx + 17, sy + 18, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#909090'; ctx.beginPath(); ctx.ellipse(sx + 15, sy + 16, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b0b0b0'; ctx.beginPath(); ctx.ellipse(sx + 12, sy + 14, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#505050'; ctx.fillRect(sx + 18, sy + 17, 3, 2); ctx.fillRect(sx + 14, sy + 20, 2, 2);
}

function renderDock(ctx, sx, sy, x, y, gs) {
    // Background water check
    if (y < gs.mapHeight - 1 && gs.map[y + 1][x] === TILE_WATER) {
        const time = Date.now() * 0.001;
        const waterPhase = Math.sin((x + y + time * 2) * 0.5);
        ctx.fillStyle = waterPhase > 0 ? '#3a7ba8' : '#4a8bc8';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    }
    ctx.fillStyle = '#8B6914'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#A0791A';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx, sy + i * 11, TILE_SIZE, 10);
    ctx.strokeStyle = '#6B5010'; ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(sx, sy + i * 11); ctx.lineTo(sx + TILE_SIZE, sy + i * 11); ctx.stroke();
    }
    ctx.fillStyle = '#404040';
    for (let i = 0; i < 3; i++) { ctx.fillRect(sx + 4, sy + 2 + i * 11, 2, 2); ctx.fillRect(sx + 26, sy + 2 + i * 11, 2, 2); }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 2, sy + TILE_SIZE - 2, TILE_SIZE - 4, 2);
}

// Floor helper for interior tiles
function floor(ctx, sx, sy) {
    ctx.fillStyle = '#c9b590'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
}

// Neighbor detection for seamless multi-tile furniture
function adj(tile, x, y, gs) {
    if (!gs || !gs.map) return { l: false, r: false, u: false, d: false };
    return {
        l: x > 0 && gs.map[y][x - 1] === tile,
        r: x < gs.mapWidth - 1 && gs.map[y][x + 1] === tile,
        u: y > 0 && gs.map[y - 1][x] === tile,
        d: y < gs.mapHeight - 1 && gs.map[y + 1][x] === tile
    };
}

function renderBed(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_BED, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4, t = n.u ? 0 : 4, b = n.d ? T : T - 4;
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + l, sy + t, r - l, b - t);
    ctx.fillStyle = '#6495ED'; ctx.fillRect(sx + l + 3, sy + t + 3, r - l - 6, b - t - 6);
    if (!n.u) { ctx.fillStyle = '#f0f0f0'; ctx.fillRect(sx + l + 5, sy + t + 5, r - l - 10, 10); }
    if (!n.d) { ctx.fillStyle = '#4169E1'; ctx.fillRect(sx + l + 3, sy + b - 14, r - l - 6, 6); }
    if (!n.d) { ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(sx + l + 2, sy + b, r - l - 4, 2); }
}

function renderTable(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_TABLE, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 6, r = n.r ? T : T - 6;
    const t = n.u ? 12 : 14, b = n.d ? T : 36;
    ctx.fillStyle = '#d2691e'; ctx.fillRect(sx + l, sy + t, r - l, b - t);
    ctx.fillStyle = '#e88d3e'; ctx.fillRect(sx + l + 2, sy + t + 2, r - l - 4, 4);
    if (!n.d) {
        ctx.fillStyle = '#8b4513';
        if (!n.l) ctx.fillRect(sx + l + 2, sy + b, 4, 8);
        if (!n.r) ctx.fillRect(sx + r - 6, sy + b, 4, 8);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(sx + l + 2, sy + 42, r - l - 4, 2);
    }
}

function renderChair(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(sx + 12, sy + 24, 24, 12);
    ctx.fillRect(sx + 14, sy + 12, 20, 12);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + 14, sy + 36, 3, 6); ctx.fillRect(sx + 31, sy + 36, 3, 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(sx + 14, sy + 40, 20, 2);
}

function renderChest(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#4a3010'; ctx.fillRect(sx + 8, sy + 20, 32, 18);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + 8, sy + 16, 32, 6);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(sx + 22, sy + 26, 4, 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 10, sy + 40, 28, 2);
}

function renderWorkbench(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_WORKBENCH, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 6, r = n.r ? T : T - 6;
    ctx.fillStyle = '#808080'; ctx.fillRect(sx + l, sy + 16, r - l, 14);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + l + 2, sy + 30, r - l - 4, 6);
    ctx.fillStyle = '#b87333'; ctx.fillRect(sx + l + 6, sy + 20, 6, 3);
    if (r - l > 24) ctx.fillRect(sx + r - 12, sy + 22, 4, 4);
    ctx.fillStyle = '#4a3010';
    if (!n.l) ctx.fillRect(sx + l + 2, sy + 36, 4, 6);
    if (!n.r) ctx.fillRect(sx + r - 6, sy + 36, 4, 6);
}

function renderBookshelf(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_BOOKSHELF, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4, t = n.u ? 0 : 4, b = n.d ? T : T - 4;
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + l, sy + t, r - l, b - t);
    ctx.fillStyle = '#5a3318'; ctx.fillRect(sx + l + 2, sy + t + 2, r - l - 4, b - t - 4);
    const colors = ['#8b0000', '#00008b', '#228b22', '#8b4513', '#4b0082'];
    const rows = Math.max(1, Math.floor((b - t - 8) / 14));
    for (let i = 0; i < rows; i++) {
        const by = sy + t + 4 + i * Math.floor((b - t - 8) / rows);
        const rh = Math.floor((b - t - 8) / rows) - 3;
        if (rh < 4) continue;
        const bw = r - l - 8;
        for (let j = 0; j < 3; j++) {
            ctx.fillStyle = colors[(i * 3 + j) % colors.length];
            ctx.fillRect(sx + l + 4 + Math.floor(j * bw / 3), by, Math.floor(bw / 3) - 2, rh);
        }
        ctx.fillStyle = '#8b6914'; ctx.fillRect(sx + l + 2, by + rh, r - l - 4, 2);
    }
}

function renderCounter(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_COUNTER, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4;
    ctx.fillStyle = '#cd853f'; ctx.fillRect(sx + l, sy + 14, r - l, 24);
    ctx.fillStyle = '#daa520'; ctx.fillRect(sx + l, sy + 14, r - l, 6);
    ctx.fillStyle = '#f0e68c'; ctx.fillRect(sx + l + 2, sy + 16, r - l - 4, 2);
    ctx.fillStyle = '#8b6914';
    const hw = Math.floor((r - l - 4) / 2);
    ctx.fillRect(sx + l + 2, sy + 24, hw - 1, 10); ctx.fillRect(sx + l + hw + 3, sy + 24, hw - 1, 10);
}

function renderSofa(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_SOFA, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 8, r = n.r ? T : T - 8;
    // Back
    ctx.fillStyle = '#8b0000'; ctx.fillRect(sx + l, sy + 10, r - l, 12);
    // Cushion
    ctx.fillStyle = '#a52a2a'; ctx.fillRect(sx + l, sy + 22, r - l, 14);
    // Cushion highlight
    ctx.fillStyle = '#dc143c'; ctx.fillRect(sx + l + 4, sy + 14, r - l - 8, 6);
    // Armrests
    if (!n.l) { ctx.fillStyle = '#8b0000'; ctx.fillRect(sx + 2, sy + 10, 10, 28); }
    if (!n.r) { ctx.fillStyle = '#8b0000'; ctx.fillRect(sx + T - 12, sy + 10, 10, 28); }
    // Legs
    ctx.fillStyle = '#654321';
    if (!n.l) ctx.fillRect(sx + 4, sy + 38, 3, 5);
    if (!n.r) ctx.fillRect(sx + T - 7, sy + 38, 3, 5);
    if (!n.r) { ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + l, sy + 42, r - l, 2); }
}

function renderShelf(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + 4, sy + 4, 40, 42);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(sx + 6, sy + 10, 36, 3); ctx.fillRect(sx + 6, sy + 20, 36, 3);
    ctx.fillRect(sx + 6, sy + 30, 36, 3); ctx.fillRect(sx + 6, sy + 40, 36, 3);
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(sx + 8, sy + 12, 6, 7);
    ctx.fillStyle = '#4ecdc4'; ctx.fillRect(sx + 16, sy + 12, 6, 7);
    ctx.fillStyle = '#ffe66d'; ctx.fillRect(sx + 24, sy + 12, 6, 7);
    ctx.fillStyle = '#95e1d3'; ctx.fillRect(sx + 32, sy + 12, 6, 7);
    ctx.fillStyle = '#f38181'; ctx.fillRect(sx + 10, sy + 22, 7, 7);
    ctx.fillStyle = '#aa96da'; ctx.fillRect(sx + 20, sy + 22, 8, 7);
    ctx.fillStyle = '#fcbad3'; ctx.fillRect(sx + 30, sy + 22, 7, 7);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 6, sy + 44, 36, 2);
}

function renderHangingFish(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#708090'; ctx.fillRect(sx + 22, sy + 8, 2, 6);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(sx + 14, sy + 16, 20, 12);
    ctx.fillStyle = '#a8a8a8'; ctx.fillRect(sx + 16, sy + 18, 16, 8);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(sx + 12, sy + 20, 4, 4); ctx.fillRect(sx + 32, sy + 20, 4, 4);
    ctx.fillStyle = '#b0b0b0'; ctx.fillRect(sx + 34, sy + 18, 6, 8);
    ctx.fillStyle = '#000000'; ctx.fillRect(sx + 18, sy + 20, 2, 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(sx + 16, sy + 30, 18, 2);
}

function renderVegetableCrate(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#deb887'; ctx.fillRect(sx + 8, sy + 20, 32, 20);
    ctx.fillStyle = '#d2a679';
    ctx.fillRect(sx + 10, sy + 22, 3, 16); ctx.fillRect(sx + 16, sy + 22, 3, 16);
    ctx.fillRect(sx + 22, sy + 22, 3, 16); ctx.fillRect(sx + 28, sy + 22, 3, 16); ctx.fillRect(sx + 34, sy + 22, 3, 16);
    ctx.fillStyle = '#ff6347';
    ctx.fillRect(sx + 12, sy + 14, 6, 6); ctx.fillRect(sx + 20, sy + 16, 6, 6); ctx.fillRect(sx + 28, sy + 15, 6, 6);
    ctx.fillStyle = '#228b22';
    ctx.fillRect(sx + 14, sy + 12, 2, 3); ctx.fillRect(sx + 22, sy + 14, 2, 3); ctx.fillRect(sx + 30, sy + 13, 2, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 10, sy + 40, 28, 2);
}

function renderBarrel(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(sx + 12, sy + 16, 24, 24);
    ctx.fillStyle = '#696969';
    ctx.fillRect(sx + 10, sy + 18, 28, 3); ctx.fillRect(sx + 10, sy + 28, 28, 3); ctx.fillRect(sx + 10, sy + 36, 28, 3);
    ctx.fillStyle = '#654321';
    ctx.fillRect(sx + 16, sy + 18, 2, 20); ctx.fillRect(sx + 22, sy + 18, 2, 20); ctx.fillRect(sx + 28, sy + 18, 2, 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 14, sy + 40, 20, 2);
}

function renderFishStall(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_FISH_STALL, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4;
    ctx.fillStyle = '#8b6914'; ctx.fillRect(sx + l, sy + 16, r - l, 22);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + l, sy + 16, r - l, 3); ctx.fillRect(sx + l, sy + 35, r - l, 3);
    ctx.fillStyle = '#e0f7fa'; ctx.fillRect(sx + l + 2, sy + 20, r - l - 4, 14);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(sx + l + 6, sy + 24, 10, 4);
    if (r - l > 24) ctx.fillRect(sx + r - 16, sy + 26, 10, 4);
    ctx.fillStyle = '#a8a8a8'; ctx.fillRect(sx + l + 8, sy + 25, 6, 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + l + 2, sy + 38, r - l - 4, 2);
}

function renderCarrotCrate(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#deb887'; ctx.fillRect(sx + 8, sy + 24, 32, 16);
    ctx.fillStyle = '#d2a679';
    ctx.fillRect(sx + 10, sy + 26, 3, 12); ctx.fillRect(sx + 18, sy + 26, 3, 12);
    ctx.fillRect(sx + 26, sy + 26, 3, 12); ctx.fillRect(sx + 34, sy + 26, 3, 12);
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(sx + 12, sy + 18, 4, 8); ctx.fillRect(sx + 20, sy + 16, 4, 10); ctx.fillRect(sx + 28, sy + 17, 4, 9);
    ctx.fillStyle = '#32cd32';
    ctx.fillRect(sx + 13, sy + 16, 2, 4); ctx.fillRect(sx + 21, sy + 14, 2, 4); ctx.fillRect(sx + 29, sy + 15, 2, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 10, sy + 40, 28, 2);
}

function renderAnvil(ctx, sx, sy) {
    floor(ctx, sx, sy);
    ctx.fillStyle = '#2f4f4f'; ctx.fillRect(sx + 8, sy + 32, 32, 8);
    ctx.fillStyle = '#696969'; ctx.fillRect(sx + 10, sy + 20, 28, 12);
    ctx.fillRect(sx + 32, sy + 16, 10, 8);
    ctx.fillStyle = '#a9a9a9'; ctx.fillRect(sx + 12, sy + 22, 12, 3); ctx.fillRect(sx + 34, sy + 18, 4, 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(sx + 10, sy + 40, 28, 2);
}

function renderForge(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_FORGE, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4, t = n.u ? 0 : 4, b = n.d ? T : T - 4;
    ctx.fillStyle = '#696969'; ctx.fillRect(sx + l, sy + t, r - l, b - t);
    ctx.fillStyle = '#808080';
    const bh = Math.floor((b - t - 8) / 3);
    for (let i = 0; i < 3; i++) {
        const by = t + 4 + i * bh;
        ctx.fillRect(sx + l + 2, sy + by, (r - l - 4) / 2 - 1, bh - 2);
        ctx.fillRect(sx + l + (r - l) / 2 + 1, sy + by, (r - l - 4) / 2 - 1, bh - 2);
    }
    const fw = Math.min(20, r - l - 12), fh = Math.min(12, b - t - 12);
    ctx.fillStyle = '#ff4500'; ctx.fillRect(sx + (l + r) / 2 - fw / 2, sy + (t + b) / 2 - fh / 2 + 4, fw, fh);
    ctx.fillStyle = '#ff8c00'; ctx.fillRect(sx + (l + r) / 2 - 2, sy + (t + b) / 2 + 2, 4, fh / 2);
    if (!n.d) { ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + l + 2, sy + b, r - l - 4, 2); }
}

function renderPotionShelf(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_POTION_SHELF, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4, t = n.u ? 0 : 4, b = n.d ? T : T - 4;
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + l, sy + t, r - l, b - t);
    ctx.fillStyle = '#5a3318'; ctx.fillRect(sx + l + 2, sy + t + 2, r - l - 4, b - t - 4);
    const pc = [['#dc143c', '#ff69b4'], ['#1e90ff', '#87ceeb'], ['#32cd32', '#90ee90'], ['#9370db', '#dda0dd']];
    const rows = Math.max(1, Math.floor((b - t - 8) / 14));
    for (let i = 0; i < rows; i++) {
        const by = sy + t + 4 + i * Math.floor((b - t - 8) / rows);
        const rh = Math.floor((b - t - 8) / rows) - 3;
        if (rh < 4) continue;
        const bw = r - l - 8;
        const cnt = Math.max(1, Math.floor(bw / 10));
        for (let j = 0; j < cnt; j++) {
            const c = pc[(i * cnt + j) % pc.length];
            const px = sx + l + 4 + j * Math.floor(bw / cnt);
            ctx.fillStyle = c[0]; ctx.fillRect(px, by, 5, rh);
            ctx.fillStyle = c[1]; ctx.fillRect(px + 1, by + 1, 3, 3);
        }
        ctx.fillStyle = '#8b6914'; ctx.fillRect(sx + l + 2, by + rh, r - l - 4, 2);
    }
}

function renderMedicalBed(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_MEDICAL_BED, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4, t = n.u ? 0 : 4, b = n.d ? T : T - 4;
    ctx.fillStyle = '#a9a9a9'; ctx.fillRect(sx + l, sy + t, r - l, b - t);
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(sx + l + 3, sy + t + 3, r - l - 6, b - t - 6);
    if (!n.u) { ctx.fillStyle = '#fffaf0'; ctx.fillRect(sx + l + 5, sy + t + 5, r - l - 10, 8); }
    if (!n.u && !n.l) {
        ctx.fillStyle = '#dc143c';
        const cx = sx + (l + r) / 2 + 6, cy = sy + (t + b) / 2 + 4;
        ctx.fillRect(cx - 4, cy - 1, 8, 2); ctx.fillRect(cx - 1, cy - 4, 2, 8);
    }
    if (!n.d) {
        ctx.fillStyle = '#696969';
        if (!n.l) ctx.fillRect(sx + l + 2, sy + b, 3, 5);
        if (!n.r) ctx.fillRect(sx + r - 5, sy + b, 3, 5);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + l + 2, sy + b + 2, r - l - 4, 2);
    }
}

function renderAltar(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_ALTAR, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4;
    ctx.fillStyle = '#808080'; ctx.fillRect(sx + l, sy + 20, r - l, 22);
    ctx.fillStyle = '#d3d3d3'; ctx.fillRect(sx + l, sy + 18, r - l, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + l + 2, sy + 18, r - l - 4, 18);
    if (!n.l) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(sx + l + 16, sy + 8, 4, 12); ctx.fillRect(sx + l + 12, sy + 12, 12, 4);
        ctx.fillStyle = '#fff8dc'; ctx.fillRect(sx + l + 4, sy + 22, 3, 8);
        ctx.fillStyle = '#ff8c00'; ctx.fillRect(sx + l + 4, sy + 20, 3, 3);
    }
    if (!n.r) {
        ctx.fillStyle = '#fff8dc'; ctx.fillRect(sx + r - 7, sy + 22, 3, 8);
        ctx.fillStyle = '#ff8c00'; ctx.fillRect(sx + r - 7, sy + 20, 3, 3);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + l + 2, sy + 42, r - l - 4, 2);
}

function renderChurchPew(ctx, sx, sy, x, y, gs) {
    floor(ctx, sx, sy);
    const n = adj(TILE_CHURCH_PEW, x, y, gs);
    const T = TILE_SIZE;
    const l = n.l ? 0 : 4, r = n.r ? T : T - 4;
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + l, sy + 22, r - l, 14);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(sx + l, sy + 10, r - l, 12);
    ctx.fillStyle = '#654321';
    const slats = Math.max(1, Math.floor((r - l) / 8));
    for (let i = 0; i < slats; i++) ctx.fillRect(sx + l + 4 + i * 8, sy + 12, 2, 8);
    ctx.fillStyle = '#4a3010';
    if (!n.l) ctx.fillRect(sx + l + 2, sy + 36, 3, 6);
    if (!n.r) ctx.fillRect(sx + r - 5, sy + 36, 3, 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + l + 2, sy + 42, r - l - 4, 2);
}

function renderFountain(ctx, sx, sy) {
    ctx.fillStyle = '#4a9d5f'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#808080'; ctx.fillRect(sx + 8, sy + 20, 32, 20);
    ctx.fillStyle = '#a9a9a9';
    ctx.fillRect(sx + 8, sy + 20, 32, 4); ctx.fillRect(sx + 8, sy + 20, 4, 20);
    ctx.fillStyle = '#4682b4'; ctx.fillRect(sx + 12, sy + 24, 24, 14);
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(sx + 14, sy + 26, 8, 3); ctx.fillRect(sx + 26, sy + 30, 10, 3);
    ctx.fillStyle = '#696969'; ctx.fillRect(sx + 20, sy + 10, 8, 14);
    ctx.fillStyle = '#a9a9a9'; ctx.fillRect(sx + 18, sy + 8, 12, 4);
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(sx + 22, sy + 12, 2, 3); ctx.fillRect(sx + 16, sy + 15, 2, 3); ctx.fillRect(sx + 28, sy + 14, 2, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 10, sy + 40, 28, 3);
}

function renderBench(ctx, sx, sy) {
    ctx.fillStyle = '#4a9d5f'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(sx + 8, sy + 20, 32, 10);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + 10, sy + 22, 28, 2); ctx.fillRect(sx + 10, sy + 26, 28, 2);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(sx + 8, sy + 10, 32, 10);
    ctx.fillStyle = '#654321'; ctx.fillRect(sx + 10, sy + 12, 28, 2); ctx.fillRect(sx + 10, sy + 16, 28, 2);
    ctx.fillStyle = '#696969';
    ctx.fillRect(sx + 12, sy + 30, 4, 8); ctx.fillRect(sx + 32, sy + 30, 4, 8);
    ctx.fillRect(sx + 12, sy + 10, 4, 20); ctx.fillRect(sx + 32, sy + 10, 4, 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 10, sy + 38, 28, 3);
}

function renderCobblestone(ctx, sx, sy, x, y) {
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#808080'; ctx.fillRect(sx, sy, TILE_SIZE, 2); ctx.fillRect(sx, sy, 2, TILE_SIZE);
    ctx.fillStyle = '#b8b8b8'; ctx.fillRect(sx + 4, sy + 4, 18, 18);
    ctx.fillStyle = '#d0d0d0'; ctx.fillRect(sx + 26, sy + 26, 18, 18);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 2, 1); ctx.fillRect(sx + 2, sy + 2, 1, TILE_SIZE - 2);
}

function renderLamppost(ctx, sx, sy) {
    ctx.fillStyle = '#4a9d5f'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(sx + 20, sy + 12, 8, 32);
    ctx.fillStyle = '#404040'; ctx.fillRect(sx + 16, sy + 40, 16, 4);
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(sx + 14, sy + 6, 20, 8);
    ctx.fillStyle = '#ffdb58'; ctx.fillRect(sx + 18, sy + 8, 12, 8);
    ctx.fillStyle = '#fff5cc'; ctx.fillRect(sx + 20, sy + 10, 8, 3);
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(sx + 18, sy + 10, 2, 4); ctx.fillRect(sx + 28, sy + 10, 2, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(sx + 18, sy + 44, 12, 2);
}

function renderTomatoField(ctx, sx, sy) {
    ctx.fillStyle = '#6b4423'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(sx, sy + 10, TILE_SIZE, 4); ctx.fillRect(sx, sy + 22, TILE_SIZE, 4); ctx.fillRect(sx, sy + 34, TILE_SIZE, 4);
    ctx.fillStyle = '#228b22'; ctx.fillRect(sx + 10, sy + 16, 6, 8);
    ctx.fillStyle = '#ff6347'; ctx.fillRect(sx + 12, sy + 14, 4, 4);
    ctx.fillStyle = '#228b22'; ctx.fillRect(sx + 22, sy + 28, 6, 8);
    ctx.fillStyle = '#ff6347'; ctx.fillRect(sx + 24, sy + 26, 4, 4);
    ctx.fillStyle = '#228b22'; ctx.fillRect(sx + 34, sy + 40, 6, 8);
    ctx.fillStyle = '#ff6347'; ctx.fillRect(sx + 36, sy + 38, 4, 4);
}

function renderCarrotField(ctx, sx, sy) {
    ctx.fillStyle = '#6b4423'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(sx, sy + 10, TILE_SIZE, 4); ctx.fillRect(sx, sy + 22, TILE_SIZE, 4); ctx.fillRect(sx, sy + 34, TILE_SIZE, 4);
    ctx.fillStyle = '#32cd32';
    ctx.fillRect(sx + 8, sy + 12, 4, 6); ctx.fillRect(sx + 10, sy + 10, 4, 4);
    ctx.fillRect(sx + 20, sy + 24, 4, 6); ctx.fillRect(sx + 22, sy + 22, 4, 4);
    ctx.fillRect(sx + 32, sy + 36, 4, 6); ctx.fillRect(sx + 34, sy + 34, 4, 4);
    ctx.fillRect(sx + 14, sy + 40, 4, 6); ctx.fillRect(sx + 16, sy + 38, 4, 4);
}

function renderPlowedSoil(ctx, sx, sy) {
    ctx.fillStyle = '#6b4423'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#5a3a1e';
    for (let i = 0; i < 4; i++) ctx.fillRect(sx, sy + 8 + i * 12, TILE_SIZE, 4);
    ctx.fillStyle = '#7a5533';
    ctx.fillRect(sx + 8, sy + 14, 6, 4); ctx.fillRect(sx + 24, sy + 26, 6, 4); ctx.fillRect(sx + 36, sy + 38, 6, 4);
}

function renderSnow(ctx, sx, sy, x, y) {
    const snowVar = (x * 17 + y * 23) % 4;
    const snowColors = ['#f0f0f0', '#e8e8e8', '#f5f5f5', '#ebebeb'];
    ctx.fillStyle = snowColors[snowVar];
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Sparkle dots
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
        const px = ((x * 13 + y * 19 + i * 11) % 30) + 4;
        const py = ((x * 17 + y * 11 + i * 7) % 30) + 4;
        ctx.fillRect(sx + px, sy + py, 2, 2);
    }
    // Subtle shadow variation
    ctx.fillStyle = 'rgba(180, 200, 220, 0.15)';
    const sx2 = ((x * 7 + y * 13) % 20) + 6;
    const sy2 = ((x * 11 + y * 7) % 20) + 6;
    ctx.fillRect(sx + sx2, sy + sy2, 8, 4);
}

function renderIce(ctx, sx, sy, x, y) {
    ctx.fillStyle = '#add8e6';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Lighter blue variation
    ctx.fillStyle = '#c0e8f0';
    ctx.fillRect(sx + 4, sy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    // White crack lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    const seed = (x * 31 + y * 37) % 5;
    ctx.beginPath();
    ctx.moveTo(sx + 6 + seed * 3, sy + 4);
    ctx.lineTo(sx + 20 + seed * 2, sy + 18);
    ctx.lineTo(sx + 12 + seed, sy + 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 30 - seed * 2, sy + 8);
    ctx.lineTo(sx + 24 + seed, sy + 28);
    ctx.stroke();
    // Reflection highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(sx + 10, sy + 8, 12, 4);
}

function renderPineTree(ctx, sx, sy) {
    // Snow ground base
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath(); ctx.ellipse(sx + 16, sy + 38, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Brown trunk
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(sx + 14, sy + 30, 6, 10);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(sx + 14, sy + 30, 2, 10);
    // Dark green triangle layers (bottom to top)
    ctx.fillStyle = '#0d3b0d';
    ctx.beginPath(); ctx.moveTo(sx + 17, sy + 4); ctx.lineTo(sx + 6, sy + 20); ctx.lineTo(sx + 28, sy + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#145214';
    ctx.beginPath(); ctx.moveTo(sx + 17, sy + 10); ctx.lineTo(sx + 4, sy + 28); ctx.lineTo(sx + 30, sy + 28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a6b1a';
    ctx.beginPath(); ctx.moveTo(sx + 17, sy + 18); ctx.lineTo(sx + 4, sy + 34); ctx.lineTo(sx + 30, sy + 34); ctx.closePath(); ctx.fill();
    // Snow on tips
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 15, sy + 4, 4, 3);
    ctx.fillRect(sx + 6, sy + 18, 6, 3);
    ctx.fillRect(sx + 22, sy + 18, 6, 3);
    ctx.fillRect(sx + 4, sy + 26, 5, 3);
    ctx.fillRect(sx + 25, sy + 26, 5, 3);
}

function renderMountain(ctx, sx, sy, x, y, gs) {
    const n = adj(TILE_MOUNTAIN, x, y, gs);
    // Snow ground base
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Mountain body - gray/brown rocky peak
    const baseColor = ((x + y) % 2 === 0) ? '#696969' : '#5a5a5a';
    ctx.fillStyle = baseColor;
    if (n.l && n.r) {
        // Middle of range - flat top
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    } else if (!n.l && !n.r) {
        // Standalone peak
        ctx.beginPath(); ctx.moveTo(sx + 4, sy + TILE_SIZE); ctx.lineTo(sx + TILE_SIZE / 2, sy + 2);
        ctx.lineTo(sx + TILE_SIZE - 4, sy + TILE_SIZE); ctx.closePath(); ctx.fill();
    } else if (!n.l) {
        // Left edge
        ctx.beginPath(); ctx.moveTo(sx + 4, sy + TILE_SIZE); ctx.lineTo(sx + 12, sy + 2);
        ctx.lineTo(sx + TILE_SIZE, sy); ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE); ctx.closePath(); ctx.fill();
    } else {
        // Right edge
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + TILE_SIZE - 12, sy + 2);
        ctx.lineTo(sx + TILE_SIZE - 4, sy + TILE_SIZE); ctx.lineTo(sx, sy + TILE_SIZE); ctx.closePath(); ctx.fill();
    }
    // Darker rock cracks
    ctx.fillStyle = '#404040';
    ctx.fillRect(sx + 14, sy + 20, 2, 6);
    ctx.fillRect(sx + 22, sy + 14, 2, 8);
    // Lighter rock highlights
    ctx.fillStyle = '#808080';
    ctx.fillRect(sx + 8, sy + 16, 4, 2);
    ctx.fillRect(sx + 28, sy + 24, 4, 2);
    // Snow cap on top
    ctx.fillStyle = '#ffffff';
    if (n.l && n.r) {
        ctx.fillRect(sx, sy, TILE_SIZE, 8);
    } else if (!n.l && !n.r) {
        ctx.beginPath(); ctx.moveTo(sx + TILE_SIZE / 2 - 6, sy + 10); ctx.lineTo(sx + TILE_SIZE / 2, sy + 2);
        ctx.lineTo(sx + TILE_SIZE / 2 + 6, sy + 10); ctx.closePath(); ctx.fill();
    } else if (!n.l) {
        ctx.beginPath(); ctx.moveTo(sx + 6, sy + 10); ctx.lineTo(sx + 12, sy + 2);
        ctx.lineTo(sx + TILE_SIZE, sy); ctx.lineTo(sx + TILE_SIZE, sy + 8); ctx.lineTo(sx + 20, sy + 10); ctx.closePath(); ctx.fill();
    } else {
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + TILE_SIZE - 12, sy + 2);
        ctx.lineTo(sx + TILE_SIZE - 6, sy + 10); ctx.lineTo(sx, sy + 8); ctx.closePath(); ctx.fill();
    }
}

// ========================================
// Tile renderer registry
// ========================================
const tileRenderers = {
    [TILE_GRASS]: renderGrass,
    [TILE_PATH]: renderPath,
    [TILE_TREE]: renderTree,
    [TILE_WATER]: renderWater,
    [TILE_FLOWER]: renderFlower,
    [TILE_ROCK]: renderRock,
    [TILE_BED]: renderBed,
    [TILE_TABLE]: renderTable,
    [TILE_CHAIR]: renderChair,
    [TILE_CHEST]: renderChest,
    [TILE_WORKBENCH]: renderWorkbench,
    [TILE_BOOKSHELF]: renderBookshelf,
    [TILE_COUNTER]: renderCounter,
    [TILE_SOFA]: renderSofa,
    [TILE_SHELF]: renderShelf,
    [TILE_HANGING_FISH]: renderHangingFish,
    [TILE_VEGETABLE_CRATE]: renderVegetableCrate,
    [TILE_BARREL]: renderBarrel,
    [TILE_FISH_STALL]: renderFishStall,
    [TILE_CARROT_CRATE]: renderCarrotCrate,
    [TILE_ANVIL]: renderAnvil,
    [TILE_FORGE]: renderForge,
    [TILE_POTION_SHELF]: renderPotionShelf,
    [TILE_MEDICAL_BED]: renderMedicalBed,
    [TILE_ALTAR]: renderAltar,
    [TILE_CHURCH_PEW]: renderChurchPew,
    [TILE_FOUNTAIN]: renderFountain,
    [TILE_BENCH]: renderBench,
    [TILE_COBBLESTONE]: renderCobblestone,
    [TILE_LAMPPOST]: renderLamppost,
    [TILE_TOMATO_FIELD]: renderTomatoField,
    [TILE_CARROT_FIELD]: renderCarrotField,
    [TILE_PLOWED_SOIL]: renderPlowedSoil,
    [TILE_SNOW]: renderSnow,
    [TILE_ICE]: renderIce,
    [TILE_PINE_TREE]: renderPineTree,
    [TILE_MOUNTAIN]: renderMountain
};

// ========================================
// Public draw functions
// ========================================

export function drawTile(ctx, tile, screenX, screenY, x, y, gs) {
    if (tile === TILE_HOUSE) {
        drawHouseTile3D(ctx, screenX, screenY, x, y, gs);
        return;
    }
    if (tile === TILE_DOCK) {
        renderDock(ctx, screenX, screenY, x, y, gs);
        return;
    }
    const renderer = tileRenderers[tile];
    if (renderer) renderer(ctx, screenX, screenY, x, y, gs);
}

export function drawMap(ctx, gs) {
    const startX = Math.floor(gs.camera.x);
    const startY = Math.floor(gs.camera.y);
    const endX = Math.min(startX + gs.viewportTilesX + 2, gs.mapWidth);
    const endY = Math.min(startY + gs.viewportTilesY + 2, gs.mapHeight);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const screenX = (x - gs.camera.x) * TILE_SIZE;
            const screenY = (y - gs.camera.y) * TILE_SIZE;
            drawTile(ctx, gs.map[y][x], screenX, screenY, x, y, gs);
        }
    }
}

// ----------------------------------------
// House 3D tile
// ----------------------------------------
function drawHouseTile3D(ctx, screenX, screenY, x, y, gs) {
    let houseInfo = null;
    for (const house of gs.houses) {
        if (x >= house.x - 1 && x < house.x + house.width - 1 &&
            y >= house.y - 1 && y < house.y + house.height - 1) {
            houseInfo = { house, localX: x - (house.x - 1), localY: y - (house.y - 1) };
            break;
        }
    }
    if (!houseInfo) return;

    const { localX, localY } = houseInfo;
    ctx.fillStyle = '#4a9d5f'; ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    if (localY === 0) {
        // Roof
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 2, TILE_SIZE - 2, 3);
        ctx.fillStyle = '#a52a2a'; ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE - 2);
        ctx.fillStyle = '#8b0000'; ctx.fillRect(screenX, screenY + 4, TILE_SIZE, 3);
        ctx.fillStyle = '#7d0000';
        for (let i = 0; i < 4; i++) { ctx.fillRect(screenX + i * 8, screenY + 2, 7, 2); ctx.fillRect(screenX + i * 8, screenY + 8, 7, 2); }
        if (localX === 1) {
            // Chimney
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(screenX + 22, screenY + 16, 8, 2);
            ctx.fillStyle = '#654321'; ctx.fillRect(screenX + 20, screenY, 8, 14);
            ctx.fillStyle = '#8b5a3c'; ctx.fillRect(screenX + 20, screenY, 2, 14);
            ctx.fillStyle = '#4a3219'; ctx.fillRect(screenX + 20, screenY, 8, 2);
        }
    } else {
        // Wall
        ctx.fillStyle = '#d2a679'; ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(screenX, screenY + TILE_SIZE - 2, TILE_SIZE, 2);
        ctx.fillStyle = '#c49866';
        ctx.fillRect(screenX + 6, screenY, 2, TILE_SIZE); ctx.fillRect(screenX + 14, screenY, 2, TILE_SIZE); ctx.fillRect(screenX + 22, screenY, 2, TILE_SIZE);

        // Windows
        if (localY === 1 && (localX === 0 || localX === 2)) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.fillRect(screenX + 11, screenY + 11, 10, 10);
            ctx.fillStyle = '#87ceeb'; ctx.fillRect(screenX + 10, screenY + 10, 10, 10);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fillRect(screenX + 10, screenY + 10, 5, 5);
            ctx.strokeStyle = '#654321'; ctx.lineWidth = 2; ctx.strokeRect(screenX + 10, screenY + 10, 10, 10);
            ctx.beginPath(); ctx.moveTo(screenX + 15, screenY + 10); ctx.lineTo(screenX + 15, screenY + 20);
            ctx.moveTo(screenX + 10, screenY + 15); ctx.lineTo(screenX + 20, screenY + 15); ctx.stroke();
        }

        // Door
        if (localY === 2 && localX === 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(screenX + 11, screenY + 6, 12, 20);
            ctx.fillStyle = '#654321'; ctx.fillRect(screenX + 10, screenY + 5, 12, 20);
            ctx.fillStyle = '#7d5a3c'; ctx.fillRect(screenX + 10, screenY + 5, 2, 20);
            ctx.fillStyle = '#5a3a1f';
            ctx.fillRect(screenX + 10, screenY + 7, 12, 2); ctx.fillRect(screenX + 10, screenY + 14, 12, 2); ctx.fillRect(screenX + 10, screenY + 21, 12, 2);
            // Door handle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.arc(screenX + 17, screenY + 17, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(screenX + 16, screenY + 16, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(screenX + 15.5, screenY + 15.5, 1, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// ----------------------------------------
// Draw boats
// ----------------------------------------
export function drawBoats(ctx, gs) {
    gs.boats.forEach(boat => {
        const screenX = (boat.x - gs.camera.x) * TILE_SIZE;
        const screenY = (boat.y - gs.camera.y) * TILE_SIZE;
        const bob = Math.sin(boat.bobTimer * 0.05) * 2;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath(); ctx.ellipse(screenX + 16, screenY + 20, 20, 6, 0, 0, Math.PI * 2); ctx.fill();

        // Hull
        ctx.fillStyle = boat.color;
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 8 + bob); ctx.lineTo(screenX + 24, screenY + 8 + bob);
        ctx.lineTo(screenX + 28, screenY + 16 + bob); ctx.lineTo(screenX + 4, screenY + 16 + bob);
        ctx.closePath(); ctx.fill();

        // Light side
        ctx.fillStyle = lightenColor(boat.color, 30);
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 8 + bob); ctx.lineTo(screenX + 16, screenY + 8 + bob);
        ctx.lineTo(screenX + 16, screenY + 16 + bob); ctx.lineTo(screenX + 4, screenY + 16 + bob);
        ctx.closePath(); ctx.fill();

        // Border
        ctx.strokeStyle = darkenColor(boat.color, 30); ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 8 + bob); ctx.lineTo(screenX + 24, screenY + 8 + bob);
        ctx.lineTo(screenX + 28, screenY + 16 + bob); ctx.lineTo(screenX + 4, screenY + 16 + bob);
        ctx.closePath(); ctx.stroke();

        // Benches
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(screenX + 10, screenY + 10 + bob, 12, 2);
        ctx.fillRect(screenX + 10, screenY + 13 + bob, 12, 2);

        // Mooring rope
        ctx.strokeStyle = '#8B7355'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(screenX + 28, screenY + 16 + bob); ctx.lineTo(screenX + 16, screenY - 10); ctx.stroke();
    });
}

// ----------------------------------------
// Draw treasure chest
// ----------------------------------------
export function drawTreasureChest(ctx, gs) {
    if (!gs.treasureChest || gs.insideHouse) return;

    const screenX = (gs.treasureChest.x - gs.camera.x) * TILE_SIZE;
    const screenY = (gs.treasureChest.y - gs.camera.y) * TILE_SIZE;

    if (screenX < -TILE_SIZE || screenX > gs.canvas.width ||
        screenY < -TILE_SIZE || screenY > gs.canvas.height) return;

    const cx = screenX + TILE_SIZE / 2;
    const cy = screenY + TILE_SIZE / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 12, 18, 8, 0, 0, Math.PI * 2); ctx.fill();

    if (gs.treasureChest.opened) {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(cx - 16, cy - 4, 32, 18);
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.strokeRect(cx - 16, cy - 4, 32, 18);
        ctx.fillStyle = '#A0522D'; ctx.fillRect(cx - 14, cy - 18, 28, 14);
        ctx.strokeStyle = '#FFD700'; ctx.strokeRect(cx - 14, cy - 18, 28, 14);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(cx - 12, cy, 24, 10);
    } else {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(cx - 16, cy - 8, 32, 22);
        ctx.fillStyle = '#A0522D'; ctx.beginPath(); ctx.ellipse(cx, cy - 8, 16, 8, 0, Math.PI, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
        ctx.strokeRect(cx - 16, cy - 8, 32, 22);
        ctx.beginPath(); ctx.ellipse(cx, cy - 8, 16, 8, 0, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#FFD700'; ctx.fillRect(cx - 4, cy, 8, 6);
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy + 3, 2, 0, Math.PI * 2); ctx.fill();
        const glow = Math.sin(Date.now() * 0.005) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(255, 215, 0, ${glow})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, cy, 22, 18, 0, 0, Math.PI * 2); ctx.stroke();
    }
}

// ----------------------------------------
// Draw player (husky)
// ----------------------------------------
export function drawPlayer(ctx, gs) {
    const screenX = (gs.player.x - gs.camera.x) * TILE_SIZE;
    const screenY = (gs.player.y - gs.camera.y) * TILE_SIZE - gs.player.jumpHeight * JUMP_VISUAL_SCALE;
    const centerOffsetX = (TILE_SIZE - gs.player.size) / 2;
    const centerOffsetY = (TILE_SIZE - gs.player.size) / 2;

    // Jump shadow
    const shadowOpacity = 0.3 + (gs.player.jumpHeight * 0.02);
    const shadowScale = 1 - (gs.player.jumpHeight * 0.03);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
    ctx.save();
    ctx.translate(screenX + TILE_SIZE / 2, (gs.player.y - gs.camera.y) * TILE_SIZE + TILE_SIZE / 2);
    ctx.scale(shadowScale, shadowScale * 0.5);
    ctx.beginPath(); ctx.arc(0, 0, gs.player.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const px = screenX + centerOffsetX;
    const py = screenY + centerOffsetY;

    const huskyGrayDark = '#4a5568';
    const huskyGray = '#718096';
    const huskyWhite = '#ffffff';
    const huskyBlue = '#3b82f6';
    const huskyPink = '#fdb2b2';

    // Backpack
    if (gs.player.direction !== 'up') {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(px + 8, py + 22, 12, 10);
        ctx.fillStyle = '#654321'; ctx.fillRect(px + 9, py + 23, 10, 8);
        ctx.fillRect(px + 10, py + 18, 2, 6); ctx.fillRect(px + 18, py + 18, 2, 6);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(px + 13, py + 24, 4, 2);
    }

    // Ears
    ctx.fillStyle = huskyGrayDark;
    ctx.fillRect(px + 5, py + 6, 6, 8); ctx.fillRect(px + 25, py + 6, 6, 8);
    ctx.fillStyle = huskyPink;
    ctx.fillRect(px + 6, py + 8, 4, 5); ctx.fillRect(px + 26, py + 8, 4, 5);

    // Head
    ctx.fillStyle = huskyGrayDark; ctx.fillRect(px + 8, py + 8, 20, 16);
    ctx.fillStyle = huskyWhite;
    ctx.fillRect(px + 14, py + 8, 8, 6);
    ctx.fillRect(px + 10, py + 12, 8, 5); ctx.fillRect(px + 18, py + 12, 8, 5);

    // Eyes
    ctx.fillStyle = huskyWhite;
    ctx.fillRect(px + 11, py + 12, 6, 5); ctx.fillRect(px + 19, py + 12, 6, 5);

    const eyeOffset = gs.player.direction === 'right' ? 2 : gs.player.direction === 'left' ? -2 : 0;
    ctx.fillStyle = huskyBlue;
    ctx.fillRect(px + 12 + eyeOffset, py + 13, 4, 3); ctx.fillRect(px + 20 + eyeOffset, py + 13, 4, 3);
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 13 + eyeOffset, py + 14, 2, 2); ctx.fillRect(px + 21 + eyeOffset, py + 14, 2, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 14 + eyeOffset, py + 13, 1, 1); ctx.fillRect(px + 22 + eyeOffset, py + 13, 1, 1);

    // Snout
    ctx.fillStyle = huskyWhite; ctx.fillRect(px + 12, py + 17, 12, 6);
    ctx.fillStyle = '#000'; ctx.fillRect(px + 15, py + 18, 6, 4);
    ctx.fillStyle = '#333'; ctx.fillRect(px + 16, py + 19, 4, 2);

    // Body
    ctx.fillStyle = huskyGrayDark; ctx.fillRect(px + 9, py + 24, 18, 8);
    ctx.fillStyle = huskyWhite; ctx.fillRect(px + 12, py + 26, 12, 6);

    // Legs
    const legOffset = gs.player.animFrame * 2;
    if (gs.player.direction === 'down' || gs.player.direction === 'up') {
        ctx.fillStyle = huskyGray;
        ctx.fillRect(px + 10, py + 32 - legOffset, 6, 5); ctx.fillRect(px + 20, py + 32 + legOffset, 6, 5);
        ctx.fillStyle = huskyWhite;
        ctx.fillRect(px + 10, py + 35 - legOffset, 6, 2); ctx.fillRect(px + 20, py + 35 + legOffset, 6, 2);
    } else {
        ctx.fillStyle = huskyGray;
        ctx.fillRect(px + 10, py + 32, 6, 5); ctx.fillRect(px + 20, py + 32, 6, 5);
        ctx.fillStyle = huskyWhite;
        ctx.fillRect(px + 10, py + 35, 6, 2); ctx.fillRect(px + 20, py + 35, 6, 2);
    }

    // Tail
    const tailWag = Math.sin(Date.now() * 0.008 + legOffset) * 2;
    if (gs.player.direction === 'left') {
        ctx.fillStyle = huskyGrayDark; ctx.fillRect(px + 27, py + 24 + tailWag, 8, 4);
        ctx.fillStyle = huskyWhite; ctx.fillRect(px + 32, py + 25 + tailWag, 3, 2);
    } else if (gs.player.direction === 'right') {
        ctx.fillStyle = huskyGrayDark; ctx.fillRect(px + 1, py + 24 + tailWag, 8, 4);
        ctx.fillStyle = huskyWhite; ctx.fillRect(px + 1, py + 25 + tailWag, 3, 2);
    } else {
        ctx.fillStyle = huskyGrayDark; ctx.fillRect(px + 14, py + 30 + Math.abs(tailWag), 8, 5);
        ctx.fillStyle = huskyWhite; ctx.fillRect(px + 16, py + 33 + Math.abs(tailWag), 4, 2);
    }
}

// ----------------------------------------
// Draw attack animation
// ----------------------------------------
export function drawAttack(ctx, gs) {
    if (!gs.player.isAttacking) return;

    const screenX = (gs.player.x - gs.camera.x) * TILE_SIZE;
    const screenY = (gs.player.y - gs.camera.y) * TILE_SIZE - gs.player.jumpHeight * JUMP_VISUAL_SCALE;
    const attackProgress = 1 - (gs.player.attackTimer / gs.player.attackDuration);
    const swingAngle = attackProgress * Math.PI * 0.8;

    ctx.save();
    ctx.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

    let baseAngle = 0;
    switch (gs.player.direction) {
        case 'right': baseAngle = 0; break;
        case 'down': baseAngle = Math.PI / 2; break;
        case 'left': baseAngle = Math.PI; break;
        case 'up': baseAngle = -Math.PI / 2; break;
    }
    ctx.rotate(baseAngle + swingAngle - Math.PI / 4);

    const swordLength = 22; const swordWidth = 4;
    ctx.fillStyle = '#C0C0C0'; ctx.fillRect(8, -swordWidth / 2, swordLength, swordWidth);
    ctx.beginPath(); ctx.moveTo(8 + swordLength, -swordWidth / 2);
    ctx.lineTo(8 + swordLength + 5, 0); ctx.lineTo(8 + swordLength, swordWidth / 2);
    ctx.fill();
    ctx.fillStyle = '#8B4513'; ctx.fillRect(5, -6, 4, 12);
    ctx.fillStyle = '#654321'; ctx.fillRect(-4, -2, 10, 4);
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 28, -swingAngle, 0); ctx.stroke();

    ctx.restore();
}

// ----------------------------------------
// Draw shield
// ----------------------------------------
export function drawShield(ctx, gs) {
    if (!gs.player.isBlocking || !gs.weapons['Rusty Shield'] || gs.player.shieldBroken) return;

    const screenX = (gs.player.x - gs.camera.x) * TILE_SIZE;
    const screenY = (gs.player.y - gs.camera.y) * TILE_SIZE - gs.player.jumpHeight * JUMP_VISUAL_SCALE;

    ctx.save();
    ctx.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

    let offsetX = 0, offsetY = 0;
    switch (gs.player.direction) {
        case 'right': offsetX = 14; break;
        case 'left': offsetX = -14; break;
        case 'down': offsetY = 14; break;
        case 'up': offsetY = -14; break;
    }
    ctx.translate(offsetX, offsetY);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath(); ctx.ellipse(1, 1, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#A0A0A0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(-1.5, -10, 3, 20); ctx.fillRect(-8, -1.5, 16, 3);
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();

    const durabilityPercent = gs.player.shieldDurability / gs.player.shieldMaxDurability;
    let auraColor;
    if (durabilityPercent > 0.6) auraColor = 'rgba(100, 200, 255, 0.4)';
    else if (durabilityPercent > 0.3) auraColor = 'rgba(255, 200, 100, 0.4)';
    else auraColor = 'rgba(255, 100, 100, 0.5)';

    ctx.strokeStyle = auraColor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();
}
