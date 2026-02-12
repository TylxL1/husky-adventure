# Husky Adventure

## How to Play

ES6 modules require a local web server (file:// won't work due to CORS). Use one of these methods:

```bash
# Python
cd husky-donjon-game
python -m http.server 8000
# Then open http://localhost:8000

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension, right-click index.html -> "Open with Live Server"
```

## Controls

| Key | Action |
|-----|--------|
| **Z** | Move up |
| **Q** | Move left |
| **S** | Move down |
| **D** | Move right |
| **Space** | Jump |
| **E** | Interact (talk, enter houses, shop, open chest, travel) |
| **F** | Attack with sword (requires Rusty Sword) |
| **R** | Block with shield (hold, requires Rusty Shield) |
| **TAB** | Open/close inventory |
| **M** | Show/hide full map |
| **P** | Show/hide controls help |
| **1-9** | Buy items in shop / use items from inventory |

## Features

- **Procedurally generated island** with organic borders, paths, fields, and a central plaza
- **11 unique buildings** to explore (player's house, farmer, fisher, merchant, elder, doctor, blacksmith, church, 3 villager houses)
- **5 shops** with different inventories (weapons, food, fish, medical supplies, potions)
- **Combat system** with sword attacks, shield blocking (with durability), knockback, and invincibility frames
- **Enemies** (slimes and goblins) with aggro AI and treasure chest guards
- **Potion effects** (speed, invisibility, strength, invincibility)
- **XP and leveling** with reward choices (+1 heart or +2 gems)
- **Island travel** between main island and desert island via boats
- **Intro story** with the Elder NPC and a treasure key quest
- **Pixel art HUD** with hearts, level display, and active effect indicators
- **Full minimap** with color-coded legend

## Project Structure

```
husky-donjon-game/
  index.html           Entry point (ES6 module loader)
  style.css            Minimal styling
  README.md            This file
  src/
    constants.js       Tile IDs, config, physics constants
    player.js          Movement, physics, collision, animation
    map.js             Island generation, paths, fields, plaza
    house.js           11 house interiors, enter/exit, interactions
    npc.js             NPC creation, AI, dialogues, drawing
    enemy.js           Enemy creation, AI, drawing
    combat.js          Attack, damage, potions, XP, leveling
    camera.js          Smooth camera follow
    renderer.js        Tile renderer registry + entity drawing
    ui.js              HUD, inventory, shop, help, minimap
    input.js           Keyboard controls
    island.js          Island travel system
    game.js            Main orchestrator with deltaTime loop
```

## Technologies

- **HTML5 Canvas 2D** for pixel art rendering
- **ES6 Modules** for modular code architecture
- **DeltaTime game loop** for frame-rate independent gameplay
