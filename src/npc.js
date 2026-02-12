// ========================================
// NPC - Creation, AI, dialogues, drawing
// ========================================
import { TILE_SIZE, TILE_WATER, TILE_ROCK, TILE_TREE, TILE_HOUSE, TILE_DOCK } from './constants.js';
import { canNPCWalkOn } from './player.js';
import { lightenColor, darkenColor } from './renderer.js';

// ----------------------------------------
// NPC speed by type
// ----------------------------------------
function getNPCSpeed(npc) {
    switch (npc.type) {
        case 'farmer': return 0.02;
        case 'fisher': return 0.02;
        case 'merchant': return 0.025;
        case 'doctor': return 0.015;
        case 'elder': return 0.012;
        case 'child': return 0.02;
        default: return 0.015;
    }
}

// ----------------------------------------
// Create outdoor NPCs
// ----------------------------------------
export function createNPCs(gs) {
    const npcTypes = ['man', 'woman', 'child', 'man'];
    const numNPCs = 12;

    for (let i = 0; i < numNPCs; i++) {
        let x, y;
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 100) {
            x = Math.random() * (gs.mapWidth - 10) + 5;
            y = Math.random() * (gs.mapHeight - 10) + 5;

            // Stay away from houses (at least 6 tiles)
            validPosition = true;
            for (const house of gs.houses) {
                const distX = Math.abs(x - (house.x + 1.5));
                const distY = Math.abs(y - (house.y + 1.5));
                if (distX < 6 && distY < 6) {
                    validPosition = false;
                    break;
                }
            }

            // Must be on grass or path
            if (validPosition) {
                const tileType = gs.map[Math.floor(y)]?.[Math.floor(x)];
                if (tileType === TILE_WATER || tileType === TILE_ROCK || tileType === TILE_TREE ||
                    tileType === TILE_HOUSE || tileType === TILE_DOCK) {
                    validPosition = false;
                }
            }

            attempts++;
        }

        if (validPosition) {
            const type = npcTypes[i % npcTypes.length];
            const hp = type === 'child' ? 4 : 6;
            gs.npcs.push({
                x, y, type,
                homeX: x, homeY: y,
                targetX: null, targetY: null,
                behavior: 'wander',
                pauseTimer: 0,
                wanderRadius: 15,
                direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                animFrame: 0, animTimer: 0,
                moveTimer: Math.floor(Math.random() * 60),
                idleTime: Math.random() * 100 + 50,
                visible: true,
                wakeTime: 5.5 + Math.random(),  // Generic NPCs: 5:30-6:30
                health: hp, maxHealth: hp,
                invincible: false, invincibleTimer: 0,
                knockbackX: 0, knockbackY: 0
            });
        }
    }

    // Assign role-specific NPCs to each shopkeeper/craftsman house
    const roleMap = {
        'blacksmith': 'blacksmith',
        'fisher': 'fisher',
        'farmer': 'farmer',
        'doctor': 'doctor',
        'church': 'priest',
        'merchant': 'merchant',
        'elder': 'elder'
    };

    const wakeTimeByRole = {
        'farmer': 5.0, 'fisher': 5.5, 'blacksmith': 6.0,
        'elder': 6.5, 'doctor': 6.5, 'merchant': 7.0, 'priest': 6.0
    };

    Object.entries(roleMap).forEach(([houseType, npcType]) => {
        const house = gs.houses.find(h => h.type === houseType);
        if (!house) return;
        const hp = 8;
        gs.npcs.push({
            x: house.x + 3,
            y: house.y + 2,
            type: npcType,
            homeX: house.x + 3,
            homeY: house.y + 2,
            targetX: null, targetY: null,
            behavior: 'wander',
            pauseTimer: 0,
            wanderRadius: 15,
            direction: 'left',
            animFrame: 0, animTimer: 0,
            moveTimer: Math.floor(Math.random() * 60),
            idleTime: Math.random() * 100 + 50,
            visible: true,
            wakeTime: wakeTimeByRole[npcType] || 6.0,
            health: hp, maxHealth: hp,
            invincible: false, invincibleTimer: 0,
            knockbackX: 0, knockbackY: 0
        });
    });
}

