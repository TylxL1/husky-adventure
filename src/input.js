// ========================================
// INPUT - Keyboard & mouse controls
// ========================================
import { getDialogue } from './npc.js';
import { chooseLevelUpReward, consumeItem } from './combat.js';
import { enterHouse, exitHouse } from './house.js';
import { travelToDesertIsland, travelToMainIsland, travelToSnowIsland, travelToDesertFromSnow } from './island.js';
import { getItemCategory, canAddItem, canStoreItem, quickHeal } from './inventory.js';
import { QUICK_HEAL_HOLD_THRESHOLD } from './constants.js';
import { saveGame } from './save.js';

// ----------------------------------------
// Weapon icon helper
// ----------------------------------------
function getWeaponIcon(name) {
    if (name.includes('Sword')) return '⚔️';
    if (name.includes('Shield')) return '🛡️';
    return '⚔️';
}

// ----------------------------------------
// Handle interaction (E key)
// ----------------------------------------
function handleInteraction(gs) {
    // Close storage if open
    if (gs.storageOpen) {
        gs.storageOpen = false;
        return;
    }

    // Close shop if open
    if (gs.shopMode) {
        gs.shopMode = false;
        gs.currentShop = null;
        return;
    }

    // Bed interaction (player's house) — sleep until morning
    if (gs.nearBed && !gs.currentDialogue && !gs.sleepAnim.active) {
        gs.sleepAnim.active = true;
        gs.sleepAnim.phase = 1;
        gs.sleepAnim.timer = 0;
        gs.sleepAnim.wasDaytime = !gs.isNight;  // Track if sleeping during day for message
        return;
    }

    // Chest storage interaction (player's house)
    if (gs.nearChest && !gs.currentDialogue) {
        gs.storageOpen = true;
        gs.storageMode = 'deposit';
        return;
    }

    // Treasure chest interaction
    if (gs.treasureChest && !gs.treasureChest.opened && !gs.insideHouse) {
        const distX = gs.player.x - gs.treasureChest.x;
        const distY = gs.player.y - gs.treasureChest.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < 2) {
            if (gs.enemies.length > 0) {
                gs.currentDialogue = "Defeat all enemies before opening the chest!";
                gs.dialogueTimer = 0;
                return;
            }
            if (gs.inventory['Treasure Key']) {
                gs.treasureChest.opened = true;
                gs.treasureFound = true;
                delete gs.inventory['Treasure Key'];

                gs.money += 100;
                gs.inventory["Father's Letter"] = 1;

                gs.currentDialogue = "You found a letter and 100 coins. Press E to read the letter.";
                gs.dialogueTimer = 0;
                gs.fatherLetterReady = true;
                return;
            } else {
                gs.currentDialogue = "The chest is locked. You need a key...";
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
                    { name: 'Rusty Sword', price: 30, icon: '\u2694\uFE0F', key: '1' },
                    { name: 'Rusty Shield', price: 20, icon: '\uD83D\uDEE1\uFE0F', key: '2' }
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
                    { name: 'Bandage', price: 10, icon: '\uD83E\uDE79', key: '1' },
                    { name: 'Medical Kit', price: 25, icon: '\uD83D\uDC8A', key: '2' }
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
                    { name: 'Fish', price: 6, icon: '\uD83D\uDC1F', key: '1' },
                    { name: 'Salmon', price: 8, icon: '\uD83D\uDC20', key: '2' },
                    { name: 'Fish Basket', price: 20, icon: '\uD83E\uDDFA', key: '3' }
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
                    { name: 'Speed Potion', price: 40, icon: '\u26A1', key: '1' },
                    { name: 'Invisibility Potion', price: 50, icon: '\uD83D\uDC7B', key: '2' },
                    { name: 'Strength Potion', price: 45, icon: '\uD83D\uDCAA', key: '3' },
                    { name: 'Invincibility Potion', price: 60, icon: '\uD83D\uDCAB', key: '4' }
                ]
            };
            return;
        }

        // Normal dialogue
        gs.currentDialogue = getDialogue(gs.nearNPC.type);
        gs.dialogueTimer = 0;
        return;
    }

    // Father's letter — show after chest opening dialogue
    if (gs.fatherLetterReady && gs.currentDialogue) {
        gs.fatherLetterReady = false;
        gs.currentDialogue = "My dear son, if you read this, I never made it home. But don't grieve. I found peace in my journey and I love you more than words can say. Now carry on what I started. The world beyond these islands holds a truth I couldn't reach. Be brave, son. Your Father";
        gs.dialogueTimer = 0;
        gs.dialoguePersist = true;
        return;
    }

    // Close open dialogue
    if (gs.currentDialogue) {
        gs.currentDialogue = null;
        gs.dialogueTimer = 0;
        gs.dialoguePersist = false;
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
// Advance intro (multi-phase cinematic)
// ----------------------------------------
function advanceIntro(gs) {
    if (gs.introPhase === 0) {
        // Phase 0 → 1: Player gets up from bed onto floor next to it
        gs.introPhase = 1;
        gs.player.x = 5;
        gs.player.y = 3.5;
        gs.player.direction = 'down';
        return;
    }

    if (gs.introPhase === 1) {
        // Phase 1: Player is walking to door — E does nothing
        return;
    }

    if (gs.introPhase === 2) {
        // Phase 2 → 3: Open door, Elder appears
        gs.introPhase = 3;
        gs.introElder = {
            x: 8.5,
            y: 12,
            type: 'elder',
            direction: 'up',
            animFrame: 0,
            animTimer: 0
        };
        gs.player.direction = 'down';
        return;
    }

    if (gs.introPhase === 3) {
        // Phase 3 → 4: Both sit at the table, dialogue begins
        gs.introPhase = 4;
        gs.introDialogueIndex = 0;

        // Player sits at south chair of table (tile [8][9])
        gs.player.x = 9;
        gs.player.y = 8;
        gs.player.direction = 'up';

        // Elder sits at north chair of table (tile [5][9])
        gs.introElder.x = 9;
        gs.introElder.y = 5;
        gs.introElder.direction = 'down';
        return;
    }

    if (gs.introPhase === 4) {
        // Phase 4: Advance seated dialogue
        gs.introDialogueIndex++;

        if (gs.introDialogueIndex >= gs.introDialogues.length) {
            // Intro complete
            gs.introActive = false;
            gs.introElder = null;

            // Move player off the chair to a free floor tile
            gs.player.x = 9;
            gs.player.y = 9.5;
            gs.player.direction = 'down';

            gs.inventory['Treasure Key'] = 1;
            gs.currentDialogue = 'You received the Treasure Key!';
            gs.dialogueTimer = 0;
        }
    }
}

// ----------------------------------------
// Handle shop purchase (with capacity check)
// ----------------------------------------
export function handleShopPurchaseByIndex(gs, itemIndex) {
    if (itemIndex < 0 || itemIndex >= gs.currentShop.items.length) return;

    const item = gs.currentShop.items[itemIndex];
    if (gs.money >= item.price) {
        // Capacity check before purchase
        if (!canAddItem(gs, item.name)) {
            gs.currentDialogue = 'Inventory full! Store some items first.';
            gs.dialogueTimer = 0;
            return;
        }

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

function handleShopPurchase(gs, key) {
    if (key < '1' || key > '9') return;
    handleShopPurchaseByIndex(gs, parseInt(key) - 1);
}

// ----------------------------------------
// Handle inventory consumption (tab-aware)
// ----------------------------------------
function handleInventoryConsume(gs, key) {
    const itemIndex = parseInt(key) - 1;
    if (isNaN(itemIndex) || itemIndex < 0) return;

    // Consume based on active tab
    if (gs.inventoryTab === 1) {
        // Food tab
        const foodItems = Object.entries(gs.food);
        if (itemIndex < foodItems.length) {
            consumeItem(gs, foodItems[itemIndex][0]);
        }
    } else if (gs.inventoryTab === 2) {
        // Items tab - only potions are consumable
        const items = Object.entries(gs.inventory).filter(([name]) => name.includes('Potion'));
        if (itemIndex < items.length) {
            consumeItem(gs, items[itemIndex][0]);
        }
    }
}

// ----------------------------------------
// Handle storage deposit/withdraw (all items)
// ----------------------------------------
function handleStorageAction(gs, key) {
    if (key < '1' || key > '9') return;
    const itemIndex = parseInt(key) - 1;

    if (gs.storageMode === 'deposit') {
        // Build list of ALL depositable items: weapons + food + inventory items
        const weaponItems = Object.entries(gs.weapons).map(([name, data]) => [name, 1, 'weapon']);
        const foodItems = Object.entries(gs.food).map(([name, qty]) => [name, qty, 'food']);
        const invItems = Object.entries(gs.inventory).map(([name, qty]) => [name, qty, 'item']);
        const allItems = [...weaponItems, ...foodItems, ...invItems];

        if (itemIndex >= 0 && itemIndex < allItems.length) {
            const [itemName, , category] = allItems[itemIndex];

            // Check storage capacity for new item types
            if (!gs.playerStorage[itemName] && !canStoreItem(gs)) {
                gs.currentDialogue = 'Storage is full!';
                gs.dialogueTimer = 0;
                return;
            }

            if (category === 'weapon') {
                delete gs.weapons[itemName];
                if (gs.equippedWeapon === itemName) gs.equippedWeapon = null;
            } else if (category === 'food') {
                gs.food[itemName]--;
                if (gs.food[itemName] <= 0) delete gs.food[itemName];
            } else {
                gs.inventory[itemName]--;
                if (gs.inventory[itemName] <= 0) delete gs.inventory[itemName];
            }

            if (gs.playerStorage[itemName]) {
                gs.playerStorage[itemName]++;
            } else {
                gs.playerStorage[itemName] = 1;
            }
            gs.currentDialogue = `Stored: ${itemName}`;
            gs.dialogueTimer = 0;
        }
    } else {
        // Withdraw mode
        const storageItems = Object.entries(gs.playerStorage);
        if (itemIndex >= 0 && itemIndex < storageItems.length) {
            const [itemName] = storageItems[itemIndex];

            if (gs.playerStorage[itemName] > 0) {
                // Check capacity before withdrawing
                if (!canAddItem(gs, itemName)) {
                    gs.currentDialogue = 'Inventory full!';
                    gs.dialogueTimer = 0;
                    return;
                }

                gs.playerStorage[itemName]--;
                if (gs.playerStorage[itemName] <= 0) delete gs.playerStorage[itemName];

                // Route to correct category
                const category = getItemCategory(itemName);
                if (category === 'weapon') {
                    gs.weapons[itemName] = { icon: getWeaponIcon(itemName) };
                } else if (category === 'food') {
                    if (gs.food[itemName]) {
                        gs.food[itemName]++;
                    } else {
                        gs.food[itemName] = 1;
                    }
                } else {
                    if (gs.inventory[itemName]) {
                        gs.inventory[itemName]++;
                    } else {
                        gs.inventory[itemName] = 1;
                    }
                }
                gs.currentDialogue = `Retrieved: ${itemName}`;
                gs.dialogueTimer = 0;
            }
        }
    }
}

// ----------------------------------------
// Handle inventory click (mouse)
// ----------------------------------------
export function handleInventoryClick(gs, itemName, category) {
    if (category === 'weapon') {
        // Equip weapon
        gs.equippedWeapon = itemName;
        gs.currentDialogue = `Equipped: ${itemName}`;
        gs.dialogueTimer = 0;
    } else if (category === 'food') {
        consumeItem(gs, itemName);
    } else if (category === 'item') {
        if (itemName.includes('Potion')) {
            consumeItem(gs, itemName);
        }
    }
}

// ----------------------------------------
// Handle storage click (mouse)
// ----------------------------------------
export function handleStorageClick(gs, itemName, action) {
    if (action === 'deposit') {
        const category = getItemCategory(itemName);
        if (!gs.playerStorage[itemName] && !canStoreItem(gs)) {
            gs.currentDialogue = 'Storage is full!';
            gs.dialogueTimer = 0;
            return;
        }

        if (category === 'weapon') {
            delete gs.weapons[itemName];
            if (gs.equippedWeapon === itemName) gs.equippedWeapon = null;
        } else if (category === 'food') {
            gs.food[itemName]--;
            if (gs.food[itemName] <= 0) delete gs.food[itemName];
        } else {
            gs.inventory[itemName]--;
            if (gs.inventory[itemName] <= 0) delete gs.inventory[itemName];
        }

        if (gs.playerStorage[itemName]) {
            gs.playerStorage[itemName]++;
        } else {
            gs.playerStorage[itemName] = 1;
        }
        gs.currentDialogue = `Stored: ${itemName}`;
        gs.dialogueTimer = 0;
    } else {
        // Withdraw
        if (!canAddItem(gs, itemName)) {
            gs.currentDialogue = 'Inventory full!';
            gs.dialogueTimer = 0;
            return;
        }

        gs.playerStorage[itemName]--;
        if (gs.playerStorage[itemName] <= 0) delete gs.playerStorage[itemName];

        const category = getItemCategory(itemName);
        if (category === 'weapon') {
            gs.weapons[itemName] = { icon: getWeaponIcon(itemName) };
        } else if (category === 'food') {
            if (gs.food[itemName]) gs.food[itemName]++;
            else gs.food[itemName] = 1;
        } else {
            if (gs.inventory[itemName]) gs.inventory[itemName]++;
            else gs.inventory[itemName] = 1;
        }
        gs.currentDialogue = `Retrieved: ${itemName}`;
        gs.dialogueTimer = 0;
    }
}

// ----------------------------------------
// Setup keyboard & mouse controls
// ----------------------------------------
export function setupControls(gs) {
    // ---- Mouse listeners ----
    gs.canvas.addEventListener('mousemove', (e) => {
        const rect = gs.canvas.getBoundingClientRect();
        gs.mouse.x = e.clientX - rect.left;
        gs.mouse.y = e.clientY - rect.top;
    });

    gs.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            gs.mouse.leftDown = true;
            gs.mouse.leftClick = true;
        } else if (e.button === 2) {
            gs.mouse.rightDown = true;
            gs.mouse.rightClick = true;
        }
    });

    gs.canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            gs.mouse.leftDown = false;
        } else if (e.button === 2) {
            gs.mouse.rightDown = false;
        }
    });

    gs.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // ---- Keyboard listeners ----
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

        // Toggle inventory / storage mode / tab navigation
        if (key === 'tab') {
            if (gs.storageOpen) {
                gs.storageMode = gs.storageMode === 'deposit' ? 'withdraw' : 'deposit';
            } else {
                gs.showInventory = !gs.showInventory;
            }
            e.preventDefault();
        }

        // Inventory tab navigation with arrow keys
        if (gs.showInventory && !gs.shopMode) {
            if (key === 'arrowleft') {
                gs.inventoryTab = (gs.inventoryTab + 2) % 3;
                e.preventDefault();
            }
            if (key === 'arrowright') {
                gs.inventoryTab = (gs.inventoryTab + 1) % 3;
                e.preventDefault();
            }
        }

        // Interact / advance intro
        if (key === 'e') {
            if (gs.introActive) {
                advanceIntro(gs);
            } else {
                handleInteraction(gs);
            }
        }

        // Quick heal (A key)
        if (key === 'a' && !gs.quickHealPressed) {
            gs.quickHealPressed = true;
            gs.quickHealTimer = 0;
        }

        // Manual save (K key)
        if (key === 'k' && !gs.introActive) {
            saveGame(gs);
            gs.currentDialogue = 'Game saved!';
            gs.dialogueTimer = 0;
        }

        // Storage action
        if (gs.storageOpen) {
            handleStorageAction(gs, key);
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

        // Quick heal: short tap = heal, long hold handled in update()
        if (key === 'a') {
            if (gs.quickHealPressed && gs.quickHealTimer < QUICK_HEAL_HOLD_THRESHOLD) {
                quickHeal(gs);
            }
            gs.quickHealPressed = false;
            gs.quickHealTimer = 0;
        }
    });
}
