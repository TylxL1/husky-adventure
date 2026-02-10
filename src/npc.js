// ========================================
// NPC - Creation, AI, dialogues, drawing
// ========================================
import { TILE_SIZE, TILE_WATER, TILE_ROCK, TILE_TREE, TILE_HOUSE, TILE_DOCK } from './constants.js';
import { canNPCWalkOn } from './player.js';
import { lightenColor, darkenColor } from './renderer.js';

// ----------------------------------------
// Create outdoor NPCs
// ----------------------------------------
export function createNPCs(gs) {
    const npcTypes = ['man', 'woman', 'child', 'assistant'];
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
            gs.npcs.push({
                x, y, type,
                direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                animFrame: 0, animTimer: 0,
                moveTimer: Math.floor(Math.random() * 60),
                idleTime: Math.random() * 100 + 50
            });
        }
    }

    // Assign an assistant to each shopkeeper/craftsman
    const shopTypes = ['blacksmith', 'fisher', 'farmer', 'doctor', 'church', 'merchant', 'elder'];
    shopTypes.forEach(type => {
        const house = gs.houses.find(h => h.type === type);
        if (!house) return;
        gs.npcs.push({
            x: house.x + 3,
            y: house.y + 2,
            type: 'assistant',
            direction: 'left',
            animFrame: 0, animTimer: 0,
            moveTimer: Math.floor(Math.random() * 60),
            idleTime: Math.random() * 100 + 50
        });
    });

    // Outdoor fisher NPC at the fishing pier
    if (gs.fishingPier) {
        gs.npcs.push({
            x: gs.fishingPier.x,
            y: gs.fishingPier.y,
            type: 'fisher',
            direction: 'right',
            animFrame: 0, animTimer: 0,
            moveTimer: 0,
            idleTime: 200
        });
    }
}

// ----------------------------------------
// Update NPCs (movement + animation)
// ----------------------------------------
export function updateNPCs(gs, dt) {
    gs.npcs.forEach(npc => {
        npc.moveTimer += dt;

        // Change direction every ~120 frames
        if (npc.moveTimer % 120 < dt) {
            if (Math.random() > 0.3) {
                npc.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
            } else {
                npc.direction = 'idle';
            }
        }

        if (npc.direction !== 'idle') {
            npc.animTimer += dt;
            if (npc.animTimer > 20) {
                npc.animFrame = (npc.animFrame + 1) % 2;
                npc.animTimer = 0;
            }

            const moveSpeed = 0.01 * dt;
            let newX = npc.x;
            let newY = npc.y;

            if (npc.direction === 'up') newY -= moveSpeed;
            if (npc.direction === 'down') newY += moveSpeed;
            if (npc.direction === 'left') newX -= moveSpeed;
            if (npc.direction === 'right') newX += moveSpeed;

            if (canNPCWalkOn(gs, newX, newY)) {
                npc.x = newX;
                npc.y = newY;
            } else {
                npc.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
            }
        } else {
            npc.animFrame = 0;
            npc.animTimer = 0;
        }
    });
}

// ----------------------------------------
// Check proximity to NPC for dialogue
// ----------------------------------------
export function checkNearNPC(gs) {
    gs.nearNPC = null;
    const talkDistance = 2;

    gs.npcs.forEach(npc => {
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
        'assistant': [
            "Good day. Can I help you?",
            "I'm here to help the villagers.",
            "If you need anything, let me know.",
            "Everything seems in order today.",
            "The shops are all open if you need supplies."
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
            case 'assistant':
                skinColor = '#e8b896'; clothesColor = '#2F4F4F'; hatColor = '#696969'; npcSize = size; break;
            default:
                skinColor = '#f5d5b5'; clothesColor = '#556B2F'; hatColor = '#8B4513'; npcSize = size;
        }

        const sizeRatio = npcSize / size;
        const adjustedPx = px + (size - npcSize) / 2;
        const adjustedPy = py + (size - npcSize);

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
