// ========================================
// INPUT - Keyboard controls
// ========================================
import { getDialogue } from './npc.js';
import { performAttack, chooseLevelUpReward, consumeItem } from './combat.js';
import { enterHouse, exitHouse } from './house.js';
import { travelToDesertIsland, travelToMainIsland, travelToSnowIsland, travelToDesertFromSnow } from './island.js';

// ----------------------------------------
// Handle interaction (E key)
// ----------------------------------------
function handleInteraction(gs) {
    // Close shop if open
    if (gs.shopMode) {
        gs.shopMode = false;
        gs.currentShop = null;
        return;
    }

    // Treasure chest interaction
    if (gs.treasureChest && !gs.treasureChest.opened && !gs.insideHouse) {
        const distX = gs.player.x - gs.treasureChest.x;
        const distY = gs.player.y - gs.treasureChest.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < 2) {
            if (gs.enemies.length > 0) {
                gs.currentDialogue = "⚔️ Defeat all enemies before opening the chest!";
                gs.dialogueTimer = 0;
                return;
            }
            if (gs.inventory['Treasure Key']) {
                gs.treasureChest.opened = true;
                gs.treasureFound = true;
                delete gs.inventory['Treasure Key'];

                gs.money += 500;
                gs.player.gems += 10;
                gs.player.maxHealth += 4;
                gs.player.health = gs.player.maxHealth;

                gs.currentDialogue = "🎉 You found your father's treasure! +500 coins, +10 gems, +1 heart!";
                gs.dialogueTimer = 0;
                return;
            } else {
                gs.currentDialogue = "🔒 The chest is locked. You need a key...";
                gs.dialogueTimer = 0;
                return;
            }
        }
    }

    // Priority 1: NPC dialogue (if no dialogue is open)
    if (gs.nearNPC && !gs.currentDialogue) {
        // Farmer shop
        if (gs.nearNPC.type === 'farmer' && gs.insideHouse && gs.insideHouse.type === 'farmer') {
            gs.shopMode = true;
            gs.currentShop = {
                type: 'farmer',
                items: [
                    { name: 'Tomato', price: 5, key: '1' },
                    { name: 'Carrot', price: 5, key: '2' },
                    { name: 'Vegetable Basket', price: 15, key: '3' }
                ]
            };
            return;
        }

        // Blacksmith shop
        if (gs.nearNPC.type === 'blacksmith' && gs.insideHouse && gs.insideHouse.type === 'blacksmith') {
            gs.shopMode = true;
            gs.currentShop = {
                type: 'blacksmith',
                items: [
                    { name: 'Rusty Sword', price: 30, icon: '⚔️', key: '1' },
                    { name: 'Rusty Shield', price: 20, icon: '🛡️', key: '2' }
                ]
            };
            return;
        }

        // Doctor shop
        if (gs.nearNPC.type === 'doctor' && gs.insideHouse && gs.insideHouse.type === 'doctor') {
            gs.shopMode = true;
            gs.currentShop = {
                type: 'doctor',
                items: [
                    { name: 'Bandage', price: 10, icon: '🩹', key: '1' },
                    { name: 'Medical Kit', price: 25, icon: '💊', key: '2' }
                ]
            };
            return;
        }

        // Fisher shop
        if (gs.nearNPC.type === 'fisher' && gs.insideHouse && gs.insideHouse.type === 'fisher') {
            gs.shopMode = true;
            gs.currentShop = {
                type: 'fisher',
                items: [
                    { name: 'Fish', price: 6, icon: '🐟', key: '1' },
                    { name: 'Salmon', price: 8, icon: '🐠', key: '2' },
                    { name: 'Fish Basket', price: 20, icon: '🧺', key: '3' }
                ]
            };
            return;
        }

        // Merchant (potion) shop
        if (gs.nearNPC.type === 'merchant' && gs.insideHouse && gs.insideHouse.type === 'merchant') {
            gs.shopMode = true;
            gs.currentShop = {
                type: 'merchant',
                items: [
                    { name: 'Speed Potion', price: 40, icon: '⚡', key: '1' },
                    { name: 'Invisibility Potion', price: 50, icon: '👻', key: '2' },
                    { name: 'Strength Potion', price: 45, icon: '💪', key: '3' },
                    { name: 'Invincibility Potion', price: 60, icon: '💫', key: '4' }
                ]
            };
            return;
        }

        // Normal dialogue
        gs.currentDialogue = getDialogue(gs.nearNPC.type);
        gs.dialogueTimer = 0;
        return;
    }

    // Close open dialogue
    if (gs.currentDialogue) {
        gs.currentDialogue = null;
        gs.dialogueTimer = 0;
        return;
    }

    // Priority 2: House interaction
    if (gs.nearHouse) {
        if (gs.insideHouse) {
            exitHouse(gs);
        } else {
            enterHouse(gs, gs.nearHouse);
        }
        return;
    }

    // Priority 3: Boat interaction
    if (gs.nearBoat) {
        if (gs.currentIsland === 'main') {
            travelToDesertIsland(gs);
        } else if (gs.currentIsland === 'desert') {
            // Check which dock the boat is near
            if (gs.snowDockLocation) {
                const distToSnowDock = Math.sqrt(
                    Math.pow(gs.nearBoat.x - gs.snowDockLocation.x, 2) +
                    Math.pow(gs.nearBoat.y - gs.snowDockLocation.y, 2)
                );
                if (distToSnowDock < 6) {
                    travelToSnowIsland(gs);
                    return;
                }
            }
            travelToMainIsland(gs);
        } else if (gs.currentIsland === 'snow') {
            travelToDesertFromSnow(gs);
        }
    }
}

