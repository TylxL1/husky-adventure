// ========================================
// UI - HUD, inventory, shop, help, minimap
// ========================================
import { handleInventoryClick, handleStorageClick, handleShopPurchaseByIndex } from './input.js';
import { countCategorySlots } from './inventory.js';
import {
    INVENTORY_SLOTS_WEAPONS, INVENTORY_SLOTS_FOOD,
    INVENTORY_SLOTS_ITEMS, STORAGE_MAX_SLOTS,
    getTimePhase, getNightOpacity
} from './constants.js';
// ----------------------------------------
// Wrap text to fit width
// ----------------------------------------
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

// ----------------------------------------
// Get house color for minimap
// ----------------------------------------
function getHouseColor(houseType) {
    const houseColors = {
        'player': '#FFD700',
        'farmer': '#32CD32',
        'fisher': '#00CED1',
        'merchant': '#FF8C00',
        'elder': '#9370DB',
        'doctor': '#FF1493',
        'blacksmith': '#696969',
        'church': '#FFFFFF',
        'villager1': '#1E90FF',
        'villager2': '#FF4500',
        'villager3': '#ADFF2F'
    };
    return houseColors[houseType] || '#8B4513';
}

// ----------------------------------------
// Get house type at map position
// ----------------------------------------
function getHouseTypeAtPosition(gs, x, y) {
    for (const house of gs.houses) {
        if (x >= house.x - 1 && x < house.x + house.width - 1 &&
            y >= house.y - 1 && y < house.y + house.height - 1) {
            return house.type;
        }
    }
    return null;
}

