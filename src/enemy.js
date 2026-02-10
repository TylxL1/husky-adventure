// ========================================
// ENEMY - Creation, AI, drawing
// ========================================
import { TILE_SIZE, TILE_WATER, TILE_HOUSE, TILE_FLOWER } from './constants.js';

// ----------------------------------------
// Create enemies on the map
// ----------------------------------------
export function createEnemies(gs) {
    // No roaming enemies — only treasure chest guards are created in createTreasureChest
}

// ----------------------------------------
// Create treasure chest guards
// ----------------------------------------
export function createTreasureChest(gs) {
    // Place chest in bottom-right corner of the island
    let chestX = gs.mapWidth - 8;
    let chestY = gs.mapHeight - 10;

    while (gs.map[chestY] && gs.map[chestY][chestX] === TILE_WATER) {
        chestX--;
        if (chestX < gs.mapWidth - 20) {
            chestY--;
            chestX = gs.mapWidth - 12;
        }
    }

    gs.treasureChest = { x: chestX, y: chestY, opened: false };

    // Goblin guards
    const goblinPositions = [
        { x: chestX - 3, y: chestY },
        { x: chestX + 3, y: chestY }
    ];
    goblinPositions.forEach(pos => {
        gs.enemies.push({
            x: pos.x, y: pos.y,
            type: 'goblin',
            health: 8, maxHealth: 8,
            damage: 3, speed: 0.025,
            direction: 'down',
            animFrame: 0, animTimer: 0,
            moveTimer: Math.random() * 60,
            aggroRange: 5, isAggro: false,
            knockbackX: 0, knockbackY: 0,
            xpReward: 40
        });
    });

    // Evil green slimes
    const slimePositions = [
        { x: chestX, y: chestY - 3 },
        { x: chestX - 2, y: chestY + 2 },
        { x: chestX + 2, y: chestY + 2 }
    ];
    slimePositions.forEach(pos => {
        gs.enemies.push({
            x: pos.x, y: pos.y,
            type: 'slime',
            health: 4, maxHealth: 4,
            damage: 2, speed: 0.018,
            direction: 'down',
            animFrame: 0, animTimer: 0,
            moveTimer: Math.random() * 60,
            aggroRange: 5, isAggro: false,
            knockbackX: 0, knockbackY: 0,
            xpReward: 30
        });
    });
}

// ----------------------------------------
// Update enemies (AI + animation)
// ----------------------------------------
export function updateEnemies(gs, dt) {
    if (gs.insideHouse) return;

    gs.enemies.forEach(enemy => {
        // Animation
        enemy.animTimer += dt;
        if (enemy.animTimer > 15) {
            enemy.animFrame = (enemy.animFrame + 1) % 2;
            enemy.animTimer = 0;
        }

        // Apply knockback
        if (enemy.knockbackX !== 0 || enemy.knockbackY !== 0) {
            enemy.x += enemy.knockbackX * dt;
            enemy.y += enemy.knockbackY * dt;
            enemy.knockbackX *= Math.pow(0.8, dt);
            enemy.knockbackY *= Math.pow(0.8, dt);
            if (Math.abs(enemy.knockbackX) < 0.01) enemy.knockbackX = 0;
            if (Math.abs(enemy.knockbackY) < 0.01) enemy.knockbackY = 0;
            return;
        }

        // Distance to player
        const distX = gs.player.x - enemy.x;
        const distY = gs.player.y - enemy.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        // Aggro logic (invisibility potion prevents aggro)
        if (gs.activeEffects.invisibility.active) {
            enemy.isAggro = false;
        } else if (distance < enemy.aggroRange) {
            enemy.isAggro = true;
        } else if (distance > enemy.aggroRange * 2) {
            enemy.isAggro = false;
        }

        // Movement
        enemy.moveTimer += dt;

        if (enemy.isAggro && distance > 0.8) {
            // Chase player
            let moveX = distX / distance;
            let moveY = distY / distance;

            // Separation: push away from other enemies
            const separationDist = 2.0;
            gs.enemies.forEach(other => {
                if (other === enemy) return;
                const sepX = enemy.x - other.x;
                const sepY = enemy.y - other.y;
                const sepDist = Math.sqrt(sepX * sepX + sepY * sepY);
                if (sepDist < separationDist && sepDist > 0.01) {
                    const force = (separationDist - sepDist) / separationDist;
                    moveX += (sepX / sepDist) * force * 1.5;
                    moveY += (sepY / sepDist) * force * 1.5;
                }
            });

            // Normalize and apply movement
            const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
            if (moveLen > 0) {
                enemy.x += (moveX / moveLen) * enemy.speed * dt;
                enemy.y += (moveY / moveLen) * enemy.speed * dt;
            }

            if (Math.abs(moveX) > Math.abs(moveY)) {
                enemy.direction = moveX > 0 ? 'right' : 'left';
            } else {
                enemy.direction = moveY > 0 ? 'down' : 'up';
            }
        } else if (enemy.moveTimer % 90 < dt && !enemy.isAggro) {
            enemy.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        }

        // Random idle movement
        if (!enemy.isAggro && Math.random() < 0.02) {
            const moveAmt = enemy.speed * 0.5 * dt;
            switch (enemy.direction) {
                case 'up': enemy.y -= moveAmt; break;
                case 'down': enemy.y += moveAmt; break;
                case 'left': enemy.x -= moveAmt; break;
                case 'right': enemy.x += moveAmt; break;
            }
        }

        // Map bounds
        enemy.x = Math.max(5, Math.min(gs.mapWidth - 5, enemy.x));
        enemy.y = Math.max(5, Math.min(gs.mapHeight - 5, enemy.y));
    });
}