// ----------------------------------------
// Choose next behavior based on NPC role
// ----------------------------------------
function chooseNextBehavior(npc, gs) {
    const roll = Math.random();

    switch (npc.type) {
        case 'farmer': {
            const farmerHouse = gs.houses.find(h => h.type === 'farmer');
            if (farmerHouse && roll < 0.6) {
                // Go to fields
                npc.targetX = farmerHouse.x + 3 + Math.random() * 8;
                npc.targetY = farmerHouse.y - 2 + Math.random() * 6;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 200 + Math.random() * 200;
            } else {
                npc.behavior = 'return_home';
            }
            break;
        }
        case 'fisher': {
            if (gs.fishingPier && roll < 0.6) {
                // Go to pier
                npc.targetX = gs.fishingPier.x;
                npc.targetY = gs.fishingPier.y - 1;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 300 + Math.random() * 200;
            } else {
                npc.behavior = 'return_home';
            }
            break;
        }
        case 'blacksmith': {
            if (gs.plazaCenter && roll < 0.3) {
                // Walk to plaza
                npc.targetX = gs.plazaCenter.x + (Math.random() - 0.5) * 8;
                npc.targetY = gs.plazaCenter.y + (Math.random() - 0.5) * 8;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 100 + Math.random() * 150;
            } else {
                // Wander near home
                npc.behavior = 'wander';
            }
            break;
        }
        case 'merchant': {
            if (gs.plazaCenter && roll < 0.6) {
                // Go to plaza
                npc.targetX = gs.plazaCenter.x + (Math.random() - 0.5) * 8;
                npc.targetY = gs.plazaCenter.y + (Math.random() - 0.5) * 8;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 150 + Math.random() * 200;
            } else {
                npc.behavior = 'return_home';
            }
            break;
        }
        case 'doctor': {
            // Walk to random houses
            if (gs.houses.length > 0 && roll < 0.5) {
                const randomHouse = gs.houses[Math.floor(Math.random() * gs.houses.length)];
                npc.targetX = randomHouse.x + 1;
                npc.targetY = randomHouse.y + 3;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 150 + Math.random() * 150;
            } else {
                npc.behavior = 'return_home';
            }
            break;
        }
        case 'elder': {
            if (gs.plazaCenter && roll < 0.5) {
                // Go to plaza fountain
                npc.targetX = gs.plazaCenter.x + (Math.random() - 0.5) * 4;
                npc.targetY = gs.plazaCenter.y + (Math.random() - 0.5) * 4;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 400 + Math.random() * 200;
            } else {
                npc.behavior = 'return_home';
            }
            break;
        }
        case 'priest': {
            if (gs.plazaCenter && roll < 0.4) {
                // Go to plaza bench area
                npc.targetX = gs.plazaCenter.x + (Math.random() - 0.5) * 6;
                npc.targetY = gs.plazaCenter.y - 3 + Math.random() * 6;
                npc.behavior = 'go_to_target';
                npc.pauseTimer = 200 + Math.random() * 200;
            } else {
                npc.behavior = 'return_home';
            }
            break;
        }
        default: {
            // man, woman, child — wander or return home
            if (roll < 0.3) {
                npc.behavior = 'return_home';
            } else {
                npc.behavior = 'wander';
            }
            break;
        }
    }
}

// ----------------------------------------
// Update NPC behavior state machine
// ----------------------------------------
function updateNPCBehavior(npc, gs, dt) {
    // Night mode: force NPCs home
    if (gs.isNight && npc.behavior !== 'return_home' && npc.behavior !== 'pause') {
        const distHome = Math.sqrt(
            Math.pow(npc.x - npc.homeX, 2) +
            Math.pow(npc.y - npc.homeY, 2)
        );
        if (distHome > 3) {
            npc.behavior = 'return_home';
            return;
        }
    }

    switch (npc.behavior) {
        case 'pause':
            npc.pauseTimer -= dt;
            if (npc.pauseTimer <= 0) {
                chooseNextBehavior(npc, gs);
            }
            break;

        case 'wander':
            npc.moveTimer += dt;
            if (npc.moveTimer % 120 < dt) {
                // Check wander radius
                const distHome = Math.sqrt(
                    Math.pow(npc.x - npc.homeX, 2) +
                    Math.pow(npc.y - npc.homeY, 2)
                );
                if (distHome > npc.wanderRadius) {
                    npc.behavior = 'return_home';
                } else if (Math.random() > 0.3) {
                    npc.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
                } else {
                    // Pause briefly, then choose next
                    npc.behavior = 'pause';
                    npc.pauseTimer = 60 + Math.random() * 120;
                }
            }
            break;

        case 'go_to_target': {
            if (npc.targetX === null || npc.targetY === null) {
                npc.behavior = 'pause';
                npc.pauseTimer = 60;
                break;
            }
            const dx = npc.targetX - npc.x;
            const dy = npc.targetY - npc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1.5) {
                // Arrived — pause with stored timer
                npc.behavior = 'pause';
                // pauseTimer was set by chooseNextBehavior
            } else {
                // Update direction for animation
                if (Math.abs(dx) > Math.abs(dy)) {
                    npc.direction = dx > 0 ? 'right' : 'left';
                } else {
                    npc.direction = dy > 0 ? 'down' : 'up';
                }
            }
            break;
        }

        case 'return_home': {
            const dx = npc.homeX - npc.x;
            const dy = npc.homeY - npc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1.5) {
                npc.behavior = 'pause';
                npc.pauseTimer = 100 + Math.random() * 200;
            } else {
                if (Math.abs(dx) > Math.abs(dy)) {
                    npc.direction = dx > 0 ? 'right' : 'left';
                } else {
                    npc.direction = dy > 0 ? 'down' : 'up';
                }
            }
            break;
        }
    }
}

