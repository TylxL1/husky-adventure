// ========================================
// COMBAT - Attack, damage, potions, XP, leveling
// ========================================
import {
    INVINCIBILITY_FRAMES, SHIELD_REGEN_DELAY,
    SHIELD_REGEN_RATE, SHIELD_REPAIR_THRESHOLD
} from './constants.js';

// ----------------------------------------
// Update combat timers & collisions
// ----------------------------------------
export function updateCombat(gs, dt) {
    // Attack timer
    if (gs.player.isAttacking) {
        gs.player.attackTimer -= dt;
        if (gs.player.attackTimer <= 0) {
            gs.player.isAttacking = false;
        }
    }

    // Invincibility timer
    if (gs.player.invincible) {
        gs.player.invincibleTimer -= dt;
        if (gs.player.invincibleTimer <= 0) {
            gs.player.invincible = false;
        }
    }

    // Shield regeneration
    if (!gs.player.isBlocking && gs.player.shieldDurability < gs.player.shieldMaxDurability) {
        gs.player.shieldRegenTimer += dt;
        if (gs.player.shieldRegenTimer > SHIELD_REGEN_DELAY) {
            gs.player.shieldDurability = Math.min(
                gs.player.shieldMaxDurability,
                gs.player.shieldDurability + SHIELD_REGEN_RATE * dt
            );
            if (gs.player.shieldBroken && gs.player.shieldDurability > SHIELD_REPAIR_THRESHOLD) {
                gs.player.shieldBroken = false;
                gs.currentDialogue = '🛡️ Shield repaired!';
                gs.dialogueTimer = 0;
            }
        }
    } else {
        gs.player.shieldRegenTimer = 0;
    }

    // Player-enemy collision (damage to player)
    if (!gs.player.invincible && !gs.insideHouse) {
        gs.enemies.forEach(enemy => {
            const distX = gs.player.x - enemy.x;
            const distY = gs.player.y - enemy.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < 0.8) {
                if (gs.player.isBlocking && gs.weapons['Rusty Shield'] && !gs.player.shieldBroken) {
                    const damageToShield = enemy.damage * 20;
                    gs.player.shieldDurability -= damageToShield;

                    if (gs.player.shieldDurability <= 0) {
                        gs.player.shieldDurability = 0;
                        gs.player.shieldBroken = true;
                        gs.player.invincible = true;
                        gs.player.invincibleTimer = 30;
                        gs.player.health -= Math.ceil(enemy.damage / 2);
                        gs.currentDialogue = '💥 Shield broken! -' + Math.ceil(enemy.damage / 2) + ' ❤️';
                        gs.dialogueTimer = 0;
                    } else {
                        gs.player.invincible = true;
                        gs.player.invincibleTimer = 20;
                        gs.currentDialogue = `🛡️ Blocked! (${Math.floor(gs.player.shieldDurability)}%)`;
                        gs.dialogueTimer = 0;
                    }
                } else {
                    gs.player.health -= enemy.damage;
                    gs.player.invincible = true;
                    gs.player.invincibleTimer = INVINCIBILITY_FRAMES;

                    if (distance > 0) {
                        gs.player.velocityX = (distX / distance) * 0.3;
                        gs.player.velocityY = (distY / distance) * 0.3;
                    }

                    gs.currentDialogue = `Ouch! -${enemy.damage} ❤️`;
                    gs.dialogueTimer = 0;
                }

                // Death check
                if (gs.player.health <= 0) {
                    gs.player.health = gs.player.maxHealth;
                    gs.player.x = 40;
                    gs.player.y = 22;
                    gs.currentDialogue = 'You died! Respawning...';
                    gs.money = Math.floor(gs.money * 0.5);
                }
            }
        });
    }
}

// ----------------------------------------
// Perform attack (sword swing)
// ----------------------------------------
export function performAttack(gs) {
    let attackX = gs.player.x;
    let attackY = gs.player.y;
    const attackRange = 1.5;

    switch (gs.player.direction) {
        case 'up': attackY -= attackRange; break;
        case 'down': attackY += attackRange; break;
        case 'left': attackX -= attackRange; break;
        case 'right': attackX += attackRange; break;
    }

    let damage = gs.player.attackDamage;
    if (gs.activeEffects.strength.active) {
        damage = Math.floor(damage * gs.activeEffects.strength.bonus);
    }

    const enemiesToRemove = [];
    gs.enemies.forEach((enemy, index) => {
        const distX = attackX - enemy.x;
        const distY = attackY - enemy.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < 1.5) {
            enemy.health -= damage;

            if (distance > 0) {
                enemy.knockbackX = -(distX / distance) * 0.5;
                enemy.knockbackY = -(distY / distance) * 0.5;
            }

            if (enemy.health <= 0) {
                enemiesToRemove.push(index);
                gs.player.xp += enemy.xpReward;
                gs.money += Math.floor(enemy.xpReward / 3);

                gs.currentDialogue = `+${enemy.xpReward} XP! +${Math.floor(enemy.xpReward / 3)} coins!`;
                gs.dialogueTimer = 0;

                if (gs.player.xp >= gs.player.xpToNextLevel) {
                    gs.player.xp -= gs.player.xpToNextLevel;
                    gs.player.level++;
                    gs.player.xpToNextLevel = Math.floor(gs.player.xpToNextLevel * 1.5);
                    gs.levelUpChoice = true;
                }
            }
        }
    });

    // Remove dead enemies (reverse order)
    for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
        gs.enemies.splice(enemiesToRemove[i], 1);
    }
}

