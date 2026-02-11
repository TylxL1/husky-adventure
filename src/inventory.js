// ========================================
// INVENTORY - Categories, capacity, quick heal
// ========================================
import {
    INVENTORY_SLOTS_WEAPONS, INVENTORY_SLOTS_FOOD,
    INVENTORY_SLOTS_ITEMS, STORAGE_MAX_SLOTS
} from './constants.js';

// ----------------------------------------
// Item category classification
// ----------------------------------------
export function getItemCategory(name) {
    // Weapons
    if (name === 'Rusty Sword' || name === 'Rusty Shield' ||
        name === 'Wooden Sword' || name === 'Wooden Shield') return 'weapon';

    // Food & medical (stored in gs.food)
    if (name === 'Tomato' || name === 'Carrot' || name === 'Vegetable Basket' ||
        name === 'Fish' || name === 'Salmon' || name === 'Fish Basket' ||
        name === 'Bandage' || name === 'Medical Kit') return 'food';

    // Everything else (potions, quest items) stored in gs.inventory
    return 'item';
}

// ----------------------------------------
// Count unique item types in a category
// ----------------------------------------
export function countCategorySlots(gs, category) {
    if (category === 'weapon') return Object.keys(gs.weapons).length;
    if (category === 'food') return Object.keys(gs.food).length;
    if (category === 'item') return Object.keys(gs.inventory).length;
    return 0;
}

// ----------------------------------------
// Check if an item can be added (capacity)
// ----------------------------------------
export function canAddItem(gs, name) {
    const category = getItemCategory(name);

    // Quest items always bypass capacity
    if (name === 'Treasure Key' || name === "Father's Letter") return true;

    // If item already exists (stacking), always allowed
    if (category === 'weapon' && gs.weapons[name]) return true;
    if (category === 'food' && gs.food[name]) return true;
    if (category === 'item' && gs.inventory[name]) return true;

    // Check capacity for new item type
    const limits = {
        weapon: INVENTORY_SLOTS_WEAPONS,
        food: INVENTORY_SLOTS_FOOD,
        item: INVENTORY_SLOTS_ITEMS
    };

    return countCategorySlots(gs, category) < limits[category];
}

// ----------------------------------------
// Check storage capacity
// ----------------------------------------
export function canStoreItem(gs) {
    return Object.keys(gs.playerStorage).length < STORAGE_MAX_SLOTS;
}

// ----------------------------------------
// Quick heal - uses best small food first
// ----------------------------------------
export function quickHeal(gs) {
    if (gs.player.health >= gs.player.maxHealth) {
        gs.currentDialogue = 'Health already full!';
        gs.dialogueTimer = 0;
        return;
    }

    // Priority order: small heals first, then bigger ones
    const healPriority = [
        'Tomato', 'Carrot', 'Fish',
        'Salmon',
        'Vegetable Basket', 'Fish Basket',
        'Bandage', 'Medical Kit'
    ];

    for (const itemName of healPriority) {
        const inFood = gs.food[itemName] && gs.food[itemName] > 0;
        if (inFood) {
            // Import consumeItem logic inline to avoid circular deps
            let healthRestore = 0;
            if (itemName === 'Tomato' || itemName === 'Carrot' || itemName === 'Fish') healthRestore = 1;
            else if (itemName === 'Salmon' || itemName === 'Vegetable Basket') healthRestore = 2;
            else if (itemName === 'Fish Basket') healthRestore = 3;
            else if (itemName === 'Bandage') healthRestore = 4;
            else if (itemName === 'Medical Kit') healthRestore = 8;

            gs.food[itemName]--;
            if (gs.food[itemName] === 0) delete gs.food[itemName];

            gs.player.health = Math.min(gs.player.health + healthRestore, gs.player.maxHealth);
            const heartsRestored = healthRestore / 4;
            gs.currentDialogue = `Quick heal: ${itemName}! +${heartsRestored} \u2764\uFE0F`;
            gs.dialogueTimer = 0;
            return;
        }
    }

    gs.currentDialogue = 'No food available!';
    gs.dialogueTimer = 0;
}