// ----------------------------------------
// Update NPC movement (position changes)
// ----------------------------------------
function updateNPCMovement(npc, gs, dt) {
    if (npc.behavior === 'pause') return;

    const speed = getNPCSpeed(npc) * dt;
    let newX = npc.x;
    let newY = npc.y;

    if (npc.behavior === 'go_to_target' && npc.targetX !== null) {
        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) {
            newX += (dx / dist) * speed;
            newY += (dy / dist) * speed;
        }
    } else if (npc.behavior === 'return_home') {
        const dx = npc.homeX - npc.x;
        const dy = npc.homeY - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) {
            newX += (dx / dist) * speed;
            newY += (dy / dist) * speed;
        }
    } else if (npc.behavior === 'wander') {
        if (npc.direction === 'up') newY -= speed;
        if (npc.direction === 'down') newY += speed;
        if (npc.direction === 'left') newX -= speed;
        if (npc.direction === 'right') newX += speed;
    }

    if (canNPCWalkOn(gs, newX, newY)) {
        npc.x = newX;
        npc.y = newY;
    } else {
        // Collision — pick new direction or go home
        if (npc.behavior === 'wander') {
            npc.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        } else {
            // Target blocked — give up and pause
            npc.behavior = 'pause';
            npc.pauseTimer = 60 + Math.random() * 60;
        }
    }
}

// ----------------------------------------
// Update NPC animation (frame toggle)
// ----------------------------------------
function updateNPCAnimation(npc, gs, dt) {
    if (npc.behavior === 'pause') {
        npc.animFrame = 0;
        npc.animTimer = 0;
        return;
    }

    npc.animTimer += dt;
    if (npc.animTimer > 20) {
        npc.animFrame = (npc.animFrame + 1) % 2;
        npc.animTimer = 0;
    }
}

// ----------------------------------------
// Update NPCs (movement + animation)
// ----------------------------------------
export function updateNPCs(gs, dt) {
    gs.npcs.forEach(npc => {
        // Ensure NPC is always visible
        if (!npc.visible) {
            npc.visible = true;
            npc.x = npc.homeX;
            npc.y = npc.homeY;
        }

        // Invincibility timer
        if (npc.invincible) {
            npc.invincibleTimer -= dt;
            if (npc.invincibleTimer <= 0) {
                npc.invincible = false;
            }
        }

        // Apply knockback
        if (npc.knockbackX || npc.knockbackY) {
            const newX = npc.x + npc.knockbackX * dt;
            const newY = npc.y + npc.knockbackY * dt;
            if (canNPCWalkOn(gs, newX, newY)) {
                npc.x = newX;
                npc.y = newY;
            }
            npc.knockbackX *= Math.pow(0.85, dt);
            npc.knockbackY *= Math.pow(0.85, dt);
            if (Math.abs(npc.knockbackX) < 0.001) npc.knockbackX = 0;
            if (Math.abs(npc.knockbackY) < 0.001) npc.knockbackY = 0;
        }

        updateNPCBehavior(npc, gs, dt);
        updateNPCMovement(npc, gs, dt);
        updateNPCAnimation(npc, gs, dt);
    });
}

