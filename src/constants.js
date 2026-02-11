// ========================================
// TILE IDS
// ========================================
export const TILE_GRASS = 0;
export const TILE_PATH = 1;
export const TILE_TREE = 2;
export const TILE_HOUSE = 3;
export const TILE_WATER = 4;
export const TILE_FLOWER = 5;
export const TILE_ROCK = 6;
export const TILE_DOCK = 7;

// Interior tiles
export const TILE_BED = 8;
export const TILE_TABLE = 9;
export const TILE_CHAIR = 10;
export const TILE_CHEST = 11;
export const TILE_WORKBENCH = 12;
export const TILE_BOOKSHELF = 13;
export const TILE_COUNTER = 14;
export const TILE_SOFA = 15;
export const TILE_SHELF = 16;
export const TILE_HANGING_FISH = 17;
export const TILE_VEGETABLE_CRATE = 18;
export const TILE_BARREL = 19;
export const TILE_FISH_STALL = 20;
export const TILE_CARROT_CRATE = 21;
export const TILE_ANVIL = 22;
export const TILE_FORGE = 23;
export const TILE_POTION_SHELF = 24;
export const TILE_MEDICAL_BED = 25;
export const TILE_ALTAR = 26;
export const TILE_CHURCH_PEW = 27;
export const TILE_FOUNTAIN = 28;
export const TILE_BENCH = 29;
export const TILE_COBBLESTONE = 30;
export const TILE_LAMPPOST = 31;

// Farm tiles
export const TILE_TOMATO_FIELD = 32;
export const TILE_CARROT_FIELD = 33;
export const TILE_PLOWED_SOIL = 34;

// Snow/mountain tiles
export const TILE_SNOW = 35;
export const TILE_ICE = 36;
export const TILE_PINE_TREE = 37;
export const TILE_MOUNTAIN = 38;

// Outdoor structures
export const TILE_FENCE = 39;

// ========================================
// WALKABILITY SETS
// ========================================
// Tiles the player cannot walk on
export const SOLID_TILES = new Set([
    TILE_WATER, TILE_TREE, TILE_HOUSE, TILE_ROCK, TILE_FENCE,
    TILE_BED, TILE_TABLE, TILE_CHAIR, TILE_CHEST,
    TILE_WORKBENCH, TILE_BOOKSHELF, TILE_COUNTER, TILE_SOFA,
    TILE_SHELF, TILE_HANGING_FISH, TILE_VEGETABLE_CRATE, TILE_BARREL,
    TILE_FISH_STALL, TILE_CARROT_CRATE, TILE_ANVIL, TILE_FORGE,
    TILE_POTION_SHELF, TILE_MEDICAL_BED, TILE_ALTAR, TILE_CHURCH_PEW,
    TILE_FOUNTAIN, TILE_BENCH, TILE_LAMPPOST,
    TILE_PINE_TREE, TILE_MOUNTAIN
]);

// Tiles NPCs cannot walk on (includes dock)
export const NPC_SOLID_TILES = new Set([
    TILE_WATER, TILE_TREE, TILE_HOUSE, TILE_ROCK, TILE_DOCK, TILE_FENCE,
    TILE_BED, TILE_TABLE, TILE_CHAIR, TILE_CHEST,
    TILE_WORKBENCH, TILE_BOOKSHELF, TILE_COUNTER, TILE_SOFA,
    TILE_SHELF, TILE_HANGING_FISH, TILE_VEGETABLE_CRATE, TILE_BARREL,
    TILE_FISH_STALL, TILE_CARROT_CRATE, TILE_ANVIL, TILE_FORGE,
    TILE_POTION_SHELF, TILE_MEDICAL_BED, TILE_ALTAR, TILE_CHURCH_PEW,
    TILE_FOUNTAIN, TILE_BENCH, TILE_LAMPPOST,
    TILE_PINE_TREE, TILE_MOUNTAIN
]);

// ========================================
// GAME CONFIG
// ========================================
export const TILE_SIZE = 48;
export const VIEWPORT_TILES_X = 20;
export const VIEWPORT_TILES_Y = 15;
export const MAP_WIDTH = 90;
export const MAP_HEIGHT = 60;
export const INTERIOR_WIDTH = 18;
export const INTERIOR_HEIGHT = 14;

