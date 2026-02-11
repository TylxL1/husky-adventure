// ========================================
// SAVE - LocalStorage save/load system
// ========================================

const SAVE_KEY = 'huskyAdventureSave';

// ----------------------------------------
// Save game state to localStorage
// ----------------------------------------
export function saveGame(gs) {
    // If inside a house, save the outdoor position instead
    const saveX = gs.insideHouse && gs.savedOutdoorPosition ? gs.savedOutdoorPosition.x : gs.player.x;
    const saveY = gs.insideHouse && gs.savedOutdoorPosition ? gs.savedOutdoorPosition.y : gs.player.y;

    const saveData = {
        player: {
            x: saveX,
            y: saveY,
            health: gs.player.health,
            maxHealth: gs.player.maxHealth,
            level: gs.player.level,
            xp: gs.player.xp,
            xpToNextLevel: gs.player.xpToNextLevel,
            gems: gs.player.gems,
            attackDamage: gs.player.attackDamage
        },
        money: gs.money,
        inventory: gs.inventory,
        food: gs.food,
        weapons: gs.weapons,
        equippedWeapon: gs.equippedWeapon,
        playerStorage: gs.playerStorage,
        treasureFound: gs.treasureFound,
        timeOfDay: gs.timeOfDay,
        dayCount: gs.dayCount,
        currentIsland: gs.currentIsland,
        introCompleted: !gs.introActive,
        inventoryTab: gs.inventoryTab
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        // Storage full or unavailable — silently fail
    }
}

// ----------------------------------------
// Load game state from localStorage
// ----------------------------------------
export function loadGame(gs) {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        return;
    }

    // Restore player stats and position
    if (data.player) {
        if (data.player.x !== undefined) gs.player.x = data.player.x;
        if (data.player.y !== undefined) gs.player.y = data.player.y;
        gs.player.health = data.player.health;
        gs.player.maxHealth = data.player.maxHealth;
        gs.player.level = data.player.level;
        gs.player.xp = data.player.xp;
        gs.player.xpToNextLevel = data.player.xpToNextLevel;
        gs.player.gems = data.player.gems;
        gs.player.attackDamage = data.player.attackDamage;
    }

    // Restore economy & inventory
    if (data.money !== undefined) gs.money = data.money;
    if (data.inventory) gs.inventory = data.inventory;
    if (data.food) gs.food = data.food;
    if (data.weapons) gs.weapons = data.weapons;
    if (data.equippedWeapon !== undefined) gs.equippedWeapon = data.equippedWeapon;
    if (data.playerStorage) gs.playerStorage = data.playerStorage;

    // Restore world flags
    if (data.treasureFound) {
        gs.treasureFound = true;
        if (gs.treasureChest) gs.treasureChest.opened = true;
    }
    // Time system (new) with backward compatibility for old saves
    if (data.timeOfDay !== undefined) {
        gs.timeOfDay = data.timeOfDay;
    } else if (data.isNight) {
        // Old save: isNight was true, set to nighttime
        gs.timeOfDay = 22.0;
    }
    if (data.dayCount !== undefined) gs.dayCount = data.dayCount;
    gs.isNight = (gs.timeOfDay >= 20.0 || gs.timeOfDay < 5.0);

    // Skip intro if it was completed
    if (data.introCompleted) {
        gs.introActive = false;
        gs.introElder = null;
    }

    // Restore inventory tab (backward compatible)
    if (data.inventoryTab !== undefined) gs.inventoryTab = data.inventoryTab;

    // Always load to main island (world is regenerated fresh)
    gs.currentIsland = 'main';
}

// ----------------------------------------
// Check if save data exists
// ----------------------------------------
export function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

// ----------------------------------------
// Delete save data
// ----------------------------------------
export function deleteSaveData() {
    localStorage.removeItem(SAVE_KEY);
}