// ----------------------------------------
// Draw pixel-art triangles (health bar)
// ----------------------------------------
function drawHearts(ctx, gs) {
    const pixelSize = 2;
    const heartSpacing = 36;
    const hearts = Math.ceil(gs.player.maxHealth / 4);

    // 13x13 pixel art upward-pointing triangle patterns
    // 0=transparent, 1=outline, 2=dark red, 3=medium red, 4=light red, 5=dark gray (empty)
    const heartPatternFull = [
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,3,1,0,0,0,0,0],
        [0,0,0,0,1,4,3,3,1,0,0,0,0],
        [0,0,0,0,1,4,3,3,1,0,0,0,0],
        [0,0,0,1,4,4,3,3,2,1,0,0,0],
        [0,0,0,1,4,4,3,3,2,1,0,0,0],
        [0,0,1,4,4,3,3,3,2,2,1,0,0],
        [0,0,1,4,4,3,3,3,2,2,1,0,0],
        [0,1,4,4,3,3,3,3,2,2,2,1,0],
        [0,1,4,4,3,3,3,3,2,2,2,1,0],
        [1,4,4,3,3,3,3,3,2,2,2,2,1],
        [1,4,3,3,3,3,3,3,3,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const heartPatternHalf = [
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,3,1,0,0,0,0,0],
        [0,0,0,0,1,4,3,5,1,0,0,0,0],
        [0,0,0,0,1,4,3,5,1,0,0,0,0],
        [0,0,0,1,4,4,3,5,5,1,0,0,0],
        [0,0,0,1,4,4,3,5,5,1,0,0,0],
        [0,0,1,4,4,3,3,5,5,5,1,0,0],
        [0,0,1,4,4,3,3,5,5,5,1,0,0],
        [0,1,4,4,3,3,3,5,5,5,5,1,0],
        [0,1,4,4,3,3,3,5,5,5,5,1,0],
        [1,4,4,3,3,3,3,5,5,5,5,5,1],
        [1,4,3,3,3,3,3,5,5,5,5,5,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const heartPatternEmpty = [
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,5,1,0,0,0,0,0],
        [0,0,0,0,1,5,5,5,1,0,0,0,0],
        [0,0,0,0,1,5,5,5,1,0,0,0,0],
        [0,0,0,1,5,5,5,5,5,1,0,0,0],
        [0,0,0,1,5,5,5,5,5,1,0,0,0],
        [0,0,1,5,5,5,5,5,5,5,1,0,0],
        [0,0,1,5,5,5,5,5,5,5,1,0,0],
        [0,1,5,5,5,5,5,5,5,5,5,1,0],
        [0,1,5,5,5,5,5,5,5,5,5,1,0],
        [1,5,5,5,5,5,5,5,5,5,5,5,1],
        [1,5,5,5,5,5,5,5,5,5,5,5,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const colors = {
        0: 'transparent',
        1: '#000000',
        2: '#8B0000',
        3: '#DC143C',
        4: '#FF6B6B',
        5: '#3d3d3d'
    };

    for (let i = 0; i < hearts; i++) {
        const startX = 15 + i * heartSpacing;
        const startY = 15;

        const heartValue = i * 4;
        const isFull = gs.player.health >= heartValue + 4;
        const isHalf = gs.player.health >= heartValue + 2 && gs.player.health < heartValue + 4;

        let pattern;
        if (gs.player.health < heartValue + 2) {
            pattern = heartPatternEmpty;
        } else if (isHalf) {
            pattern = heartPatternHalf;
        } else {
            pattern = heartPatternFull;
        }

        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                const pixelValue = pattern[row][col];
                if (pixelValue !== 0) {
                    ctx.fillStyle = colors[pixelValue];
                    ctx.fillRect(
                        startX + col * pixelSize,
                        startY + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }
}

// ----------------------------------------
// Draw level indicator (pixel art)
// ----------------------------------------
function drawLevel(ctx, gs) {
    const pixelSize = 3;
    const startX = gs.canvas.width - 150;
    const startY = 18;

    // "LVL" in pixel art (5x5 per letter)
    const lvlPattern = {
        'L': [
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1]
        ],
        'V': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,1,0,1,0],
            [0,0,1,0,0]
        ]
    };

    const numberPatterns = {
        '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
        '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
        '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,1,1,1,1]],
        '3': [[1,1,1,1,0],[0,0,0,1,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
        '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,1,1,1,1],[0,0,0,1,0]],
        '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
        '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
        '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
        '8': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
        '9': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,1,1,1,0]]
    };

    let xOffset = startX;

    // Draw "LVL"
    ['L', 'V', 'L'].forEach(letter => {
        const pattern = lvlPattern[letter];
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(
                        xOffset + col * pixelSize,
                        startY + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        xOffset += 5 * pixelSize + 2;
    });

    xOffset += 4;

    // Draw level number
    const levelStr = gs.player.level.toString();
    levelStr.split('').forEach(digit => {
        const pattern = numberPatterns[digit];
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(
                        xOffset + col * pixelSize,
                        startY + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        xOffset += 5 * pixelSize + 2;
    });

    // Gems below level
    if (gs.player.gems > 0) {
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(`💎 ${gs.player.gems}`, startX, startY + 34);
    }
}

// ----------------------------------------
// Draw settings icon (top-right, compact pill)
// ----------------------------------------
function drawSettingsIcon(ctx, gs) {
    ctx.font = 'bold 13px monospace';
    const label = '\u2699 P';
    const w = ctx.measureText(label).width + 14;
    const h = 22;
    const x = gs.canvas.width - w - 10;
    const y = 12;

    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Label
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(label, x + 7, y + 16);
}

// ----------------------------------------
// Draw active potion effects
// ----------------------------------------
function drawActiveEffects(ctx, gs) {
    const startX = gs.canvas.width - 150;
    let startY = 60;

    const effectsInfo = [
        { name: 'speed', icon: '⚡', color: '#ffff00', label: 'Speed' },
        { name: 'invisibility', icon: '👻', color: '#9999ff', label: 'Invisible' },
        { name: 'strength', icon: '💪', color: '#ff6666', label: 'Strength' },
        { name: 'invincibility', icon: '💫', color: '#00ffff', label: 'Invincible' }
    ];

    effectsInfo.forEach(effectInfo => {
        const effect = gs.activeEffects[effectInfo.name];

        if (effect.active) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(startX, startY - 18, 140, 24);

            ctx.strokeStyle = effectInfo.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY - 18, 140, 24);

            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = effectInfo.color;
            ctx.fillText(effectInfo.icon, startX + 5, startY);

            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#ffffff';

            if (effectInfo.name === 'invincibility') {
                ctx.fillText(`${effect.hitsRemaining} hits`, startX + 30, startY);
            } else {
                const secondsLeft = Math.ceil(effect.duration / 60);
                ctx.fillText(`${secondsLeft}s`, startX + 30, startY);
            }

            if (effect.duration !== undefined) {
                const barWidth = 60;
                const barHeight = 4;
                const barX = startX + 70;
                const barY = startY - 8;
                const progress = effect.duration / effect.maxDuration;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = effectInfo.color;
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                ctx.strokeStyle = effectInfo.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }

            startY += 28;
        }
    });
}

// ----------------------------------------
// Draw dialogue box
// ----------------------------------------
function drawDialogue(ctx, gs) {
    if (!gs.currentDialogue) return;

    ctx.font = 'bold 18px monospace';
    const lines = wrapText(ctx, gs.currentDialogue, 500);
    const lineHeight = 25;
    const boxHeight = lines.length * lineHeight + 40;
    const boxWidth = 520;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(
        gs.canvas.width / 2 - boxWidth / 2,
        gs.canvas.height - boxHeight - 20,
        boxWidth,
        boxHeight
    );

    // Gold border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(
        gs.canvas.width / 2 - boxWidth / 2,
        gs.canvas.height - boxHeight - 20,
        boxWidth,
        boxHeight
    );

    // Text
    ctx.fillStyle = '#ffffff';
    lines.forEach((line, i) => {
        ctx.fillText(
            line,
            gs.canvas.width / 2 - boxWidth / 2 + 20,
            gs.canvas.height - boxHeight + 10 + (i + 1) * lineHeight
        );
    });

    // Persistent dialogue hint
    if (gs.dialoguePersist) {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(
            'Press E to close',
            gs.canvas.width / 2 + boxWidth / 2 - 170,
            gs.canvas.height - 25
        );
    }
}

// ----------------------------------------
// Draw interaction prompt
// ----------------------------------------
function drawInteractionPrompt(ctx, gs) {
    let message = null;

    // Priority 0: Treasure chest
    if (gs.treasureChest && !gs.treasureChest.opened && !gs.insideHouse) {
        const distX = gs.player.x - gs.treasureChest.x;
        const distY = gs.player.y - gs.treasureChest.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < 2) {
            if (gs.enemies.length > 0) {
                message = '⚔️ Defeat all enemies first!';
            } else if (gs.inventory['Treasure Key']) {
                message = '🔑 Press E to open the treasure chest';
            } else {
                message = '🔒 The chest is locked...';
            }
        }
    }

    // Bed prompt (player's house) - hide during intro (player just woke up)
    if (!message && gs.nearBed && !gs.currentDialogue && !gs.storageOpen && !gs.sleepAnim.active && !gs.introActive) {
        message = 'Press E to sleep';
    }

    // Chest storage prompt (player's house)
    if (!message && gs.nearChest && !gs.currentDialogue && !gs.storageOpen) {
        message = 'Press E to open storage';
    }

    // Priority 1: NPC (if no dialogue open)
    if (gs.nearNPC && !gs.currentDialogue) {
        if (gs.nearNPC.type === 'blacksmith' && gs.insideHouse && gs.insideHouse.type === 'blacksmith') {
            message = 'Press E to shop';
        } else if (gs.nearNPC.type === 'farmer' && gs.insideHouse && gs.insideHouse.type === 'farmer') {
            message = 'Press E to shop';
        } else if (gs.nearNPC.type === 'doctor' && gs.insideHouse && gs.insideHouse.type === 'doctor') {
            message = 'Press E to shop';
        } else if (gs.nearNPC.type === 'fisher' && gs.insideHouse && gs.insideHouse.type === 'fisher') {
            message = 'Press E to shop';
        } else if (gs.nearNPC.type === 'merchant' && gs.insideHouse && gs.insideHouse.type === 'merchant') {
            message = 'Press E to shop';
        } else {
            const npcNames = {
                'man': 'to villager',
                'woman': 'to villager',
                'child': 'to child',
                'farmer': 'to farmer',
                'fisher': 'to fisherman',
                'merchant': 'to merchant',
                'elder': 'to elder',
                'doctor': 'to doctor',
                'blacksmith': 'to blacksmith',
                'priest': 'to priest'
            };
            message = `Press E to talk ${npcNames[gs.nearNPC.type] || 'to villager'}`;
        }
    }
    // Priority 2: House
    else if (gs.nearHouse && !gs.currentDialogue && !gs.introActive) {
        if (gs.insideHouse) {
            message = 'Press E to exit';
        } else {
            const houseNames = {
                'player': 'your house',
                'farmer': 'farmer\'s house',
                'fisher': 'fish market',
                'merchant': 'merchant\'s house',
                'elder': 'elder\'s house',
                'doctor': 'doctor\'s office',
                'blacksmith': 'forge',
                'church': 'church',
                'villager1': 'villager\'s house',
                'villager2': 'villager\'s house',
                'villager3': 'villager\'s house'
            };
            const shopTypes = ['farmer', 'fisher', 'merchant', 'doctor', 'blacksmith'];
            const closedSuffix = (gs.isNight && shopTypes.includes(gs.nearHouse.type)) ? ' (closed)' : '';
            message = `Press E to enter ${houseNames[gs.nearHouse.type] || 'house'}${closedSuffix}`;
        }
    }
    // Priority 3: Boat
    else if (gs.nearBoat && !gs.currentDialogue) {
        if (gs.currentIsland === 'main') {
            message = 'Press E to travel to desert island';
        } else if (gs.currentIsland === 'desert') {
            // Check which dock we're near
            let nearSnowDock = false;
            if (gs.snowDockLocation) {
                const dist = Math.sqrt(
                    Math.pow(gs.nearBoat.x - gs.snowDockLocation.x, 2) +
                    Math.pow(gs.nearBoat.y - gs.snowDockLocation.y, 2)
                );
                nearSnowDock = dist < 6;
            }
            message = nearSnowDock
                ? 'Press E to travel to snow island'
                : 'Press E to return to main island';
        } else if (gs.currentIsland === 'snow') {
            message = 'Press E to return to desert island';
        }
    }

    if (message) {
        ctx.font = 'bold 20px monospace';
        const textWidth = ctx.measureText(message).width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(
            gs.canvas.width / 2 - textWidth / 2 - 15,
            gs.canvas.height / 2 - 40,
            textWidth + 30,
            45
        );

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            gs.canvas.width / 2 - textWidth / 2 - 15,
            gs.canvas.height / 2 - 40,
            textWidth + 30,
            45
        );

        ctx.fillStyle = '#ffd700';
        ctx.fillText(
            message,
            gs.canvas.width / 2 - textWidth / 2,
            gs.canvas.height / 2 - 10
        );
    }
}