// ========================================
// PLAYER DEFAULTS
// ========================================
export const PLAYER_DEFAULTS = {
    x: 40,
    y: 22,
    velocityX: 0,
    velocityY: 0,
    acceleration: 0.03,
    maxSpeed: 0.05,
    friction: 0.88,
    momentum: 0.95,
    size: 36,
    isJumping: false,
    jumpHeight: 0,
    jumpSpeed: 0,
    direction: 'down',
    animFrame: 0,
    animTimer: 0,
    health: 12,
    maxHealth: 12,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gems: 0,
    // Combat
    isAttacking: false,
    attackTimer: 0,
    attackDuration: 20,
    attackDamage: 2,
    invincible: false,
    invincibleTimer: 0,
    isBlocking: false,
    shieldDurability: 100,
    shieldMaxDurability: 100,
    shieldBroken: false,
    shieldRegenTimer: 0
};

// ========================================
// PHYSICS
// ========================================
export const JUMP_INITIAL_SPEED = 0.35;
export const GRAVITY = 0.025;
export const JUMP_VISUAL_SCALE = 18;
export const COLLISION_RADIUS = 0.3;
export const WALL_BOUNCE = -0.2;
export const VELOCITY_THRESHOLD = 0.001;
export const DIAGONAL_FACTOR = 0.707;

// ========================================
// CAMERA
// ========================================
export const CAMERA_SMOOTHING = 0.12;

// ========================================
// TIMING (frames at 60fps)
// ========================================
export const DIALOGUE_TIMEOUT = 300;        // 5 seconds
export const INVINCIBILITY_FRAMES = 60;     // 1 second
export const SHIELD_REGEN_DELAY = 60;       // 1 second
export const SHIELD_REGEN_RATE = 0.5;
export const SHIELD_REPAIR_THRESHOLD = 30;  // 30% durability
export const QUICK_HEAL_HOLD_THRESHOLD = 15; // frames before hold triggers

// ========================================
// INVENTORY CAPACITY (unique item types)
// ========================================
export const INVENTORY_SLOTS_WEAPONS = 4;
export const INVENTORY_SLOTS_FOOD = 12;
export const INVENTORY_SLOTS_ITEMS = 8;
export const STORAGE_MAX_SLOTS = 30;

// ========================================
// ========================================
// DAY/NIGHT CYCLE
// ========================================
export const TIME_SPEED = 0.00045;      // hours per frame (24h in ~14.8 min)
export const DAWN_START = 5.0;           // 5:00 AM
export const DAWN_END = 7.0;             // 7:00 AM
export const DUSK_START = 18.0;          // 6:00 PM
export const DUSK_END = 20.0;            // 8:00 PM
export const NIGHT_OVERLAY_MAX = 0.55;   // max darkness opacity

export function getTimePhase(time) {
    if (time >= DAWN_START && time < DAWN_END) return 'dawn';
    if (time >= DAWN_END && time < DUSK_START) return 'day';
    if (time >= DUSK_START && time < DUSK_END) return 'dusk';
    return 'night';
}

export function getNightOpacity(time) {
    if (time >= DAWN_END && time < DUSK_START) return 0;  // Day
    if (time >= DUSK_END || time < DAWN_START) return NIGHT_OVERLAY_MAX;  // Night
    if (time >= DAWN_START && time < DAWN_END) {
        return NIGHT_OVERLAY_MAX * (1 - (time - DAWN_START) / (DAWN_END - DAWN_START));
    }
    // Dusk
    return NIGHT_OVERLAY_MAX * ((time - DUSK_START) / (DUSK_END - DUSK_START));
}

// ========================================
// INTRO DIALOGUES
// ========================================
export const INTRO_DIALOGUES = [
    "I am the Elder of this village. I knew your father well.",
    "Before he passed away, he entrusted me with something for you.",
    "He told me about a treasure he hid on this island...",
    "This key opens the chest where he kept it.",
    "The chest is located at one of the island's edges.",
    "But be careful... dangerous creatures guard it.",
    "Before you go, check your storage chest. Your old wooden sword and shield from training should still be there.",
    "Here, take this key. Your father wanted you to have it.",
    "Oh, and press P if you need to see the controls. Good luck, young one."
];