// ----------------------------------------
// Check proximity to NPC for dialogue
// ----------------------------------------
export function checkNearNPC(gs) {
    gs.nearNPC = null;
    const talkDistance = 2;

    gs.npcs.forEach(npc => {
        if (npc.visible === false) return;

        const distance = Math.sqrt(
            Math.pow(gs.player.x - npc.x, 2) +
            Math.pow(gs.player.y - npc.y, 2)
        );
        if (distance < talkDistance) {
            gs.nearNPC = npc;
        }
    });
}

// ----------------------------------------
// Get random dialogue for NPC type
// ----------------------------------------
export function getDialogue(npcType) {
    const dialogues = {
        'man': [
            "Hello! Beautiful weather today, isn't it?",
            "I love living on this island.",
            "The village is so peaceful here.",
            "Do you come here often?",
            "I'm going for a walk around the island."
        ],
        'woman': [
            "Hello dear! How are you today?",
            "This village is wonderful, don't you think?",
            "I just finished my gardening.",
            "The flowers are so pretty this season!",
            "I love watching the sunset from here."
        ],
        'child': [
            "Hi! Do you want to play?",
            "I love running around the island!",
            "Mom said not to go too far...",
            "Look at that pretty butterfly!",
            "Tag, you're it! Hehe!"
        ],
        'doctor': [
            "Hello! Are you feeling well?",
            "I have remedies for all ailments.",
            "Health is the most precious thing!",
            "Don't hesitate if you're injured."
        ],
        'blacksmith': [
            "Welcome to the forge!",
            "I can forge any weapon or tool.",
            "The forge fire never goes out!",
            "Need some equipment?"
        ],
        'priest': [
            "May peace be with you, my child.",
            "This church is open to everyone.",
            "Take time to pray and meditate.",
            "May heaven's blessings be upon you."
        ],
        'farmer': [
            "Hello! My vegetables are growing well this year.",
            "I grew these tomatoes and carrots myself!",
            "Working the land is hard but rewarding.",
            "Want to buy some fresh vegetables?"
        ],
        'merchant': [
            "Welcome to my magic potion shop!",
            "I have potions with extraordinary effects!",
            "Speed, strength, invisibility... What do you desire?",
            "My potions are the most powerful in the kingdom!"
        ],
        'villager': [
            "Hello! Beautiful weather today, isn't it?",
            "I love living on this island.",
            "The village is so peaceful here."
        ],
        'elder': [
            "Wisdom comes with patience, young one.",
            "The island holds many secrets...",
            "I've seen many seasons pass."
        ],
        'fisher': [
            "Fresh fish, caught this morning!",
            "The sea is generous today.",
            "Want to buy some fish?"
        ]
    };

    const npcDialogues = dialogues[npcType];
    if (!npcDialogues) return "...";
    return npcDialogues[Math.floor(Math.random() * npcDialogues.length)];
}