// ----------------------------------------
// Choose level-up reward
// ----------------------------------------
export function chooseLevelUpReward(gs, choice) {
    if (choice === 'heart') {
        gs.player.maxHealth += 4;
        gs.player.health = gs.player.maxHealth;
        gs.currentDialogue = `Level ${gs.player.level}! +1 ❤️ (max health increased)`;
    } else if (choice === 'gems') {
        gs.player.gems += 2;
        gs.currentDialogue = `Level ${gs.player.level}! +2 💎 (gems obtained)`;
    }
    gs.dialogueTimer = 0;
    gs.levelUpChoice = false;
}

// ----------------------------------------
// Consume item (food/potion)
// ----------------------------------------
export function consumeItem(gs, itemName) {
    const isInFood = gs.food[itemName] && gs.food[itemName] > 0;
    const isInInventory = gs.inventory[itemName] && gs.inventory[itemName] > 0;

    if (!isInFood && !isInInventory) return;

    let healthRestore = 0;
    let itemVerb = 'used';
    let isPotionEffect = false;

    // Food
    if (itemName === 'Tomato') { healthRestore = 1; itemVerb = 'ate'; }
    else if (itemName === 'Carrot') { healthRestore = 1; itemVerb = 'ate'; }
    else if (itemName === 'Vegetable Basket') { healthRestore = 2; itemVerb = 'ate'; }
    else if (itemName === 'Fish') { healthRestore = 1; itemVerb = 'ate'; }
    else if (itemName === 'Salmon') { healthRestore = 2; itemVerb = 'ate'; }
    else if (itemName === 'Fish Basket') { healthRestore = 3; itemVerb = 'ate'; }
    // Medical
    else if (itemName === 'Bandage') { healthRestore = 4; itemVerb = 'used'; }
    else if (itemName === 'Medical Kit') { healthRestore = 8; itemVerb = 'used'; }
    // Potions
    else if (itemName === 'Speed Potion') { activatePotion(gs, 'speed'); isPotionEffect = true; itemVerb = 'drank'; }
    else if (itemName === 'Invisibility Potion') { activatePotion(gs, 'invisibility'); isPotionEffect = true; itemVerb = 'drank'; }
    else if (itemName === 'Strength Potion') { activatePotion(gs, 'strength'); isPotionEffect = true; itemVerb = 'drank'; }
    else if (itemName === 'Invincibility Potion') { activatePotion(gs, 'invincibility'); isPotionEffect = true; itemVerb = 'drank'; }

    // Don't consume healing items at full health
    if (healthRestore > 0 && gs.player.health >= gs.player.maxHealth) {
        gs.currentDialogue = 'Your health is already full!';
        gs.dialogueTimer = 0;
        return;
    }

    // Consume from correct category
    if (isInFood) {
        gs.food[itemName]--;
        if (gs.food[itemName] === 0) delete gs.food[itemName];
    } else if (isInInventory) {
        gs.inventory[itemName]--;
        if (gs.inventory[itemName] === 0) delete gs.inventory[itemName];
    }

    if (healthRestore > 0) {
        gs.player.health = Math.min(gs.player.health + healthRestore, gs.player.maxHealth);
        const heartsRestored = healthRestore / 4;
        gs.currentDialogue = `You ${itemVerb} ${itemName}! +${heartsRestored} ❤️`;
        gs.dialogueTimer = 0;
    }
}

// ----------------------------------------
// Activate potion effect
// ----------------------------------------
function activatePotion(gs, potionType) {
    const effect = gs.activeEffects[potionType];

    if (potionType === 'invincibility') {
        effect.active = true;
        effect.hitsRemaining = effect.maxHits;
        gs.currentDialogue = `Invincibility Potion activated! 💫 (${effect.maxHits} hits)`;
    } else {
        effect.active = true;
        effect.duration = effect.maxDuration;

        const messages = {
            speed: 'Speed Potion activated! ⚡ You are faster!',
            invisibility: 'Invisibility Potion activated! 👻 Enemies can\'t see you!',
            strength: 'Strength Potion activated! 💪 Your attacks are stronger!'
        };
        gs.currentDialogue = messages[potionType] || '';
    }
    gs.dialogueTimer = 0;
}

// ----------------------------------------
// Update potion effect timers
// ----------------------------------------
export function updatePotionEffects(gs, dt) {
    for (const [effectName, effect] of Object.entries(gs.activeEffects)) {
        if (effect.active && effect.duration !== undefined) {
            effect.duration -= dt;
            if (effect.duration <= 0) {
                effect.active = false;

                const endMessages = {
                    speed: 'Speed effect wore off.',
                    invisibility: 'You are visible again.',
                    strength: 'Strength effect wore off.'
                };
                const endMessage = endMessages[effectName];
                if (endMessage && !gs.currentDialogue) {
                    gs.currentDialogue = endMessage;
                    gs.dialogueTimer = 0;
                }
            }
        }
    }
}