// ----------------------------------------
// Draw shop interface
// ----------------------------------------
function drawShop(ctx, gs) {
    if (!gs.shopMode || !gs.currentShop) return;

    const shopWidth = 550;
    const shopHeight = 450;
    const shopX = gs.canvas.width / 2 - shopWidth / 2;
    const shopY = gs.canvas.height / 2 - shopHeight / 2;

    // Background color by shop type
    if (gs.currentShop.type === 'blacksmith') {
        ctx.fillStyle = 'rgba(60, 60, 60, 0.95)';
    } else if (gs.currentShop.type === 'doctor') {
        ctx.fillStyle = 'rgba(200, 50, 80, 0.95)';
    } else if (gs.currentShop.type === 'merchant') {
        ctx.fillStyle = 'rgba(100, 50, 150, 0.95)';
    } else if (gs.currentShop.type === 'fisher') {
        ctx.fillStyle = 'rgba(30, 100, 180, 0.95)';
    } else {
        ctx.fillStyle = 'rgba(34, 139, 34, 0.95)';
    }
    ctx.fillRect(shopX, shopY, shopWidth, shopHeight);

    // Gold border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);

    // Title
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#ffd700';
    let title = '🌾 FARMER\'S SHOP 🌾';
    if (gs.currentShop.type === 'blacksmith') {
        title = '⚒️ FORGE - ARMORY ⚒️';
    } else if (gs.currentShop.type === 'doctor') {
        title = '⚕️ MEDICAL OFFICE ⚕️';
    } else if (gs.currentShop.type === 'merchant') {
        title = '🔮 POTION SHOP 🔮';
    } else if (gs.currentShop.type === 'fisher') {
        title = '🐟 FISH MARKET 🐟';
    }
    ctx.fillText(title, shopX + 30, shopY + 40);

    // Separator
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shopX + 20, shopY + 55);
    ctx.lineTo(shopX + shopWidth - 20, shopY + 55);
    ctx.stroke();

    // Money display
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 Your money: ${gs.money} coins`, shopX + 30, shopY + 90);

    // Item list
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';

    let yOffset = 130;
    const shopItemAreas = [];

    gs.currentShop.items.forEach((item, index) => {
        const canAfford = gs.money >= item.price;
        const rowX = shopX + 30;
        const rowY = shopY + yOffset - 22;
        const rowW = shopWidth - 60;
        const rowH = 38;

        shopItemAreas.push({ x: rowX, y: rowY, w: rowW, h: rowH, index });

        const isHover = gs.mouse.x >= rowX && gs.mouse.x <= rowX + rowW &&
                        gs.mouse.y >= rowY && gs.mouse.y <= rowY + rowH;

        ctx.fillStyle = canAfford
            ? (isHover ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)')
            : 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(rowX, rowY, rowW, rowH);

        ctx.strokeStyle = canAfford ? (isHover ? '#ffd700' : '#ffffff') : '#666666';
        ctx.lineWidth = isHover && canAfford ? 3 : 2;
        ctx.strokeRect(rowX, rowY, rowW, rowH);

        ctx.fillStyle = canAfford ? '#ffffff' : '#888888';
        let itemText = `${item.name} - ${item.price}💰`;

        if (gs.currentShop.type === 'blacksmith' && item.icon) {
            itemText = `${item.icon} ${item.name} - ${item.price}💰`;
        }

        ctx.fillText(itemText, shopX + 40, shopY + yOffset);

        yOffset += 50;
    });

    // Handle shop item click
    if (gs.mouse.leftClick) {
        for (const area of shopItemAreas) {
            if (gs.mouse.x >= area.x && gs.mouse.x <= area.x + area.w &&
                gs.mouse.y >= area.y && gs.mouse.y <= area.y + area.h) {
                handleShopPurchaseByIndex(gs, area.index);
                break;
            }
        }
    }

    // Instructions
    ctx.font = '15px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Click to buy', shopX + 30, shopY + shopHeight - 45);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Press E to close', shopX + 30, shopY + shopHeight - 20);
}

// ----------------------------------------
// Draw level-up reward choice
// ----------------------------------------
function drawLevelUpChoice(ctx, gs) {
    if (!gs.levelUpChoice) return;

    const boxWidth = 600;
    const boxHeight = 380;
    const boxX = gs.canvas.width / 2 - boxWidth / 2;
    const boxY = gs.canvas.height / 2 - boxHeight / 2;

    // Background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(10, 10, 10, 0.98)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.shadowBlur = 0;

    // Gold border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 6;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Title "LEVEL UP!"
    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText('LEVEL UP!', boxX + boxWidth / 2 - 130, boxY + 57);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('LEVEL UP!', boxX + boxWidth / 2 - 132, boxY + 55);

    // Level reached
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Level ${gs.player.level} reached!`, boxX + boxWidth / 2 - 140, boxY + 100);

    // Instruction
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Choose your reward:', boxX + boxWidth / 2 - 180, boxY + 145);

    // Option 1: Heart
    const option1Y = boxY + 190;
    const option1Height = 70;

    ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
    ctx.fillRect(boxX + 30, option1Y, boxWidth - 60, option1Height);
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX + 30, option1Y, boxWidth - 60, option1Height);

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ff6666';
    ctx.fillText('❤️', boxX + 50, option1Y + 45);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('+1 Heart', boxX + 100, option1Y + 30);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Increases your max health', boxX + 100, option1Y + 55);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('[Press 1]', boxX + boxWidth - 220, option1Y + 45);

    // Option 2: Gems
    const option2Y = boxY + 280;
    const option2Height = 70;

    ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
    ctx.fillRect(boxX + 30, option2Y, boxWidth - 60, option2Height);
    ctx.strokeStyle = '#66ccff';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX + 30, option2Y, boxWidth - 60, option2Height);

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#66ccff';
    ctx.fillText('💎', boxX + 50, option2Y + 45);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('+2 Gems', boxX + 100, option2Y + 30);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('To buy special weapons', boxX + 100, option2Y + 55);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('[Press 2]', boxX + boxWidth - 220, option2Y + 45);
}