// ----------------------------------------
// Draw NPCs
// ----------------------------------------
export function drawNPCs(ctx, gs) {
    gs.npcs.forEach(npc => {
        if (npc.visible === false) return;

        const screenX = (npc.x - gs.camera.x) * TILE_SIZE;
        const screenY = (npc.y - gs.camera.y) * TILE_SIZE;

        if (screenX < -TILE_SIZE || screenX > gs.canvas.width ||
            screenY < -TILE_SIZE || screenY > gs.canvas.height) return;

        const size = 30;
        const px = screenX + (TILE_SIZE - size) / 2;
        const py = screenY + (TILE_SIZE - size) / 2;

        let skinColor, clothesColor, hatColor, npcSize;
        switch (npc.type) {
            case 'man':
                skinColor = '#f5c9a5'; clothesColor = '#4682B4'; hatColor = '#8B4513'; npcSize = size; break;
            case 'woman':
                skinColor = '#f0d0b0'; clothesColor = '#DC143C'; hatColor = '#9370DB'; npcSize = size; break;
            case 'child':
                skinColor = '#ffd5b5'; clothesColor = '#32CD32'; hatColor = '#FFD700'; npcSize = size * 0.75; break;
            case 'farmer':
                skinColor = '#f5c9a5'; clothesColor = '#228B22'; hatColor = '#8B6914'; npcSize = size; break;
            case 'fisher':
                skinColor = '#f0d0b0'; clothesColor = '#4169E1'; hatColor = '#1E90FF'; npcSize = size; break;
            case 'blacksmith':
                skinColor = '#e8b896'; clothesColor = '#2F2F2F'; hatColor = '#404040'; npcSize = size; break;
            case 'merchant':
                skinColor = '#f5c9a5'; clothesColor = '#8B008B'; hatColor = '#9370DB'; npcSize = size; break;
            case 'doctor':
                skinColor = '#f0d0b0'; clothesColor = '#F5F5F5'; hatColor = '#FF0000'; npcSize = size; break;
            case 'elder':
                skinColor = '#e0c0a0'; clothesColor = '#8B4513'; hatColor = '#654321'; npcSize = size; break;
            case 'priest':
                skinColor = '#f5d5b5'; clothesColor = '#1a1a1a'; hatColor = '#333333'; npcSize = size; break;
            default:
                skinColor = '#f5d5b5'; clothesColor = '#556B2F'; hatColor = '#8B4513'; npcSize = size;
        }

        const sizeRatio = npcSize / size;
        const adjustedPx = px + (size - npcSize) / 2;
        const adjustedPy = py + (size - npcSize);

        // Invincibility flash — skip drawing every other frame
        if (npc.invincible && Math.floor(Date.now() / 80) % 2 === 0) {
            // Still draw health bar even during flash
            if (npc.health < npc.maxHealth) {
                const barWidth = npcSize;
                const barHeight = 4;
                const barX = screenX + (TILE_SIZE - barWidth) / 2;
                const barY = screenY - 2;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(barX, barY, barWidth * (npc.health / npc.maxHealth), barHeight);
            }
            return;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 2, npcSize / 2, npcSize / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = clothesColor;
        ctx.fillRect(adjustedPx + 8 * sizeRatio, adjustedPy + 16 * sizeRatio, 14 * sizeRatio, 10 * sizeRatio);

        // Head
        ctx.fillStyle = skinColor;
        ctx.fillRect(adjustedPx + 9 * sizeRatio, adjustedPy + 6 * sizeRatio, 12 * sizeRatio, 10 * sizeRatio);

        // Hat
        ctx.fillStyle = hatColor;
        ctx.fillRect(adjustedPx + 7 * sizeRatio, adjustedPy + 2 * sizeRatio, 16 * sizeRatio, 4 * sizeRatio);
        ctx.fillRect(adjustedPx + 9 * sizeRatio, adjustedPy + 0 * sizeRatio, 12 * sizeRatio, 3 * sizeRatio);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(adjustedPx + 11 * sizeRatio, adjustedPy + 10 * sizeRatio, 2 * sizeRatio, 2 * sizeRatio);
        ctx.fillRect(adjustedPx + 17 * sizeRatio, adjustedPy + 10 * sizeRatio, 2 * sizeRatio, 2 * sizeRatio);

        // Animated legs
        ctx.fillStyle = darkenColor(clothesColor, 20);
        const legOffset = npc.animFrame * 2 * sizeRatio;
        ctx.fillRect(adjustedPx + 10 * sizeRatio, adjustedPy + 26 * sizeRatio - legOffset, 3 * sizeRatio, 4 * sizeRatio);
        ctx.fillRect(adjustedPx + 17 * sizeRatio, adjustedPy + 26 * sizeRatio + legOffset, 3 * sizeRatio, 4 * sizeRatio);

        // Health bar (only when damaged)
        if (npc.health < npc.maxHealth) {
            const barWidth = npcSize;
            const barHeight = 4;
            const barX = screenX + (TILE_SIZE - barWidth) / 2;
            const barY = screenY - 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(barX, barY, barWidth * (npc.health / npc.maxHealth), barHeight);
        }
    });
}

// ----------------------------------------
// Create animals (goats in pen)
// ----------------------------------------
export function createAnimals(gs) {
    if (!gs.goatPenBounds) return;

    const pen = gs.goatPenBounds;
    for (let i = 0; i < 5; i++) {
        gs.animals.push({
            type: 'goat',
            x: pen.x1 + Math.random() * (pen.x2 - pen.x1),
            y: pen.y1 + Math.random() * (pen.y2 - pen.y1),
            direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
            animFrame: 0,
            animTimer: 0,
            moveTimer: Math.floor(Math.random() * 60),
            penBounds: pen
        });
    }
}

// ----------------------------------------
// Update animals (bounded wandering)
// ----------------------------------------
export function updateAnimals(gs, dt) {
    gs.animals.forEach(animal => {
        animal.moveTimer += dt;

        // Change direction every ~120 frames
        if (animal.moveTimer % 120 < dt) {
            if (Math.random() > 0.5) {
                animal.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
            } else {
                animal.direction = 'idle';
            }
        }

        if (animal.direction !== 'idle') {
            animal.animTimer += dt;
            if (animal.animTimer > 25) {
                animal.animFrame = (animal.animFrame + 1) % 2;
                animal.animTimer = 0;
            }

            const moveSpeed = 0.005 * dt;
            let newX = animal.x;
            let newY = animal.y;

            if (animal.direction === 'up') newY -= moveSpeed;
            if (animal.direction === 'down') newY += moveSpeed;
            if (animal.direction === 'left') newX -= moveSpeed;
            if (animal.direction === 'right') newX += moveSpeed;

            // Clamp to pen bounds
            const pen = animal.penBounds;
            if (newX >= pen.x1 && newX <= pen.x2 && newY >= pen.y1 && newY <= pen.y2) {
                animal.x = newX;
                animal.y = newY;
            } else {
                // Bounce: pick a new direction
                animal.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
            }
        } else {
            animal.animFrame = 0;
            animal.animTimer = 0;
        }
    });
}

// ----------------------------------------
// Draw animals (pixel art goats)
// ----------------------------------------
export function drawAnimals(ctx, gs) {
    gs.animals.forEach(animal => {
        const screenX = (animal.x - gs.camera.x) * TILE_SIZE;
        const screenY = (animal.y - gs.camera.y) * TILE_SIZE;

        if (screenX < -TILE_SIZE || screenX > gs.canvas.width ||
            screenY < -TILE_SIZE || screenY > gs.canvas.height) return;

        const size = 34;
        const px = screenX + (TILE_SIZE - size) / 2;
        const py = screenY + (TILE_SIZE - size) / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 6, size / 2.5, size / 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (white/cream)
        ctx.fillStyle = '#F5F0E0';
        ctx.fillRect(px + 4, py + 12, 22, 12);

        // Body highlight
        ctx.fillStyle = '#FFFAF0';
        ctx.fillRect(px + 7, py + 12, 16, 6);

        // Head
        ctx.fillStyle = '#F5F0E0';
        ctx.fillRect(px + 22, py + 6, 11, 10);

        // Horns (dark)
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(px + 23, py + 2, 3, 5);
        ctx.fillRect(px + 30, py + 2, 3, 5);

        // Eyes
        ctx.fillStyle = '#222';
        ctx.fillRect(px + 26, py + 9, 2, 3);
        ctx.fillRect(px + 30, py + 9, 2, 3);

        // Pink snout
        ctx.fillStyle = '#FFAAAA';
        ctx.fillRect(px + 27, py + 14, 4, 3);

        // Legs with walk animation
        ctx.fillStyle = '#D2C8B0';
        const legOffset = animal.animFrame * 2;
        ctx.fillRect(px + 7, py + 24 - legOffset, 3, 7);
        ctx.fillRect(px + 13, py + 24 + legOffset, 3, 7);
        ctx.fillRect(px + 18, py + 24 - legOffset, 3, 7);
        ctx.fillRect(px + 23, py + 24 + legOffset, 3, 7);

        // Small tail
        ctx.fillStyle = '#F5F0E0';
        ctx.fillRect(px + 1, py + 13, 4, 4);
    });
}

// ----------------------------------------
// Draw intro elder NPC
// ----------------------------------------
export function drawIntroElder(ctx, gs) {
    if (!gs.introActive || !gs.introElder) return;

    const screenX = (gs.introElder.x - gs.camera.x) * TILE_SIZE;
    const screenY = (gs.introElder.y - gs.camera.y) * TILE_SIZE;

    const size = 30;
    const px = screenX + (TILE_SIZE - size) / 2;
    const py = screenY + (TILE_SIZE - size) / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 2, size / 2, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (gray robe)
    ctx.fillStyle = '#696969';
    ctx.fillRect(px + 6, py + 14, 18, 14);

    // Head
    ctx.fillStyle = '#e0c0a0';
    ctx.fillRect(px + 9, py + 6, 12, 10);

    // White beard
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px + 10, py + 12, 10, 8);

    // Hood
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(px + 7, py + 2, 16, 6);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 11, py + 9, 2, 2);
    ctx.fillRect(px + 17, py + 9, 2, 2);

    // Staff
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + 24, py + 4, 3, 24);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + 25.5, py + 4, 4, 0, Math.PI * 2);
    ctx.fill();
}
