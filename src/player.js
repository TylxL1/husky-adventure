// ========================================
// PLAYER - Movement, physics, collision, animation
// ========================================
import {
    SOLID_TILES, NPC_SOLID_TILES, TILE_WATER,
    COLLISION_RADIUS, WALL_BOUNCE, VELOCITY_THRESHOLD, DIAGONAL_FACTOR,
    GRAVITY, JUMP_VISUAL_SCALE
} from './constants.js';

// ----------------------------------------
// Collision helpers
// ----------------------------------------
export function canWalkOn(gs, x, y) {
    const points = [
        { x, y },
        { x: x - COLLISION_RADIUS, y: y - COLLISION_RADIUS },
        { x: x + COLLISION_RADIUS, y: y - COLLISION_RADIUS },
        { x: x - COLLISION_RADIUS, y: y + COLLISION_RADIUS },
        { x: x + COLLISION_RADIUS, y: y + COLLISION_RADIUS }
    ];

    for (const pt of points) {
        const tileX = Math.floor(pt.x);
        const tileY = Math.floor(pt.y);

        if (tileX < 0 || tileX >= gs.mapWidth || tileY < 0 || tileY >= gs.mapHeight) {
            return false;
        }

        const tile = gs.map[tileY][tileX];
        if (gs.insideHouse) {
            // Inside houses: walls and furniture are solid
            if (SOLID_TILES.has(tile)) return false;
        } else {
            // Outside: only water blocks movement
            if (tile === TILE_WATER) return false;
        }
    }
    return true;
}

export function canNPCWalkOn(gs, x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    if (tileX < 0 || tileX >= gs.mapWidth || tileY < 0 || tileY >= gs.mapHeight) {
        return false;
    }

    const tile = gs.map[tileY][tileX];
    return !NPC_SOLID_TILES.has(tile);
}

// ----------------------------------------
// Movement
// ----------------------------------------
export function handlePlayerMovement(gs, dt) {
    // Block movement during intro, level-up choice, or storage
    if (gs.levelUpChoice || gs.introActive || gs.storageOpen || gs.sleepAnim.active) return;

    let inputX = 0;
    let inputY = 0;

    if (gs.keys['z']) { inputY -= 1; gs.player.direction = 'up'; }
    if (gs.keys['s']) { inputY += 1; gs.player.direction = 'down'; }
    if (gs.keys['q']) { inputX -= 1; gs.player.direction = 'left'; }
    if (gs.keys['d']) { inputX += 1; gs.player.direction = 'right'; }

    if (inputX !== 0 && inputY !== 0) {
        inputX *= DIAGONAL_FACTOR;
        inputY *= DIAGONAL_FACTOR;
    }

    if (inputX !== 0 || inputY !== 0) {
        gs.player.velocityX += inputX * gs.player.acceleration * dt;
        gs.player.velocityY += inputY * gs.player.acceleration * dt;
    }

    gs.player.velocityX *= Math.pow(gs.player.momentum, dt);
    gs.player.velocityY *= Math.pow(gs.player.momentum, dt);

    const currentSpeed = Math.sqrt(
        gs.player.velocityX ** 2 + gs.player.velocityY ** 2
    );

    // Speed potion boost
    const speedMultiplier = gs.activeEffects.speed.active ? 2.0 : 1.0;
    const effectiveMaxSpeed = gs.player.maxSpeed * speedMultiplier;

    if (currentSpeed > effectiveMaxSpeed) {
        const scale = effectiveMaxSpeed / currentSpeed;
        gs.player.velocityX *= scale;
        gs.player.velocityY *= scale;
    }

    gs.player.velocityX *= Math.pow(gs.player.friction, dt);
    gs.player.velocityY *= Math.pow(gs.player.friction, dt);

    if (Math.abs(gs.player.velocityX) < VELOCITY_THRESHOLD) gs.player.velocityX = 0;
    if (Math.abs(gs.player.velocityY) < VELOCITY_THRESHOLD) gs.player.velocityY = 0;

    const newX = gs.player.x + gs.player.velocityX * dt;
    const newY = gs.player.y + gs.player.velocityY * dt;

    if (canWalkOn(gs, newX, gs.player.y)) {
        gs.player.x = newX;
    } else {
        gs.player.velocityX *= WALL_BOUNCE;
    }

    if (canWalkOn(gs, gs.player.x, newY)) {
        gs.player.y = newY;
    } else {
        gs.player.velocityY *= WALL_BOUNCE;
    }
}

// ----------------------------------------
// Jump
// ----------------------------------------
export function handleJump(gs, dt) {
    if (gs.player.isJumping) {
        gs.player.jumpHeight += gs.player.jumpSpeed * dt;
        gs.player.jumpSpeed -= GRAVITY * dt;

        if (gs.player.jumpHeight <= 0) {
            gs.player.jumpHeight = 0;
            gs.player.jumpSpeed = 0;
            gs.player.isJumping = false;
        }
    }
}

// ----------------------------------------
// Animation
// ----------------------------------------
export function updatePlayerAnimation(gs, dt) {
    if (Math.abs(gs.player.velocityX) > 0.01 || Math.abs(gs.player.velocityY) > 0.01) {
        gs.player.animTimer += dt;
        if (gs.player.animTimer > 7) {
            gs.player.animFrame = (gs.player.animFrame + 1) % 2;
            gs.player.animTimer = 0;
        }
    } else {
        gs.player.animFrame = 0;
        gs.player.animTimer = 0;
    }
}
