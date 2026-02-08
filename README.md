# Husky Zelda Game

Un jeu d'aventure style Zelda à l'ancienne avec vue du dessus et esthétique pixel art améliorée.

## Comment lancer le jeu

1. Ouvrez le fichier `index.html` dans votre navigateur web (Chrome, Firefox, Safari, etc.)
2. Le jeu démarre automatiquement

## Contrôles

- **Z** : Avancer (haut)
- **Q** : Aller à gauche
- **S** : Reculer (bas)
- **D** : Aller à droite
- **Espace** : Sauter
- **M** : Afficher/masquer la carte complète
- **E** : Interagir (entrer dans les maisons, voyager en bateau)

## Ce qui est déjà implémenté

### Version 3.7 - Intérieur des Maisons ✅
- **Système d'entrée dans les maisons** : Approchez-vous d'une porte et appuyez sur E
- **6 maisons visitables** :
  - **Votre maison** : Lit, coffre, table (pas de PNJ)
  - **Maison du fermier** : Lit, table, outils + PNJ fermier
  - **Maison du pêcheur** : Lit, table, cannes à pêche + PNJ pêcheur
  - **Maison du marchand** : Comptoir, coffres, marchandises + PNJ marchand
  - **Maison de l'ancien** : Lit, bibliothèque, table + PNJ ancien
  - **Maison du villageois** : Lit, table, chaise, coffre + PNJ villageois
- **Décoration unique** : Chaque maison a sa propre décoration personnalisée
- **PNJ à l'intérieur** : Les habitants sont dans leur maison (statiques pour l'instant)
- **Système de sauvegarde** : L'extérieur est sauvegardé quand vous entrez
- **Indicateurs visuels** : Messages contextuels pour entrer/sortir

### Version 3.6 - Voyage entre Îles ✅
- **Système de voyage entre îles** : Approchez-vous d'un bateau et appuyez sur E
- **Île désertique** : Nouvelle zone explorable avec environnement désertique
  - Terrain de sable
  - Rochers et cactus disséminés
  - Bateau pour le retour vers l'île principale
- **Sauvegarde d'état** : L'île principale est sauvegardée quand vous voyagez
- **Indicateur visuel** : Message d'interaction affiché quand vous êtes près d'un bateau

### Version 3.5 - PNJ, Port et Bateaux ✅
- **FAUSSE 3D** implémentée! Ombres portées, effets de profondeur, perspectives
- Système de déplacement avec **vraie physique** (momentum, inertie, friction naturelle)
- Système de saut avec gravité et ombre dynamique
- Personnage joueur (husky stylisé pixel art avec reflets dans les yeux)
- **Barre de vie** avec 3 cœurs style Zelda (ombres et highlights)
- **Mini-map** accessible avec la touche M (point joueur réduit)
- **9 PNJ villageois** animés qui se déplacent sur l'île :
  - Fermiers (chapeau marron, vêtements marron)
  - Pêcheurs (chapeau jaune, vêtements bleus)
  - Marchands (chapeau violet, vêtements rouges)
  - Anciens (chapeau gris, vêtements gris-vert)
  - Villageois (chapeau marron, vêtements vert)
  - Mouvement aléatoire et animations de marche
- **Port avec docks en bois** :
  - Planches de bois avec clous et ombres 3D
  - Quais d'amarrage verticaux
  - Chemin connecté depuis le spawn
- **3 bateaux de pêche amarrés** :
  - Effet de balancement sur l'eau
  - Coques avec effet 3D (face claire/sombre)
  - Bancs intérieurs et cordes d'amarrage
  - Ombres portées sur l'eau

### Map et Environnement avec Fausse 3D ✅
- Carte 70x50 tuiles
- Map avec bordures organiques (forme non-carrée)
- 6 maisons 3x3 mieux dispersées sur la map
- Chemins de 2 tuiles reliant les maisons
- Différents types de terrain avec **effets 3D** :
  - **Herbe** : 4 variations de couleur avec brins d'herbe détaillés
  - **Chemins** : Texture sable avec bordures et cailloux variés
  - **Arbres** : Feuillage en 3 couches, tronc avec face claire, **ombres au sol**
  - **Eau** : Animation de vagues avec reflets animés
  - **Maisons** : Cottages 3x3 avec toit en tuiles, cheminée, fenêtres avec reflets, porte en bois, **ombres sous les structures**
  - **Fleurs** : 3 couleurs, pétales détaillés, **ombres au sol**
  - **Rochers** : Face sombre/claire, highlights, **ombres portées** - reconnaissables!
  - **Docks en bois** : Planches avec clous, lignes de séparation, **ombres sur l'eau**
- Tous les objets ont des ombres pour créer l'effet de profondeur
- Génération procédurale optimisée

### Système de caméra ✅
- Suit le joueur avec interpolation douce
- Limitée aux bords de la map
- Vue centrée sur le personnage

## Structure du projet

```
husky-donjon-game/
├── index.html          # Page principale
├── style.css           # Styles minimalistes
├── game_zelda.js       # Logique du jeu style Zelda
├── game.js             # Ancienne version 3D (conservée)
├── game2d.js           # Ancienne version 2D combat (conservée)
└── README.md           # Ce fichier
```

## Technologies utilisées

- **HTML5 Canvas 2D** : Rendu graphique pixel art
- **JavaScript ES6** : Logique du jeu
- **CSS3** : Interface minimale

## Prochaines étapes

- [ ] Système de combat (épée)
- [ ] Ennemis avec IA
- [ ] Système de vie/santé
- [ ] Collectibles (coeurs, rubis)
- [ ] Dialogues avec PNJ
- [ ] Histoire guidée
- [ ] Donjons et puzzles
- [ ] Boss
- [ ] Objets et inventaire
- [ ] Musique et effets sonores

## Notes de développement

Le jeu utilise un système de tuiles de 32x32 pixels. La map est générée procéduralement au lancement avec des chemins, des arbres aléatoires, et plusieurs maisons.

Le personnage joueur est représenté par un sprite pixel art simple d'un husky jaune et blanc.
