// ========================================
// UI - HUD, inventory, shop, help, minimap
// ========================================
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

    // Bed prompt (player's house)
    if (!message && gs.nearBed && !gs.currentDialogue && !gs.storageOpen && !gs.sleepAnim.active) {
        message = gs.isNight ? 'Press E to wake up' : 'Press E to sleep';
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
                'assistant': 'to assistant',
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
    else if (gs.nearHouse && !gs.currentDialogue) {
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
            message = `Press E to enter ${houseNames[gs.nearHouse.type] || 'house'}`;
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
    gs.currentShop.items.forEach(item => {
        const canAfford = gs.money >= item.price;
        ctx.fillStyle = canAfford ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(shopX + 30, shopY + yOffset - 22, shopWidth - 60, 38);

        ctx.strokeStyle = canAfford ? '#ffffff' : '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(shopX + 30, shopY + yOffset - 22, shopWidth - 60, 38);

        ctx.fillStyle = canAfford ? '#ffffff' : '#888888';
        let itemText = `[${item.key}] ${item.name} - ${item.price}💰`;

        if (gs.currentShop.type === 'blacksmith' && item.icon) {
            itemText = `[${item.key}] ${item.icon} ${item.name} - ${item.price}💰`;
        }

        ctx.fillText(itemText, shopX + 40, shopY + yOffset);

        yOffset += 50;
    });

    // Instructions
    ctx.font = '15px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press number to buy', shopX + 30, shopY + shopHeight - 45);
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
// Draw inventory screen
// ----------------------------------------
function drawInventory(ctx, gs) {
    if (!gs.showInventory) return;

    const invWidth = 520;
    const invHeight = 680;
    const invX = gs.canvas.width / 2 - invWidth / 2;
    const invY = gs.canvas.height / 2 - invHeight / 2;

    // Background gradient
    const gradient = ctx.createLinearGradient(invX, invY, invX, invY + invHeight);
    gradient.addColorStop(0, 'rgba(30, 30, 40, 0.98)');
    gradient.addColorStop(1, 'rgba(15, 15, 20, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(invX, invY, invWidth, invHeight);

    // Outer shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // Double gold border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.strokeRect(invX, invY, invWidth, invHeight);

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.strokeRect(invX + 3, invY + 3, invWidth - 6, invHeight - 6);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Title with shadow
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText('🎒 INVENTORY 🎒', invX + 22, invY + 42);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('🎒 INVENTORY 🎒', invX + 20, invY + 40);

    // Main separator
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(invX + 20, invY + 55);
    ctx.lineTo(invX + invWidth - 20, invY + 55);
    ctx.stroke();

    // Money panel
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.fillRect(invX + 20, invY + 65, invWidth - 40, 40);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(invX + 20, invY + 65, invWidth - 40, 40);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 Money: ${gs.money} coins`, invX + 35, invY + 92);

    let yOffset = 130;

    // ====== WEAPONS section ======
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(255, 136, 0, 0.2)';
    ctx.fillRect(invX + 20, yOffset - 5, invWidth - 40, 30);
    ctx.fillStyle = '#ff8800';
    ctx.fillText('⚔️ WEAPONS', invX + 30, yOffset + 18);
    yOffset += 35;

    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(invX + 30, yOffset);
    ctx.lineTo(invX + invWidth - 30, yOffset);
    ctx.stroke();
    yOffset += 25;

    const weaponsList = Object.entries(gs.weapons);
    if (weaponsList.length === 0) {
        ctx.font = 'italic 16px monospace';
        ctx.fillStyle = '#777777';
        ctx.fillText('~ No weapons ~', invX + 40, yOffset);
        yOffset += 35;
    } else {
        ctx.font = 'bold 18px monospace';
        weaponsList.forEach(([weaponName, weaponData]) => {
            const isEquipped = gs.equippedWeapon === weaponName;

            if (isEquipped) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
            } else {
                ctx.fillStyle = 'rgba(255, 136, 0, 0.08)';
            }
            ctx.fillRect(invX + 30, yOffset - 25, invWidth - 60, 45);

            ctx.strokeStyle = isEquipped ? '#00ff00' : '#ff8800';
            ctx.lineWidth = isEquipped ? 3 : 2;
            ctx.strokeRect(invX + 30, yOffset - 25, invWidth - 60, 45);

            // Weapon icon
            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = isEquipped ? '#00ff00' : '#ffaa00';
            ctx.fillText(weaponData.icon, invX + 45, yOffset + 5);

            // Weapon name
            ctx.font = 'bold 18px monospace';
            ctx.fillStyle = isEquipped ? '#00ff00' : '#ffffff';
            ctx.fillText(weaponName, invX + 90, yOffset);

            // Equipped badge
            if (isEquipped) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(invX + invWidth - 150, yOffset - 15, 100, 25);
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(invX + invWidth - 150, yOffset - 15, 100, 25);

                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#00ff00';
                ctx.fillText('✓ EQUIPPED', invX + invWidth - 145, yOffset + 2);
            }

            yOffset += 55;
        });
    }

    // ====== HEAL section ======
    yOffset += 15;
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
    ctx.fillRect(invX + 20, yOffset - 5, invWidth - 40, 30);
    ctx.fillStyle = '#00ff88';
    ctx.fillText('🍎 HEAL', invX + 30, yOffset + 18);
    yOffset += 35;

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(invX + 30, yOffset);
    ctx.lineTo(invX + invWidth - 30, yOffset);
    ctx.stroke();
    yOffset += 25;

    const foodItems = Object.entries(gs.food);
    if (foodItems.length === 0) {
        ctx.font = 'italic 16px monospace';
        ctx.fillStyle = '#777777';
        ctx.fillText('~ No food ~', invX + 40, yOffset);
        yOffset += 35;
    } else {
        ctx.font = 'bold 17px monospace';
        foodItems.forEach(([itemName, quantity], index) => {
            let icon = '🍽️';
            let healAmount = 0;

            if (itemName.includes('Tomato')) { icon = '🍅'; healAmount = 0.25; }
            if (itemName.includes('Carrot')) { icon = '🥕'; healAmount = 0.25; }
            if (itemName.includes('Basket') && itemName.includes('Vegetable')) { icon = '🧺'; healAmount = 0.5; }
            if (itemName === 'Fish') { icon = '🐟'; healAmount = 0.25; }
            if (itemName === 'Salmon') { icon = '🐠'; healAmount = 0.5; }
            if (itemName.includes('Basket') && itemName.includes('Fish')) { icon = '🧺'; healAmount = 0.75; }
            if (itemName === 'Bandage') { icon = '🩹'; healAmount = 1; }
            if (itemName === 'Medical Kit') { icon = '💊'; healAmount = 2; }

            ctx.fillStyle = 'rgba(0, 255, 100, 0.08)';
            ctx.fillRect(invX + 30, yOffset - 25, invWidth - 60, 45);

            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.strokeRect(invX + 30, yOffset - 25, invWidth - 60, 45);

            // Icon
            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = '#00ffaa';
            ctx.fillText(icon, invX + 45, yOffset + 5);

            // Name
            ctx.font = 'bold 17px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`[${index + 1}] ${itemName}`, invX + 90, yOffset - 5);

            // Heal amount
            if (healAmount > 0) {
                ctx.font = '13px monospace';
                ctx.fillStyle = '#ff6666';
                ctx.fillText(`❤️ +${healAmount}`, invX + 90, yOffset + 12);
            }

            // Quantity badge
            ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
            ctx.fillRect(invX + invWidth - 120, yOffset - 15, 80, 25);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.strokeRect(invX + invWidth - 120, yOffset - 15, 80, 25);

            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#00ffaa';
            ctx.fillText(`x${quantity}`, invX + invWidth - 100, yOffset + 2);

            yOffset += 55;
        });
    }

    // ====== ITEMS section ======
    yOffset += 15;
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(170, 100, 255, 0.2)';
    ctx.fillRect(invX + 20, yOffset - 5, invWidth - 40, 30);
    ctx.fillStyle = '#aa66ff';
    ctx.fillText('📦 ITEMS', invX + 30, yOffset + 18);
    yOffset += 35;

    ctx.strokeStyle = '#aa66ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(invX + 30, yOffset);
    ctx.lineTo(invX + invWidth - 30, yOffset);
    ctx.stroke();
    yOffset += 25;

    const items = Object.entries(gs.inventory);
    if (items.length === 0) {
        ctx.font = 'italic 16px monospace';
        ctx.fillStyle = '#777777';
        ctx.fillText('~ No items ~', invX + 40, yOffset);
    } else {
        const foodItemsCount = Object.entries(gs.food).length;
        let potionIndex = 0;

        ctx.font = 'bold 17px monospace';
        items.forEach(([itemName, quantity], index) => {
            let icon = '📦';
            let isPotion = false;

            if (itemName === 'Speed Potion') { icon = '⚡'; isPotion = true; }
            else if (itemName === 'Invisibility Potion') { icon = '👻'; isPotion = true; }
            else if (itemName === 'Strength Potion') { icon = '💪'; isPotion = true; }
            else if (itemName === 'Invincibility Potion') { icon = '💫'; isPotion = true; }
            else if (itemName === 'Treasure Key') { icon = '🔑'; }

            const globalIndex = foodItemsCount + potionIndex + 1;

            ctx.fillStyle = 'rgba(170, 100, 255, 0.08)';
            ctx.fillRect(invX + 30, yOffset - 25, invWidth - 60, 45);

            ctx.strokeStyle = '#aa66ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(invX + 30, yOffset - 25, invWidth - 60, 45);

            // Icon
            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = isPotion ? '#ffaa66' : '#bb88ff';
            ctx.fillText(icon, invX + 45, yOffset + 5);

            // Name (with number if potion)
            ctx.font = 'bold 17px monospace';
            ctx.fillStyle = '#ffffff';
            if (isPotion) {
                ctx.fillText(`[${globalIndex}] ${itemName}`, invX + 90, yOffset);
                potionIndex++;
            } else {
                ctx.fillText(itemName, invX + 90, yOffset);
            }

            // Quantity badge
            ctx.fillStyle = 'rgba(170, 100, 255, 0.3)';
            ctx.fillRect(invX + invWidth - 120, yOffset - 15, 80, 25);
            ctx.strokeStyle = '#aa66ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(invX + invWidth - 120, yOffset - 15, 80, 25);

            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#bb88ff';
            ctx.fillText(`x${quantity}`, invX + invWidth - 100, yOffset + 2);

            yOffset += 55;
        });
    }

    // Instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(invX + 20, invY + invHeight - 70, invWidth - 40, 50);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('🍎 Number: Use food/potions', invX + 30, invY + invHeight - 45);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('⌨️  TAB: Close inventory', invX + 30, invY + invHeight - 25);
}

// ----------------------------------------
// Draw help screen
// ----------------------------------------
export function drawHelp(ctx, gs) {
    if (!gs.showHelp) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, gs.canvas.width, gs.canvas.height);

    const boxWidth = 700;
    const boxHeight = 550;
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
        { category: '🚶 MOVEMENT', keys: [
            { key: 'Z', action: 'Move up' },
            { key: 'Q', action: 'Move left' },
            { key: 'S', action: 'Move down' },
            { key: 'D', action: 'Move right' },
            { key: 'SPACE', action: 'Jump' }
        ]},
        { category: '⚔️ COMBAT', keys: [
            { key: 'F', action: 'Attack (requires sword)' },
            { key: 'R', action: 'Block with shield (hold)' }
        ]},
        { category: '🎒 INVENTORY & MENUS', keys: [
            { key: 'TAB', action: 'Open/Close inventory' },
            { key: '1-9', action: 'Use item from inventory' },
            { key: 'M', action: 'Show/Hide full map' },
            { key: 'P', action: 'Show/Hide this help page' }
        ]},
        { category: '🏠 INTERACTION', keys: [
            { key: 'E', action: 'Interact (talk, enter, shop, open chest)' }
        ]}
    ];

    let yOffset = boxY + 95;
    ctx.textAlign = 'left';

    controls.forEach(section => {
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(section.category, boxX + 40, yOffset);
        yOffset += 30;

        section.keys.forEach(control => {
            ctx.fillStyle = 'rgba(80, 80, 100, 0.6)';
            ctx.fillRect(boxX + 50, yOffset - 18, 80, 26);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX + 50, yOffset - 18, 80, 26);

            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(control.key, boxX + 60, yOffset);

            ctx.font = '16px monospace';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(control.action, boxX + 150, yOffset);

            yOffset += 32;
        });

        yOffset += 15;
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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(20, boxY, gs.canvas.width - 40, boxHeight);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, boxY, gs.canvas.width - 40, boxHeight);

    // Character name
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('The Elder', 40, boxY + 30);

    // Separator
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, boxY + 40);
    ctx.lineTo(gs.canvas.width - 60, boxY + 40);
    ctx.stroke();

    // Dialogue text
    ctx.font = '18px monospace';
    ctx.fillStyle = '#FFFFFF';
    const dialogue = gs.introDialogues[gs.introDialogueIndex] || '';
    ctx.fillText(dialogue, 40, boxY + 70);

    // Continue prompt (blinking)
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px monospace';
        ctx.fillText('Press E to continue...', gs.canvas.width - 200, boxY + boxHeight - 15);
    }

    // Progress indicator
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`${gs.introDialogueIndex + 1}/${gs.introDialogues.length}`, 40, boxY + boxHeight - 15);
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

    // NPCs on map (white dots)
    gs.npcs.forEach(npc => {
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
// Draw storage UI
// ----------------------------------------
function drawStorageUI(ctx, gs) {
    if (!gs.storageOpen) return;

    const boxWidth = 550;
    const boxHeight = 450;
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
    ctx.fillText(`📦 STORAGE - ${modeLabel} 📦`, boxX + 30, boxY + 40);

    // Separator
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 20, boxY + 55);
    ctx.lineTo(boxX + boxWidth - 20, boxY + 55);
    ctx.stroke();

    let yOffset = boxY + 85;

    if (gs.storageMode === 'deposit') {
        // Show food + potions from inventory
        const foodItems = Object.entries(gs.food);
        const potionItems = Object.entries(gs.inventory).filter(([name]) => name.includes('Potion'));
        const allItems = [...foodItems, ...potionItems];

        if (allItems.length === 0) {
            ctx.font = 'italic 18px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('No items to deposit.', boxX + 30, yOffset);
        } else {
            ctx.font = 'bold 18px monospace';
            allItems.forEach(([itemName, quantity], index) => {
                if (index > 8) return; // max 9 items

                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(boxX + 30, yOffset - 18, boxWidth - 60, 35);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX + 30, yOffset - 18, boxWidth - 60, 35);

                ctx.fillStyle = '#ffffff';
                ctx.fillText(`[${index + 1}] ${itemName}`, boxX + 45, yOffset + 5);

                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(`x${quantity}`, boxX + boxWidth - 110, yOffset + 5);

                yOffset += 40;
            });
        }
    } else {
        // Withdraw: show playerStorage items
        const storageItems = Object.entries(gs.playerStorage);

        if (storageItems.length === 0) {
            ctx.font = 'italic 18px monospace';
            ctx.fillStyle = '#777777';
            ctx.fillText('Storage is empty.', boxX + 30, yOffset);
        } else {
            ctx.font = 'bold 18px monospace';
            storageItems.forEach(([itemName, quantity], index) => {
                if (index > 8) return;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(boxX + 30, yOffset - 18, boxWidth - 60, 35);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX + 30, yOffset - 18, boxWidth - 60, 35);

                ctx.fillStyle = '#ffffff';
                ctx.fillText(`[${index + 1}] ${itemName}`, boxX + 45, yOffset + 5);

                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(`x${quantity}`, boxX + boxWidth - 110, yOffset + 5);

                yOffset += 40;
            });
        }
    }

    // Instructions
    ctx.font = '15px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Number: Move item', boxX + 30, boxY + boxHeight - 50);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`TAB: Switch to ${gs.storageMode === 'deposit' ? 'WITHDRAW' : 'DEPOSIT'}`, boxX + 30, boxY + boxHeight - 30);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('E: Close storage', boxX + boxWidth - 200, boxY + boxHeight - 30);
}

// ----------------------------------------
// Main drawUI - orchestrates all UI
// ----------------------------------------
export function drawUI(ctx, gs) {
    drawHearts(ctx, gs);
    drawLevel(ctx, gs);
    drawActiveEffects(ctx, gs);
    drawDialogue(ctx, gs);
    drawInteractionPrompt(ctx, gs);
    drawShop(ctx, gs);
    drawStorageUI(ctx, gs);
    drawLevelUpChoice(ctx, gs);
    drawInventory(ctx, gs);
}