// ----------------------------------------
// Draw enemies
// ----------------------------------------
export function drawEnemies(ctx, gs) {
    if (gs.insideHouse) return;

    gs.enemies.forEach(enemy => {
        const screenX = (enemy.x - gs.camera.x) * TILE_SIZE;
        const screenY = (enemy.y - gs.camera.y) * TILE_SIZE;

        if (screenX < -TILE_SIZE || screenX > gs.canvas.width ||
            screenY < -TILE_SIZE || screenY > gs.canvas.height) return;

        const size = 28;
        const px = screenX + (TILE_SIZE - size) / 2;
        const py = screenY + (TILE_SIZE - size) / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4, size / 2, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (enemy.type === 'slime') {
            const bounce = Math.sin(enemy.animTimer * 0.3) * 3;

            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.ellipse(px + size / 2, py + size / 2 - bounce, size / 2 + 2, size / 2 - 2 + bounce / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.ellipse(px + size / 2 - 3, py + size / 2 - 5 - bounce, 6, 4, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(px + 8, py + size / 2 - 4 - bounce, 5, 5);
            ctx.fillRect(px + 16, py + size / 2 - 4 - bounce, 5, 5);
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 10, py + size / 2 - 2 - bounce, 2, 2);
            ctx.fillRect(px + 18, py + size / 2 - 2 - bounce, 2, 2);

        } else if (enemy.type === 'goblin') {
            const legAnim = enemy.animFrame * 2;

            ctx.fillStyle = '#228B22';
            ctx.fillRect(px + 8, py + 10, 12, 12);

            ctx.fillStyle = '#32CD32';
            ctx.fillRect(px + 6, py + 2, 16, 10);

            // Pointed ears
            ctx.fillRect(px + 2, py + 4, 5, 4);
            ctx.fillRect(px + 21, py + 4, 5, 4);

            // Red eyes
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(px + 8, py + 5, 4, 3);
            ctx.fillRect(px + 16, py + 5, 4, 3);
            ctx.fillStyle = '#000';
            ctx.fillRect(px + 9, py + 6, 2, 2);
            ctx.fillRect(px + 17, py + 6, 2, 2);

            // Legs
            ctx.fillStyle = '#1a6b1a';
            ctx.fillRect(px + 9, py + 22 - legAnim, 4, 6);
            ctx.fillRect(px + 15, py + 22 + legAnim, 4, 6);
        }

        // Health bar (if damaged)
        if (enemy.health < enemy.maxHealth) {
            const barWidth = 24;
            const barHeight = 4;
            const healthPercent = enemy.health / enemy.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(px + (size - barWidth) / 2, py - 8, barWidth, barHeight);

            ctx.fillStyle = healthPercent > 0.5 ? '#32CD32' : healthPercent > 0.25 ? '#FFA500' : '#FF0000';
            ctx.fillRect(px + (size - barWidth) / 2, py - 8, barWidth * healthPercent, barHeight);
        }

        // Aggro indicator
        if (enemy.isAggro) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('!', px + size / 2 - 3, py - 10);
        }
    });
}
