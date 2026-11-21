// Tuning constants for Lantern Thief. One place for every number the
// other modules share, so balance tweaks never touch game logic.
export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 640

export const PLAYER_SPEED = 4.4; // tiles per second, walking
export const SNEAK_SPEED = 2.4; // tiles per second, sneaking
export const GUARD_SPEED = 2.1; // tiles per second on patrol
export const CHASE_SPEED = 3.6; // tiles per second when hunting

export const CONE_RANGE = 6.5; // tiles a guard can see
export const CONE_HALF_ANGLE = 0.7; // radians either side of facing (~40 deg)
export const SNEAK_SIGHT_FACTOR = 0.55; // sneaking shrinks effective sight
export const DETECT_RATE = 70; // meter points per second while fully seen
export const DETECT_DRAIN = 26; // meter points per second while unseen
export const SUSPICIOUS_AT = 40; // meter: guard stops and stares
export const ALARM_AT = 100; // meter: guard gives chase
export const CHASE_GIVE_UP = 4.0; // seconds unseen before the hunt ends
export const CATCH_DIST = 0.55; // tiles: guard reaches the player

export const LIVES = 3;
export const LOOT_POINTS = 100;
export const LANTERN_POINTS = 500;
export const GHOST_BONUS = 300; // finish a level never fully spotted
export const TIME_BONUS_PER_SECOND = 5; // under the par time
export const LEVEL_PAR_SECONDS = [75, 100, 130];

export const COLORS = {
  floor: '#1c2138',
  floorAlt: '#191e33',
  wall: '#3d3a55',
  wallTop: '#565273',
  crate: '#6b4f2a',
  crateTop: '#8a6a38',
  exit: '#2fae5f',
  exitGlow: '#7dffb0',
  loot: '#e8c96a',
  lantern: '#ffd94d',
  player: '#e8e4d8',
  playerSneak: '#b9c4a8',
  guard: '#c94f4f',
  guardAlert: '#ff2e2e',
  cone: 'rgba(232, 201, 106, 0.20)',
  coneAlert: 'rgba(255, 46, 46, 0.28)',
  dark: 'rgba(5, 6, 14, 0.55)',
};