// ----------------------------------------
// Advance intro dialogue
// ----------------------------------------
function advanceIntro(gs) {
    gs.introDialogueIndex++;

    if (gs.introDialogueIndex >= gs.introDialogues.length) {
        gs.introActive = false;
        gs.introElder = null;

        gs.inventory['Treasure Key'] = 1;
        gs.currentDialogue = '🔑 You received the Treasure Key!';
        gs.dialogueTimer = 0;
    }
}

// ----------------------------------------
// Handle shop purchase
// ----------------------------------------
function handleShopPurchase(gs, key) {
    if (key < '1' || key > '9') return;
    const itemIndex = parseInt(key) - 1;
    if (itemIndex < 0 || itemIndex >= gs.currentShop.items.length) return;

    const item = gs.currentShop.items[itemIndex];
    if (gs.money >= item.price) {
        gs.money -= item.price;

        if (gs.currentShop.type === 'blacksmith') {
            if (!gs.weapons[item.name]) {
                gs.weapons[item.name] = { icon: item.icon };
                gs.equippedWeapon = item.name;
                gs.currentDialogue = `You purchased: ${item.icon} ${item.name}!`;
            } else {
                gs.money += item.price;
                gs.currentDialogue = `You already have a ${item.name}!`;
            }
        } else if (gs.currentShop.type === 'farmer' || gs.currentShop.type === 'doctor' || gs.currentShop.type === 'fisher') {
            if (gs.food[item.name]) {
                gs.food[item.name]++;
            } else {
                gs.food[item.name] = 1;
            }
            gs.currentDialogue = `You purchased: ${item.icon || ''} ${item.name}!`;
        } else if (gs.currentShop.type === 'merchant') {
            if (gs.inventory[item.name]) {
                gs.inventory[item.name]++;
            } else {
                gs.inventory[item.name] = 1;
            }
            gs.currentDialogue = `You purchased: ${item.icon} ${item.name}!`;
        } else {
            if (gs.inventory[item.name]) {
                gs.inventory[item.name]++;
            } else {
                gs.inventory[item.name] = 1;
            }
            gs.currentDialogue = `You purchased: ${item.name}!`;
        }
        gs.dialogueTimer = 0;
    } else {
        gs.currentDialogue = 'Not enough money!';
        gs.dialogueTimer = 0;
    }
}

// ----------------------------------------
// Handle inventory consumption
// ----------------------------------------
function handleInventoryConsume(gs, key) {
    const itemIndex = parseInt(key) - 1;

    const foodItems = Object.entries(gs.food);
    const objectItems = Object.entries(gs.inventory).filter(([name]) => {
        return name.includes('Potion');
    });
    const allConsumables = [...foodItems, ...objectItems];

    if (itemIndex >= 0 && itemIndex < allConsumables.length) {
        const [itemName] = allConsumables[itemIndex];
        consumeItem(gs, itemName);
    }
}

// ----------------------------------------
// Setup keyboard controls
// ----------------------------------------
export function setupControls(gs) {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        gs.keys[key] = true;

        // Jump
        if (e.key === ' ' && !gs.player.isJumping) {
            gs.player.isJumping = true;
            gs.player.jumpSpeed = 0.35;
            e.preventDefault();
        }

        // Toggle minimap
        if (key === 'm') {
            gs.showMinimap = !gs.showMinimap;
        }

        // Toggle help
        if (key === 'p') {
            gs.showHelp = !gs.showHelp;
        }

        // Toggle inventory
        if (key === 'tab') {
            gs.showInventory = !gs.showInventory;
            e.preventDefault();
        }

        // Interact / advance intro
        if (key === 'e') {
            if (gs.introActive) {
                advanceIntro(gs);
            } else {
                handleInteraction(gs);
            }
        }

        // Attack with F (requires sword)
        if (key === 'f' && !gs.player.isAttacking && gs.weapons['Rusty Sword']) {
            gs.player.isAttacking = true;
            gs.player.attackTimer = gs.player.attackDuration;
            performAttack(gs);
        }

        // Block with R (requires shield)
        if (key === 'r' && gs.weapons['Rusty Shield']) {
            gs.player.isBlocking = true;
        }

        // Shop purchase
        if (gs.shopMode && gs.currentShop) {
            handleShopPurchase(gs, key);
        }

        // Inventory consumption
        if (gs.showInventory && !gs.shopMode) {
            handleInventoryConsume(gs, key);
        }

        // Level-up reward choice
        if (gs.levelUpChoice) {
            if (key === '1') {
                chooseLevelUpReward(gs, 'heart');
            } else if (key === '2') {
                chooseLevelUpReward(gs, 'gems');
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        gs.keys[key] = false;

        // Stop blocking when R is released
        if (key === 'r') {
            gs.player.isBlocking = false;
        }
    });
}
