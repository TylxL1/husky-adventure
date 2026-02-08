// ========================================
// ENEMY - Creation, AI, drawing
// ========================================
import { TILE_SIZE, TILE_WATER, TILE_HOUSE, TILE_FLOWER } from './constants.js';

// ----------------------------------------
// Create enemies on the map
// ----------------------------------------
export function createEnemies(gs) {
    const numEnemies = 15;

    for (let i = 0; i < numEnemies; i++) {
        let x, y;
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 100) {
            x = Math.random() * (gs.mapWidth - 20) + 10;
            y = Math.random() * (gs.mapHeight - 20) + 10;

            validPosition = true;
            for (const house of gs.houses) {
                const distX = Math.abs(x - (house.x + 1.5));
                const distY = Math.abs(y - (house.y + 1.5));
                if (distX < 10 && distY < 10) { validPosition = false; break; }
            }

            if (validPosition) {
                const tileType = gs.map[Math.floor(y)]?.[Math.floor(x)];
                if (tileType === TILE_WATER || tileType === TILE_HOUSE || tileType === TILE_FLOWER) {
                    validPosition = false;
                }
            }

            if (validPosition) {
                const distFromSpawn = Math.sqrt(Math.pow(x - 40, 2) + Math.pow(y - 22, 2));
                if (distFromSpawn < 15) validPosition = false;
            }

            attempts++;
        }

        if (validPosition) {
            const enemyTypes = ['slime', 'goblin'];
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

            gs.enemies.push({
                x, y, type,
                health: type === 'slime' ? 3 : 5,
                maxHealth: type === 'slime' ? 3 : 5,
                damage: type === 'slime' ? 1 : 2,
                speed: type === 'slime' ? 0.015 : 0.02,
                direction: 'down',
                animFrame: 0, animTimer: 0,
                moveTimer: Math.random() * 60,
                aggroRange: type === 'slime' ? 4 : 6,
                isAggro: false,
                knockbackX: 0, knockbackY: 0,
                xpReward: type === 'slime' ? 15 : 25
            });
        }
    }
}

// ----------------------------------------
// Create treasure chest guards
// ----------------------------------------
export function createTreasureChest(gs) {
    let chestX = gs.mapWidth - 12;
    let chestY = 8;

    while (gs.map[chestY] && gs.map[chestY][chestX] === TILE_WATER) {
        chestX--;
        if (chestX < gs.mapWidth - 20) {
            chestY++;
            chestX = gs.mapWidth - 12;
        }
    }

    gs.treasureChest = { x: chestX, y: chestY, opened: false };

    // Guard enemies around the chest
    const guardPositions = [
        { x: chestX - 3, y: chestY },
        { x: chestX + 3, y: chestY },
        { x: chestX, y: chestY - 3 },
        { x: chestX, y: chestY + 3 },
        { x: chestX - 2, y: chestY - 2 },
        { x: chestX + 2, y: chestY + 2 }
    ];

    guardPositions.forEach(pos => {
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

        // Aggro logic
        if (distance < enemy.aggroRange) {
            enemy.isAggro = true;
        } else if (distance > enemy.aggroRange * 2) {
            enemy.isAggro = false;
        }

        // Movement
        enemy.moveTimer += dt;

        if (enemy.isAggro && distance > 0.8) {
            // Chase player
            const dirX = distX / distance;
            const dirY = distY / distance;
            enemy.x += dirX * enemy.speed * dt;
            enemy.y += dirY * enemy.speed * dt;

            if (Math.abs(dirX) > Math.abs(dirY)) {
                enemy.direction = dirX > 0 ? 'right' : 'left';
            } else {
                enemy.direction = dirY > 0 ? 'down' : 'up';
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