// ----------------------------------------
// Draw inventory screen (tabbed)
// ----------------------------------------
function drawInventory(ctx, gs) {
    if (!gs.showInventory) return;

    const invWidth = 520;
    const invHeight = 600;
    const invX = gs.canvas.width / 2 - invWidth / 2;
    const invY = gs.canvas.height / 2 - invHeight / 2;

    // Background gradient
    const gradient = ctx.createLinearGradient(invX, invY, invX, invY + invHeight);
    gradient.addColorStop(0, 'rgba(30, 30, 40, 0.98)');
    gradient.addColorStop(1, 'rgba(15, 15, 20, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(invX, invY, invWidth, invHeight);

    // Double gold border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.strokeRect(invX, invY, invWidth, invHeight);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.strokeRect(invX + 3, invY + 3, invWidth - 6, invHeight - 6);

    // Title
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText('INVENTORY', invX + 22, invY + 42);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('INVENTORY', invX + 20, invY + 40);

    // Separator
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(invX + 20, invY + 55);
    ctx.lineTo(invX + invWidth - 20, invY + 55);
    ctx.stroke();

    // Money panel
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.fillRect(invX + 20, invY + 65, invWidth - 40, 35);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(invX + 20, invY + 65, invWidth - 40, 35);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Money: ${gs.money} coins`, invX + 35, invY + 89);

    // ====== TABS ======
    const tabY = invY + 112;
    const tabHeight = 32;
    const tabWidth = (invWidth - 40) / 3;
    const tabLabels = [
        { name: 'Weapons', color: '#ff8800', slots: `${countCategorySlots(gs, 'weapon')}/${INVENTORY_SLOTS_WEAPONS}` },
        { name: 'Food', color: '#00ff88', slots: `${countCategorySlots(gs, 'food')}/${INVENTORY_SLOTS_FOOD}` },
        { name: 'Items', color: '#aa66ff', slots: `${countCategorySlots(gs, 'item')}/${INVENTORY_SLOTS_ITEMS}` }
    ];

    // Track tab hit areas for mouse clicks
    const tabAreas = [];

    tabLabels.forEach((tab, i) => {
        const tx = invX + 20 + i * tabWidth;
        const isActive = gs.inventoryTab === i;

        tabAreas.push({ x: tx, y: tabY, w: tabWidth, h: tabHeight, index: i });

        // Tab background
        ctx.fillStyle = isActive ? tab.color + '44' : 'rgba(40, 40, 50, 0.8)';
        ctx.fillRect(tx, tabY, tabWidth, tabHeight);

        // Tab border
        ctx.strokeStyle = isActive ? tab.color : '#555555';
        ctx.lineWidth = isActive ? 3 : 1;
        ctx.strokeRect(tx, tabY, tabWidth, tabHeight);

        // Tab text
        ctx.font = isActive ? 'bold 14px monospace' : '13px monospace';
        ctx.fillStyle = isActive ? tab.color : '#888888';
        ctx.fillText(`${tab.name} (${tab.slots})`, tx + 8, tabY + 22);

        // Mouse hover highlight
        if (!isActive &&
            gs.mouse.x >= tx && gs.mouse.x <= tx + tabWidth &&
            gs.mouse.y >= tabY && gs.mouse.y <= tabY + tabHeight) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(tx, tabY, tabWidth, tabHeight);
        }
    });

    // Handle tab click
    if (gs.mouse.leftClick) {
        for (const area of tabAreas) {
            if (gs.mouse.x >= area.x && gs.mouse.x <= area.x + area.w &&
                gs.mouse.y >= area.y && gs.mouse.y <= area.y + area.h) {
                gs.inventoryTab = area.index;
            }
        }
    }

    // ====== TAB CONTENT ======
    const contentY = tabY + tabHeight + 15;
    let yOff = contentY;
    const itemRowHeight = 45;
    const itemRowPad = 5;
    const itemAreas = [];

    if (gs.inventoryTab === 0) {
        // Weapons tab
        const weaponsList = Object.entries(gs.weapons);
        if (weaponsList.length === 0) {
            ctx.font = 'italic 16px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('~ No weapons ~', invX + 40, yOff + 15);
        } else {
            weaponsList.forEach(([weaponName, weaponData]) => {
                // All owned weapons are always equipped (sword + shield)
                const isEquipped = true;
                const rowY = yOff;

                itemAreas.push({ x: invX + 30, y: rowY, w: invWidth - 60, h: itemRowHeight, name: weaponName, category: 'weapon' });

                // Hover
                const isHover = gs.mouse.x >= invX + 30 && gs.mouse.x <= invX + invWidth - 30 &&
                                gs.mouse.y >= rowY && gs.mouse.y <= rowY + itemRowHeight;

                ctx.fillStyle = isEquipped ? 'rgba(0, 255, 0, 0.15)' : (isHover ? 'rgba(255, 136, 0, 0.2)' : 'rgba(255, 136, 0, 0.08)');
                ctx.fillRect(invX + 30, rowY, invWidth - 60, itemRowHeight);
                ctx.strokeStyle = isEquipped ? '#00ff00' : '#ff8800';
                ctx.lineWidth = isEquipped ? 3 : 2;
                ctx.strokeRect(invX + 30, rowY, invWidth - 60, itemRowHeight);

                ctx.font = 'bold 28px monospace';
                ctx.fillStyle = isEquipped ? '#00ff00' : '#ffaa00';
                ctx.fillText(weaponData.icon, invX + 45, rowY + 32);

                ctx.font = 'bold 18px monospace';
                ctx.fillStyle = isEquipped ? '#00ff00' : '#ffffff';
                ctx.fillText(weaponName, invX + 90, rowY + 28);

                if (isEquipped) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                    ctx.fillRect(invX + invWidth - 150, rowY + 10, 100, 25);
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(invX + invWidth - 150, rowY + 10, 100, 25);
                    ctx.font = 'bold 14px monospace';
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText('EQUIPPED', invX + invWidth - 140, rowY + 28);
                }

                yOff += itemRowHeight + itemRowPad;
            });
        }
    } else if (gs.inventoryTab === 1) {
        // Food tab
        const foodItems = Object.entries(gs.food);
        if (foodItems.length === 0) {
            ctx.font = 'italic 16px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('~ No food ~', invX + 40, yOff + 15);
        } else {
            foodItems.forEach(([itemName, quantity], index) => {
                let icon = '?';
                let healAmount = 0;
                if (itemName.includes('Tomato')) { icon = '🍅'; healAmount = 0.25; }
                if (itemName.includes('Carrot')) { icon = '🥕'; healAmount = 0.25; }
                if (itemName.includes('Basket') && itemName.includes('Vegetable')) { icon = '🧺'; healAmount = 0.5; }
                if (itemName === 'Fish') { icon = '🐟'; healAmount = 0.25; }
                if (itemName === 'Salmon') { icon = '🐠'; healAmount = 0.5; }
                if (itemName.includes('Basket') && itemName.includes('Fish')) { icon = '🧺'; healAmount = 0.75; }
                if (itemName === 'Bandage') { icon = '🩹'; healAmount = 1; }
                if (itemName === 'Medical Kit') { icon = '💊'; healAmount = 2; }

                const rowY = yOff;
                itemAreas.push({ x: invX + 30, y: rowY, w: invWidth - 60, h: itemRowHeight, name: itemName, category: 'food' });

                const isHover = gs.mouse.x >= invX + 30 && gs.mouse.x <= invX + invWidth - 30 &&
                                gs.mouse.y >= rowY && gs.mouse.y <= rowY + itemRowHeight;

                ctx.fillStyle = isHover ? 'rgba(0, 255, 100, 0.2)' : 'rgba(0, 255, 100, 0.08)';
                ctx.fillRect(invX + 30, rowY, invWidth - 60, itemRowHeight);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
                ctx.strokeRect(invX + 30, rowY, invWidth - 60, itemRowHeight);

                ctx.font = 'bold 28px monospace';
                ctx.fillStyle = '#00ffaa';
                ctx.fillText(icon, invX + 45, rowY + 32);

                ctx.font = 'bold 17px monospace';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`[${index + 1}] ${itemName}`, invX + 90, rowY + 20);

                if (healAmount > 0) {
                    ctx.font = '13px monospace';
                    ctx.fillStyle = '#ff6666';
                    ctx.fillText(`+${healAmount} heart`, invX + 90, rowY + 38);
                }

                // Quantity badge
                ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
                ctx.fillRect(invX + invWidth - 120, rowY + 10, 80, 25);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
                ctx.strokeRect(invX + invWidth - 120, rowY + 10, 80, 25);
                ctx.font = 'bold 16px monospace';
                ctx.fillStyle = '#00ffaa';
                ctx.fillText(`x${quantity}`, invX + invWidth - 100, rowY + 28);

                yOff += itemRowHeight + itemRowPad;
            });
        }
    } else if (gs.inventoryTab === 2) {
        // Items tab
        const items = Object.entries(gs.inventory);
        if (items.length === 0) {
            ctx.font = 'italic 16px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('~ No items ~', invX + 40, yOff + 15);
        } else {
            let potionIndex = 0;
            items.forEach(([itemName, quantity]) => {
                let icon = '📦';
                let isPotion = false;
                if (itemName === 'Speed Potion') { icon = '⚡'; isPotion = true; }
                else if (itemName === 'Invisibility Potion') { icon = '👻'; isPotion = true; }
                else if (itemName === 'Strength Potion') { icon = '💪'; isPotion = true; }
                else if (itemName === 'Invincibility Potion') { icon = '💫'; isPotion = true; }
                else if (itemName === 'Treasure Key') { icon = '🔑'; }
                else if (itemName === "Father's Letter") { icon = '📜'; }

                const rowY = yOff;
                itemAreas.push({ x: invX + 30, y: rowY, w: invWidth - 60, h: itemRowHeight, name: itemName, category: 'item' });

                const isHover = gs.mouse.x >= invX + 30 && gs.mouse.x <= invX + invWidth - 30 &&
                                gs.mouse.y >= rowY && gs.mouse.y <= rowY + itemRowHeight;

                ctx.fillStyle = isHover ? 'rgba(170, 100, 255, 0.2)' : 'rgba(170, 100, 255, 0.08)';
                ctx.fillRect(invX + 30, rowY, invWidth - 60, itemRowHeight);
                ctx.strokeStyle = '#aa66ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(invX + 30, rowY, invWidth - 60, itemRowHeight);

                ctx.font = 'bold 28px monospace';
                ctx.fillStyle = isPotion ? '#ffaa66' : '#bb88ff';
                ctx.fillText(icon, invX + 45, rowY + 32);

                ctx.font = 'bold 17px monospace';
                ctx.fillStyle = '#ffffff';
                if (isPotion) {
                    ctx.fillText(`[${potionIndex + 1}] ${itemName}`, invX + 90, rowY + 28);
                    potionIndex++;
                } else {
                    ctx.fillText(itemName, invX + 90, rowY + 28);
                }

                // Quantity badge
                ctx.fillStyle = 'rgba(170, 100, 255, 0.3)';
                ctx.fillRect(invX + invWidth - 120, rowY + 10, 80, 25);
                ctx.strokeStyle = '#aa66ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(invX + invWidth - 120, rowY + 10, 80, 25);
                ctx.font = 'bold 16px monospace';
                ctx.fillStyle = '#bb88ff';
                ctx.fillText(`x${quantity}`, invX + invWidth - 100, rowY + 28);

                yOff += itemRowHeight + itemRowPad;
            });
        }
    }

    // Handle item click
    if (gs.mouse.leftClick) {
        for (const area of itemAreas) {
            if (gs.mouse.x >= area.x && gs.mouse.x <= area.x + area.w &&
                gs.mouse.y >= area.y && gs.mouse.y <= area.y + area.h) {
                handleInventoryClick(gs, area.name, area.category);
                break;
            }
        }
    }

    // Instructions bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(invX + 20, invY + invHeight - 60, invWidth - 40, 42);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('Click or Number: Use item', invX + 30, invY + invHeight - 40);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Left/Right: Switch tab', invX + 30, invY + invHeight - 22);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('TAB: Close', invX + invWidth - 130, invY + invHeight - 22);
}

// ----------------------------------------
// Draw help screen
// ----------------------------------------
export function drawHelp(ctx, gs) {
    if (!gs.showHelp) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, gs.canvas.width, gs.canvas.height);

    const boxWidth = 700;
    const boxHeight = 680;
    const boxX = (gs.canvas.width - boxWidth) / 2;
    const boxY = (gs.canvas.height - boxHeight) / 2;

    ctx.fillStyle = 'rgba(40, 40, 60, 0.98)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Title
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('⌨️ CONTROLS ⌨️', gs.canvas.width / 2, boxY + 45);

    // Separator
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 30, boxY + 65);
    ctx.lineTo(boxX + boxWidth - 30, boxY + 65);
    ctx.stroke();

    const controls = [
        { category: 'MOVEMENT', keys: [
            { key: 'Z', action: 'Move up' },
            { key: 'Q', action: 'Move left' },
            { key: 'S', action: 'Move down' },
            { key: 'D', action: 'Move right' },
            { key: 'SHIFT', action: 'Sprint (hold)' },
            { key: 'SPACE', action: 'Jump' }
        ]},
        { category: 'COMBAT', keys: [
            { key: 'L-Click', action: 'Attack (requires sword)' },
            { key: 'R-Click', action: 'Block with shield (hold)' }
        ]},
        { category: 'INVENTORY & MENUS', keys: [
            { key: 'TAB', action: 'Open/Close inventory' },
            { key: 'Left/Right', action: 'Switch inventory tab' },
            { key: '1-9', action: 'Use item from active tab' },
            { key: 'A (tap)', action: 'Quick heal (best food)' },
            { key: 'A (hold)', action: 'Open inventory Food tab' },
            { key: 'M', action: 'Show/Hide full map' },
            { key: 'P', action: 'Show/Hide this help page' },
            { key: 'K', action: 'Save game' }
        ]},
        { category: 'INTERACTION', keys: [
            { key: 'E', action: 'Interact / talk / shop / chest' },
            { key: 'Mouse', action: 'Click items in inventory/storage' }
        ]}
    ];

    let yOffset = boxY + 90;
    ctx.textAlign = 'left';

    controls.forEach(section => {
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(section.category, boxX + 40, yOffset);
        yOffset += 26;

        section.keys.forEach(control => {
            ctx.fillStyle = 'rgba(80, 80, 100, 0.6)';
            ctx.fillRect(boxX + 50, yOffset - 16, 130, 24);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX + 50, yOffset - 16, 130, 24);

            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(control.key, boxX + 56, yOffset);

            ctx.font = '14px monospace';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(control.action, boxX + 200, yOffset);

            yOffset += 26;
        });

        yOffset += 10;
    });

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('Press P to close', gs.canvas.width / 2, boxY + boxHeight - 25);

    ctx.textAlign = 'left';
}

// ----------------------------------------
// Draw intro dialogue
// ----------------------------------------
export function drawIntroDialogue(ctx, gs) {
    if (!gs.introActive) return;

    const boxHeight = 120;
    const boxY = gs.canvas.height - boxHeight - 20;

    // Phase 0: Knock on the door (compact bottom bar)
    if (gs.introPhase === 0) {
        const smallH = 60;
        const smallY = gs.canvas.height - smallH - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(20, smallY, gs.canvas.width - 40, smallH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, smallY, gs.canvas.width - 40, smallH);

        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('* Knock knock knock *  Someone is at the door...', 35, smallY + 25);

        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.font = '13px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('Press E to get up', gs.canvas.width - 200, smallY + 47);
        }
        return;
    }

    // Phase 1: Walking to door - compact hint bar
    if (gs.introPhase === 1) {
        const smallH = 44;
        const smallY = gs.canvas.height - smallH - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.80)';
        ctx.fillRect(20, smallY, gs.canvas.width - 40, smallH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, smallY, gs.canvas.width - 40, smallH);

        ctx.font = '15px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Go open the door.', 35, smallY + 20);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Move with Z Q S D', 35, smallY + 36);
        return;
    }

    // Phase 2: At the door - compact prompt
    if (gs.introPhase === 2) {
        const smallH = 44;
        const smallY = gs.canvas.height - smallH - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(20, smallY, gs.canvas.width - 40, smallH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, smallY, gs.canvas.width - 40, smallH);

        ctx.font = '15px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('You hear someone behind the door...', 35, smallY + 20);

        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.font = '13px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('Press E to open the door', gs.canvas.width - 260, smallY + 36);
        }
        return;
    }

    // Phase 3: Elder greeting at door (compact)
    if (gs.introPhase === 3) {
        const h = 70;
        const y = gs.canvas.height - h - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(20, y, gs.canvas.width - 40, h);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, y, gs.canvas.width - 40, h);

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('The Elder', 35, y + 18);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText("Ah, you're finally awake! Come, sit with me.", 35, y + 38);
        ctx.fillText("I have something to tell you.", 35, y + 54);

        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.font = '12px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('Press E ...', gs.canvas.width - 130, y + 54);
        }
        return;
    }

    // Phase 4: Seated dialogue sequence (compact)
    if (gs.introPhase === 4) {
        const h = 74;
        const y = gs.canvas.height - h - 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(20, y, gs.canvas.width - 40, h);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, y, gs.canvas.width - 40, h);

        // Character name
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('The Elder', 35, y + 18);

        // Dialogue text
        ctx.font = '14px monospace';
        ctx.fillStyle = '#FFFFFF';
        const dialogue = gs.introDialogues[gs.introDialogueIndex] || '';
        const lines = wrapText(ctx, dialogue, gs.canvas.width - 100);
        lines.forEach((line, i) => {
            ctx.fillText(line, 35, y + 36 + i * 16);
        });

        // Continue prompt + progress
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.font = '12px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('Press E ...', gs.canvas.width - 130, y + h - 10);
        }
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText(`${gs.introDialogueIndex + 1}/${gs.introDialogues.length}`, 35, y + h - 10);
    }
}

// ----------------------------------------
// Draw full map (minimap M key)
// ----------------------------------------
export function drawFullMap(ctx, gs) {
    const scaleX = gs.canvas.width / gs.mapWidth;
    const scaleY = gs.canvas.height / gs.mapHeight;
    const scale = Math.min(scaleX, scaleY) * 0.75;

    const offsetX = 50;
    const offsetY = (gs.canvas.height - gs.mapHeight * scale) / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, gs.canvas.width, gs.canvas.height);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX - 3, offsetY - 3,
                   gs.mapWidth * scale + 6,
                   gs.mapHeight * scale + 6);

    for (let y = 0; y < gs.mapHeight; y++) {
        for (let x = 0; x < gs.mapWidth; x++) {
            const tile = gs.map[y][x];
            const px = offsetX + x * scale;
            const py = offsetY + y * scale;

            if (tile === 3) {
                const houseType = getHouseTypeAtPosition(gs, x, y);
                ctx.fillStyle = getHouseColor(houseType);
            } else {
                switch(tile) {
                    case 0: ctx.fillStyle = '#3a7d44'; break;  // Grass
                    case 1: ctx.fillStyle = '#c9b590'; break;  // Path
                    case 2: ctx.fillStyle = '#228B22'; break;  // Tree
                    case 4: ctx.fillStyle = '#4169E1'; break;  // Water
                    case 5: ctx.fillStyle = '#ff69b4'; break;  // Flower
                    case 6: ctx.fillStyle = '#808080'; break;  // Rock
                    case 7: ctx.fillStyle = '#A0791A'; break;  // Dock
                    case 8: ctx.fillStyle = '#a52a2a'; break;  // Bed
                    case 9: ctx.fillStyle = '#8b4513'; break;  // Table
                    case 10: ctx.fillStyle = '#654321'; break; // Chair
                    case 11: ctx.fillStyle = '#ffd700'; break; // Chest
                    case 12: ctx.fillStyle = '#696969'; break; // Workbench
                    case 13: ctx.fillStyle = '#654321'; break; // Bookshelf
                    case 14: ctx.fillStyle = '#cd853f'; break; // Counter
                    case 15: ctx.fillStyle = '#8b0000'; break; // Sofa
                    case 16: ctx.fillStyle = '#654321'; break; // Shelf
                    case 17: ctx.fillStyle = '#c0c0c0'; break; // Hanging fish
                    case 18: ctx.fillStyle = '#ff6347'; break; // Vegetable crate
                    case 19: ctx.fillStyle = '#8b4513'; break; // Barrel
                    case 20: ctx.fillStyle = '#e0f7fa'; break; // Fish stall
                    case 21: ctx.fillStyle = '#ff8c00'; break; // Carrot crate
                    case 22: ctx.fillStyle = '#696969'; break; // Anvil
                    case 23: ctx.fillStyle = '#ff4500'; break; // Forge
                    case 24: ctx.fillStyle = '#9370db'; break; // Potion shelf
                    case 25: ctx.fillStyle = '#f5f5f5'; break; // Medical bed
                    case 26: ctx.fillStyle = '#ffd700'; break; // Altar
                    case 27: ctx.fillStyle = '#654321'; break; // Church pew
                    case 28: ctx.fillStyle = '#4682b4'; break; // Fountain
                    case 29: ctx.fillStyle = '#8b4513'; break; // Bench
                    case 30: ctx.fillStyle = '#c0c0c0'; break; // Cobblestone
                    case 31: ctx.fillStyle = '#ffdb58'; break; // Lamppost
                    case 32: ctx.fillStyle = '#ff6347'; break; // Tomato field
                    case 33: ctx.fillStyle = '#32cd32'; break; // Carrot field
                    case 34: ctx.fillStyle = '#6b4423'; break; // Plowed soil
                    case 35: ctx.fillStyle = '#f0f0f0'; break; // Snow
                    case 36: ctx.fillStyle = '#add8e6'; break; // Ice
                    case 37: ctx.fillStyle = '#1a5c2a'; break; // Pine tree
                    case 38: ctx.fillStyle = '#696969'; break; // Mountain
                    default: ctx.fillStyle = '#3a7d44'; break;
                }
            }

            ctx.fillRect(px, py, Math.max(1, scale), Math.max(1, scale));
        }
    }

    // Draw legend
    drawMapLegend(ctx, gs, offsetX + gs.mapWidth * scale + 20, offsetY);

    // NPCs on map (white dots - only visible ones)
    gs.npcs.forEach(npc => {
        if (npc.visible === false) return;

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(
            offsetX + npc.x * scale,
            offsetY + npc.y * scale,
            scale * 0.8 + 1,
            0, Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(
            offsetX + npc.x * scale,
            offsetY + npc.y * scale,
            scale * 0.8,
            0, Math.PI * 2
        );
        ctx.fill();
    });

    // Player (gold dot)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
        offsetX + gs.player.x * scale,
        offsetY + gs.player.y * scale,
        scale * 1.5 + 2,
        0, Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(
        offsetX + gs.player.x * scale,
        offsetY + gs.player.y * scale,
        scale * 1.5,
        0, Math.PI * 2
    );
    ctx.fill();

    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText('Press M to close', gs.canvas.width / 2 + 2, 32);

    ctx.fillStyle = '#ffd700';
    ctx.fillText('Press M to close', gs.canvas.width / 2, 30);

    ctx.textAlign = 'left';
}

// ----------------------------------------
// Draw map legend
// ----------------------------------------
function drawMapLegend(ctx, gs, startX, startY) {
    const houseInfo = [
        { type: 'player', name: 'Your house' },
        { type: 'farmer', name: 'Farmer' },
        { type: 'fisher', name: 'Fish market' },
        { type: 'merchant', name: 'Merchant' },
        { type: 'elder', name: 'Elder' },
        { type: 'doctor', name: 'Doctor' },
        { type: 'blacksmith', name: 'Blacksmith' },
        { type: 'church', name: 'Church' },
        { type: 'villager1', name: 'Villager 1' },
        { type: 'villager2', name: 'Villager 2' },
        { type: 'villager3', name: 'Villager 3' }
    ];

    // Legend title
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('LEGEND', startX, startY);

    // Line under title
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY + 5);
    ctx.lineTo(startX + 180, startY + 5);
    ctx.stroke();

    // House entries
    ctx.font = '13px monospace';
    houseInfo.forEach((house, index) => {
        const y = startY + 30 + index * 25;

        ctx.fillStyle = getHouseColor(house.type);
        ctx.fillRect(startX, y - 10, 15, 15);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y - 10, 15, 15);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(house.name, startX + 22, y + 2);
    });

    // Extra legend symbols
    const legendY = startY + 30 + houseInfo.length * 25 + 20;

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, legendY - 10);
    ctx.lineTo(startX + 180, legendY - 10);
    ctx.stroke();

    // You (gold dot)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(startX + 7, legendY + 5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('You', startX + 22, legendY + 10);

    // NPC (white dot)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(startX + 7, legendY + 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('NPC', startX + 22, legendY + 35);
}

// ----------------------------------------
// Draw storage UI (all items, clickable)
// ----------------------------------------
function drawStorageUI(ctx, gs) {
    if (!gs.storageOpen) return;

    const boxWidth = 550;
    const boxHeight = 520;
    const boxX = gs.canvas.width / 2 - boxWidth / 2;
    const boxY = gs.canvas.height / 2 - boxHeight / 2;

    // Background
    ctx.fillStyle = 'rgba(40, 30, 20, 0.95)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Gold border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Title with mode
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#ffd700';
    const modeLabel = gs.storageMode === 'deposit' ? 'DEPOSIT' : 'WITHDRAW';
    ctx.fillText(`STORAGE - ${modeLabel}`, boxX + 30, boxY + 40);

    // Storage capacity
    const storedCount = Object.keys(gs.playerStorage).length;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`Stored: ${storedCount}/${STORAGE_MAX_SLOTS}`, boxX + boxWidth - 170, boxY + 40);

    // Separator
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, boxY + 55);
    ctx.lineTo(boxX + boxWidth - 20, boxY + 55);
    ctx.stroke();

    // Mode tabs
    const tabW = (boxWidth - 40) / 2;
    const tabModeY = boxY + 65;
    const tabModeH = 28;
    const modeTabs = [
        { label: 'DEPOSIT', mode: 'deposit', x: boxX + 20 },
        { label: 'WITHDRAW', mode: 'withdraw', x: boxX + 20 + tabW }
    ];

    modeTabs.forEach(mt => {
        const isActive = gs.storageMode === mt.mode;
        ctx.fillStyle = isActive ? 'rgba(255, 215, 0, 0.2)' : 'rgba(40, 40, 50, 0.8)';
        ctx.fillRect(mt.x, tabModeY, tabW, tabModeH);
        ctx.strokeStyle = isActive ? '#ffd700' : '#555';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(mt.x, tabModeY, tabW, tabModeH);
        ctx.font = isActive ? 'bold 14px monospace' : '13px monospace';
        ctx.fillStyle = isActive ? '#ffd700' : '#888';
        ctx.fillText(mt.label, mt.x + 10, tabModeY + 20);

        // Click to switch mode
        if (gs.mouse.leftClick &&
            gs.mouse.x >= mt.x && gs.mouse.x <= mt.x + tabW &&
            gs.mouse.y >= tabModeY && gs.mouse.y <= tabModeY + tabModeH) {
            gs.storageMode = mt.mode;
        }
    });

    let yOffset = tabModeY + tabModeH + 15;
    const itemAreas = [];
    const rowH = 38;

    if (gs.storageMode === 'deposit') {
        // Show ALL items: weapons + food + inventory
        const weaponItems = Object.entries(gs.weapons).map(([name]) => [name, 1, 'weapon']);
        const foodItems = Object.entries(gs.food).map(([name, qty]) => [name, qty, 'food']);
        const invItems = Object.entries(gs.inventory).map(([name, qty]) => [name, qty, 'item']);
        const allItems = [...weaponItems, ...foodItems, ...invItems];

        if (allItems.length === 0) {
            ctx.font = 'italic 18px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('No items to deposit.', boxX + 30, yOffset + 10);
        } else {
            allItems.forEach(([itemName, quantity], index) => {
                if (index > 8) return;
                const rowY = yOffset;

                itemAreas.push({ x: boxX + 30, y: rowY, w: boxWidth - 60, h: rowH, name: itemName, action: 'deposit' });

                const isHover = gs.mouse.x >= boxX + 30 && gs.mouse.x <= boxX + boxWidth - 30 &&
                                gs.mouse.y >= rowY && gs.mouse.y <= rowY + rowH;

                ctx.fillStyle = isHover ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(boxX + 30, rowY, boxWidth - 60, rowH);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX + 30, rowY, boxWidth - 60, rowH);

                ctx.font = 'bold 18px monospace';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`[${index + 1}] ${itemName}`, boxX + 45, rowY + 25);
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(`x${quantity}`, boxX + boxWidth - 110, rowY + 25);

                yOffset += rowH + 4;
            });
        }
    } else {
        // Withdraw: show playerStorage items
        const storageItems = Object.entries(gs.playerStorage);

        if (storageItems.length === 0) {
            ctx.font = 'italic 18px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('Storage is empty.', boxX + 30, yOffset + 10);
        } else {
            storageItems.forEach(([itemName, quantity], index) => {
                if (index > 8) return;
                const rowY = yOffset;

                itemAreas.push({ x: boxX + 30, y: rowY, w: boxWidth - 60, h: rowH, name: itemName, action: 'withdraw' });

                const isHover = gs.mouse.x >= boxX + 30 && gs.mouse.x <= boxX + boxWidth - 30 &&
                                gs.mouse.y >= rowY && gs.mouse.y <= rowY + rowH;

                ctx.fillStyle = isHover ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(boxX + 30, rowY, boxWidth - 60, rowH);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX + 30, rowY, boxWidth - 60, rowH);

                ctx.font = 'bold 18px monospace';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`[${index + 1}] ${itemName}`, boxX + 45, rowY + 25);
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(`x${quantity}`, boxX + boxWidth - 110, rowY + 25);

                yOffset += rowH + 4;
            });
        }
    }

    // Handle item click
    if (gs.mouse.leftClick) {
        for (const area of itemAreas) {
            if (gs.mouse.x >= area.x && gs.mouse.x <= area.x + area.w &&
                gs.mouse.y >= area.y && gs.mouse.y <= area.y + area.h) {
                handleStorageClick(gs, area.name, area.action);
                break;
            }
        }
    }

    // Instructions
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Click or Number: Transfer item', boxX + 30, boxY + boxHeight - 45);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('TAB: Switch mode', boxX + 30, boxY + boxHeight - 25);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('E: Close storage', boxX + boxWidth - 190, boxY + boxHeight - 25);
}

// ----------------------------------------
// Draw title screen
// ----------------------------------------
export function drawTitleScreen(ctx, gs) {
    const w = gs.canvas.width;
    const h = gs.canvas.height;

    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a1a3a');
    gradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Star particles
    if (!gs.titleStars) {
        gs.titleStars = [];
        for (let i = 0; i < 80; i++) {
            gs.titleStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.1
            });
        }
    }
    gs.titleStars.forEach(star => {
        const brightness = 0.4 + 0.6 * Math.sin(Date.now() * star.speed * 0.01 + star.x);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Title "HUSKY ADVENTURE"
    ctx.textAlign = 'center';

    // Title shadow
    ctx.font = 'bold 64px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText('HUSKY ADVENTURE', w / 2 + 3, 200 + 3);

    // Title gold
    ctx.fillStyle = '#ffd700';
    ctx.fillText('HUSKY ADVENTURE', w / 2, 200);

    // Subtitle
    ctx.font = '24px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('A Pixel Adventure', w / 2, 250);

    // Menu options
    const hasSave = localStorage.getItem('huskyAdventureSave') !== null;
    const sel = gs.titleScreenSelection || 0;
    const menuY = 380;

    // [1] New Game
    const newGameSelected = sel === 0;
    ctx.font = 'bold 28px monospace';
    if (newGameSelected) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('> New Game <', w / 2, menuY);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('New Game', w / 2, menuY);
    }

    // [2] Continue
    const continueSelected = sel === 1;
    ctx.font = 'bold 28px monospace';
    if (!hasSave) {
        ctx.fillStyle = '#555555';
        ctx.fillText('Continue', w / 2, menuY + 50);
    } else if (continueSelected) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('> Continue <', w / 2, menuY + 50);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Continue', w / 2, menuY + 50);
    }

    // Navigation hint
    ctx.font = '16px monospace';
    ctx.fillStyle = '#666688';
    ctx.fillText('Z/S or Arrows to navigate, Enter or E to confirm', w / 2, h - 50);

    ctx.textAlign = 'left';
}

// ----------------------------------------
// Minimap tile color lookup
// ----------------------------------------
function getMinimapTileColor(tile) {
    switch(tile) {
        case 0: return '#3a7d44';  // Grass
        case 1: return '#c9b590';  // Path
        case 2: return '#228B22';  // Tree
        case 4: return '#4169E1';  // Water
        case 5: return '#ff69b4';  // Flower
        case 6: return '#808080';  // Rock
        case 7: return '#A0791A';  // Dock
        case 30: return '#c0c0c0'; // Cobblestone
        case 32: return '#ff6347'; // Tomato field
        case 33: return '#32cd32'; // Carrot field
        case 34: return '#6b4423'; // Plowed soil
        case 35: return '#f0f0f0'; // Snow
        case 36: return '#add8e6'; // Ice
        case 37: return '#1a5c2a'; // Pine tree
        case 38: return '#696969'; // Mountain
        case 39: return '#8B4513'; // Fence
        default: return '#3a7d44';
    }
}

// ----------------------------------------
// Build minimap terrain cache (offscreen canvas)
// ----------------------------------------
function buildMinimapCache(gs) {
    const cache = document.createElement('canvas');
    cache.width = gs.mapWidth;
    cache.height = gs.mapHeight;
    const cctx = cache.getContext('2d');

    for (let y = 0; y < gs.mapHeight; y++) {
        for (let x = 0; x < gs.mapWidth; x++) {
            const tile = gs.map[y][x];
            if (tile === 3) {
                const houseType = getHouseTypeAtPosition(gs, x, y);
                cctx.fillStyle = getHouseColor(houseType);
            } else {
                cctx.fillStyle = getMinimapTileColor(tile);
            }
            cctx.fillRect(x, y, 1, 1);
        }
    }

    gs.minimapCache = cache;
    gs.minimapCacheIsland = gs.currentIsland;
}

// ----------------------------------------
// Draw clock HUD (above minimap)
// ----------------------------------------
function drawClock(ctx, gs) {
    if (gs.introActive || gs.showHelp || gs.sleepAnim.active || gs.showMinimap) return;

    const phase = getTimePhase(gs.timeOfDay);
    const icon = phase === 'night' ? '\u{1F319}' : '\u{2600}\u{FE0F}';

    const hours = Math.floor(gs.timeOfDay);
    const minutes = Math.floor((gs.timeOfDay - hours) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const dayStr = `Day ${gs.dayCount}`;
    const text = `${icon} ${timeStr}  ${dayStr}`;

    // Position: above minimap area in bottom-left
    const padding = 10;
    const scale = 2;
    const mapH = gs.insideHouse ? 0 : gs.mapHeight * scale;

    // If minimap is hidden (inside house, etc.), show standalone
    const showMinimap = !gs.insideHouse && !gs.showInventory && !gs.shopMode && !gs.storageOpen;
    const clockY = showMinimap
        ? gs.canvas.height - mapH - padding - 32
        : gs.canvas.height - padding - 28;
    const clockX = padding;

    ctx.font = 'bold 14px monospace';
    const textWidth = ctx.measureText(text).width;
    const pillW = textWidth + 16;
    const pillH = 24;

    // Semi-transparent background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(clockX, clockY, pillW, pillH);

    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(clockX, clockY, pillW, pillH);

    // Text
    ctx.fillStyle = '#ffd700';
    ctx.fillText(text, clockX + 8, clockY + 17);
}

// ----------------------------------------
// Draw minimap HUD (bottom-left corner)
// ----------------------------------------
function drawMinimap(ctx, gs) {
    if (gs.insideHouse || gs.introActive || gs.showInventory || gs.shopMode ||
        gs.storageOpen || gs.showHelp || gs.sleepAnim.active) return;

    // Auto-build/rebuild cache when needed
    if (!gs.minimapCache || gs.minimapCacheIsland !== gs.currentIsland) {
        buildMinimapCache(gs);
    }

    const scale = 2;
    const mapW = gs.mapWidth * scale;
    const mapH = gs.mapHeight * scale;
    const padding = 10;
    const mmX = padding;
    const mmY = gs.canvas.height - mapH - padding;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mmX - 3, mmY - 3, mapW + 6, mapH + 6);

    // Draw cached terrain (pixel-perfect scaling)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gs.minimapCache, mmX, mmY, mapW, mapH);
    ctx.imageSmoothingEnabled = true;

    // Enemies (red dots)
    ctx.fillStyle = '#ff0000';
    gs.enemies.forEach(e => {
        if (e.health > 0) {
            ctx.fillRect(
                mmX + Math.floor(e.x) * scale,
                mmY + Math.floor(e.y) * scale,
                scale, scale
            );
        }
    });

    // NPCs (white dots - only visible ones)
    ctx.fillStyle = '#ffffff';
    gs.npcs.forEach(npc => {
        if (npc.visible === false) return;
        ctx.fillRect(
            mmX + Math.floor(npc.x) * scale,
            mmY + Math.floor(npc.y) * scale,
            scale, scale
        );
    });

    // Treasure chest (gold dot)
    if (gs.treasureChest && !gs.treasureChest.opened) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(
            mmX + Math.floor(gs.treasureChest.x) * scale,
            mmY + Math.floor(gs.treasureChest.y) * scale,
            scale + 1, scale + 1
        );
    }

    // Player (cyan dot, slightly larger for visibility)
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(
        mmX + Math.floor(gs.player.x) * scale - 1,
        mmY + Math.floor(gs.player.y) * scale - 1,
        scale + 2, scale + 2
    );

    // Night overlay on minimap (continuous)
    const nightOpacity = getNightOpacity(gs.timeOfDay);
    if (nightOpacity > 0) {
        ctx.fillStyle = `rgba(10, 10, 50, ${nightOpacity * 0.7})`;
        ctx.fillRect(mmX, mmY, mapW, mapH);
    }

    // Gold border (drawn last, on top)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX - 3, mmY - 3, mapW + 6, mapH + 6);

    // "M" key label at bottom-right of minimap
    ctx.font = 'bold 11px monospace';
    const mLabel = 'M';
    const mWidth = ctx.measureText(mLabel).width;
    const mX = mmX + mapW - mWidth - 4;
    const mY = mmY + mapH - 16;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(mX - 4, mY, mWidth + 8, 15);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(mX - 4, mY, mWidth + 8, 15);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(mLabel, mX, mY + 12);
}

// ----------------------------------------
// Get next quick-heal item info (same priority as quickHeal)
// ----------------------------------------
function getNextHealItem(gs) {
    const healPriority = [
        { name: 'Tomato', icon: '🍅' },
        { name: 'Carrot', icon: '🥕' },
        { name: 'Fish', icon: '🐟' },
        { name: 'Salmon', icon: '🐠' },
        { name: 'Vegetable Basket', icon: '🧺' },
        { name: 'Fish Basket', icon: '🧺' },
        { name: 'Bandage', icon: '🩹' },
        { name: 'Medical Kit', icon: '💊' }
    ];
    for (const item of healPriority) {
        if (gs.food[item.name] && gs.food[item.name] > 0) {
            return { icon: item.icon, qty: gs.food[item.name] };
        }
    }
    return null;
}

// ----------------------------------------
// Draw action hotbar (bottom-right)
// ----------------------------------------
function drawHotbar(ctx, gs) {
    // Hide during menus, intro, sleep
    if (gs.introActive || gs.showInventory || gs.shopMode || gs.storageOpen ||
        gs.showHelp || gs.showMinimap || gs.sleepAnim.active || gs.levelUpChoice) return;

    const slotSize = 44;
    const slotGap = 6;
    const padding = 12;
    const slots = [];

    // Slot 1: Quick heal (A)
    const healItem = getNextHealItem(gs);
    slots.push({
        icon: healItem ? healItem.icon : '❤️',
        key: 'A',
        qty: healItem ? healItem.qty : 0,
        active: !!healItem,
        borderColor: '#ff6666'
    });

    // Slot 2: Sword (Left Click)
    const hasSword = gs.weapons['Rusty Sword'] || gs.weapons['Wooden Sword'];
    const swordName = gs.weapons['Rusty Sword'] ? 'Rusty Sword' : (gs.weapons['Wooden Sword'] ? 'Wooden Sword' : null);
    slots.push({
        icon: '⚔️',
        key: 'L-Click',
        qty: 0,
        active: !!hasSword,
        borderColor: '#ff8800'
    });

    // Slot 3: Shield (Right Click)
    const hasShield = gs.weapons['Rusty Shield'] || gs.weapons['Wooden Shield'];
    slots.push({
        icon: '🛡️',
        key: 'R-Click',
        qty: 0,
        active: !!hasShield,
        borderColor: '#4488ff'
    });

    // Slot 4: Inventory (TAB)
    slots.push({
        icon: '🎒',
        key: 'TAB',
        qty: 0,
        active: true,
        borderColor: '#ffd700'
    });

    const totalWidth = slots.length * slotSize + (slots.length - 1) * slotGap;
    const startX = gs.canvas.width - totalWidth - padding;
    const startY = gs.canvas.height - slotSize - 28 - padding;

    slots.forEach((slot, i) => {
        const x = startX + i * (slotSize + slotGap);
        const y = startY;

        // Background
        ctx.fillStyle = slot.active ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x, y, slotSize, slotSize);

        // Border
        ctx.strokeStyle = slot.active ? slot.borderColor : '#555555';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, slotSize, slotSize);

        // Icon (centered in slot)
        ctx.font = '22px monospace';
        ctx.fillStyle = slot.active ? '#ffffff' : '#666666';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.icon, x + slotSize / 2, y + slotSize / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Quantity badge (top-right corner)
        if (slot.qty > 0) {
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + slotSize - 18, y + 2, 16, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${slot.qty}`, x + slotSize - 16, y + 13);
        }

        // Key label below slot
        ctx.font = 'bold 11px monospace';
        const keyWidth = ctx.measureText(slot.key).width;
        const keyX = x + (slotSize - keyWidth) / 2;
        const keyY = y + slotSize + 4;

        // Key background pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(keyX - 4, keyY - 1, keyWidth + 8, 16);
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.strokeRect(keyX - 4, keyY - 1, keyWidth + 8, 16);

        ctx.fillStyle = '#cccccc';
        ctx.fillText(slot.key, keyX, keyY + 11);
    });
}

// ----------------------------------------
// Main drawUI - orchestrates all UI
// ----------------------------------------
export function drawUI(ctx, gs) {
    drawMinimap(ctx, gs);
    drawClock(ctx, gs);
    drawHearts(ctx, gs);
    drawLevel(ctx, gs);
    drawSettingsIcon(ctx, gs);
    drawActiveEffects(ctx, gs);
    drawHotbar(ctx, gs);
    drawDialogue(ctx, gs);
    drawInteractionPrompt(ctx, gs);
    drawShop(ctx, gs);
    drawStorageUI(ctx, gs);
    drawLevelUpChoice(ctx, gs);
    drawInventory(ctx, gs);
}
