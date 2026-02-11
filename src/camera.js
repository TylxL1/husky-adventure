// ========================================
// CAMERA - Smooth follow with dynamic zoom
// ========================================
import {
    CAMERA_SMOOTHING_SLOW, CAMERA_SMOOTHING_FAST,
    VIEWPORT_TILES_X, VIEWPORT_TILES_Y,
    CAMERA_ZOOM_NORMAL, CAMERA_ZOOM_SPEED, CAMERA_ZOOM_SMOOTHING
} from './constants.js';

export function updateCamera(gs) {
    // Dynamic zoom: tighter when walking normally, wider with speed potion
    const speedActive = gs.activeEffects.speed.active;
    const targetZoom = speedActive ? CAMERA_ZOOM_SPEED : CAMERA_ZOOM_NORMAL;
    gs.camera.zoom += (targetZoom - gs.camera.zoom) * CAMERA_ZOOM_SMOOTHING;

    // Dynamic smoothing: tighter follow when walking, looser at high speed
    const smoothing = speedActive ? CAMERA_SMOOTHING_FAST : CAMERA_SMOOTHING_SLOW;

    // Update effective viewport size based on zoom
    gs.viewportTilesX = VIEWPORT_TILES_X / gs.camera.zoom;
    gs.viewportTilesY = VIEWPORT_TILES_Y / gs.camera.zoom;

    const targetX = gs.player.x - gs.viewportTilesX / 2;
    const targetY = gs.player.y - gs.viewportTilesY / 2;

    gs.camera.x += (targetX - gs.camera.x) * smoothing;
    gs.camera.y += (targetY - gs.camera.y) * smoothing;

    gs.camera.x = Math.max(0, Math.min(gs.camera.x, gs.mapWidth - gs.viewportTilesX));
    gs.camera.y = Math.max(0, Math.min(gs.camera.y, gs.mapHeight - gs.viewportTilesY));
}
