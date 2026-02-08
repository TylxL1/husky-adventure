// ========================================
// CAMERA - Smooth follow
// ========================================
import { CAMERA_SMOOTHING, VIEWPORT_TILES_X, VIEWPORT_TILES_Y } from './constants.js';

export function updateCamera(gs) {
    const targetX = gs.player.x - VIEWPORT_TILES_X / 2;
    const targetY = gs.player.y - VIEWPORT_TILES_Y / 2;

    gs.camera.x += (targetX - gs.camera.x) * CAMERA_SMOOTHING;
    gs.camera.y += (targetY - gs.camera.y) * CAMERA_SMOOTHING;

    gs.camera.x = Math.max(0, Math.min(gs.camera.x, gs.mapWidth - VIEWPORT_TILES_X));
    gs.camera.y = Math.max(0, Math.min(gs.camera.y, gs.mapHeight - VIEWPORT_TILES_Y));
}
