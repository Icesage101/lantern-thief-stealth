// Lantern Thief — the engine. Owns the game state, the loop, input, the
// thief's movement and collisions, loot and the exit, lives and score,
// and the screens between levels. Guards, sight and the detection meter
// live in guards.js; drawing lives in render.js; sound in audio.js.
import { TILE, COLS, ROWS, PLAYER_SPEED, SNEAK_SPEED, LIVES, LOOT_POINTS, LANTERN_POINTS, GHOST_BONUS, TIME_BONUS_PER_SECOND, LEVEL_PAR_SECONDS } from './config.js';
import { LEVELS, parseLevel, solidAt } from './levels.js';
import { makeGuard, updateGuard } from './guards.js';
import { drawWorld, drawHUD, drawOverlay } from './render.js';
import { SoundBank } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sound = new SoundBank();

export const game = {
  state: 'title', // title | intro | play | levelclear | gameover | win
  levelIndex: 0,
  level: null,
  guards: [],
  player: null,
  exitOpen: false,
  score: 0,
  lives: LIVES,
  elapsed: 0,
  levelTime: 0,
  everSpotted: false,
  levelSpotted: false,
  keys: {},
  clickTarget: null,
  stepAcc: 0,
  introUntil: 0,
  message: null,
};

function loadLevel(index) {
  const def = LEVELS[index];
  const level = parseLevel(def);
  game.level = level;
  game.levelIndex = index;
  game.guards = level.spawns.map((spawn, i) => makeGuard(spawn, def.guards[i]));
  game.player = { x: level.player.x, y: level.player.y, angle: 0, sneaking: false };
  game.exitOpen = false;
  game.levelTime = 0;
  game.levelSpotted = false;
  game.clickTarget = null;
}

function startGame() {
  game.score = 0;
  game.lives = LIVES;
  game.elapsed = 0;
  game.everSpotted = false;
  loadLevel(0);
  game.state = 'intro';
  game.introUntil = performance.now() + 2400;
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'win';
    sound.gameWin();
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.state = 'intro';
  game.introUntil = performance.now() + 2400;
}

function restartLevel() {
  game.lives -= 1;
  sound.caught();
  if (game.lives <= 0) {
    game.state = 'gameover';
    return;
  }
  loadLevel(game.levelIndex);
  game.state = 'intro';
  game.introUntil = performance.now() + 1800;
}

// Circle-vs-tile movement: slide along each axis separately so the thief
// glides along walls instead of sticking to them.
function tryMove(dx, dy) {
  const p = game.player;
  const r = 0.32;
  const nx = p.x + dx;
  if (!hitsWall(nx, p.y, r)) p.x = nx;
  const ny = p.y + dy;
  if (!hitsWall(p.x, ny, r)) p.y = ny;
}

function hitsWall(x, y, r) {
  for (const [tx, ty] of [[Math.floor(x - r), Math.floor(y - r)], [Math.floor(x + r), Math.floor(y - r)], [Math.floor(x - r), Math.floor(y + r)], [Math.floor(x + r), Math.floor(y + r)]]) {
    if (solidAt(game.level, tx, ty)) return true;
  }
  return false;
}

function updatePlayer(dt) {
  const p = game.player;
  const k = game.keys;
  let mx = 0;
  let my = 0;
  if (k['arrowleft'] || k['a']) mx -= 1;
  if (k['arrowright'] || k['d']) mx += 1;
  if (k['arrowup'] || k['w']) my -= 1;
  if (k['arrowdown'] || k['s']) my += 1;
  if (mx === 0 && my === 0 && game.clickTarget) {
    const dx = game.clickTarget.x - p.x;
    const dy = game.clickTarget.y - p.y;
    if (Math.hypot(dx, dy) < 0.15) game.clickTarget = null;
    else {
      mx = dx / Math.hypot(dx, dy);
      my = dy / Math.hypot(dx, dy);
    }
  }
  p.sneaking = !!(k['shift']);
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const speed = (p.sneaking ? SNEAK_SPEED : PLAYER_SPEED) * dt;
    const nx = (mx / len) * speed;
    const ny = (my / len) * speed;
    p.angle = Math.atan2(ny, nx);
    tryMove(nx, ny);
    // Footsteps: soft ticks, slower and quieter while sneaking.
    game.stepAcc += dt * (p.sneaking ? 2.0 : 3.6);
    if (game.stepAcc > 1) {
      game.stepAcc = 0;
      sound.step(p.sneaking);
    }
  }

  // Loot: walk over a gem or the lantern to take it.
  for (const item of game.level.loot) {
    if (!item.taken && Math.hypot(item.x - p.x, item.y - p.y) < 0.55) {
      item.taken = true;
      if (item.kind === 'lantern') {
        game.score += LANTERN_POINTS;
        sound.lantern();
      } else {
        game.score += LOOT_POINTS;
        sound.pickup();
      }
    }
  }
  const allTaken = game.level.loot.every((l) => l.taken);
  if (allTaken && !game.exitOpen) {
    game.exitOpen = true;
    game.message = 'The way out is open — go!';
  }
  if (game.exitOpen && Math.hypot(game.level.exit.x - p.x, game.level.exit.y - p.y) < 0.6) {
    const par = LEVEL_PAR_SECONDS[game.levelIndex];
    const timeBonus = Math.max(0, Math.floor(par - game.levelTime)) * TIME_BONUS_PER_SECOND;
    game.score += timeBonus;
    if (!game.levelSpotted) game.score += GHOST_BONUS;
    sound.levelClear();
    game.state = 'levelclear';
    game.levelClearBonus = timeBonus;
  }
}

function update(dt) {
  if (game.state === 'intro' && performance.now() > game.introUntil) game.state = 'play';
  if (game.state !== 'play') return;
  game.elapsed += dt;
  game.levelTime += dt;
  updatePlayer(dt);
  if (game.state !== 'play') return; // reaching the exit ends the level
  for (const guard of game.guards) {
    const events = updateGuard(game.level, guard, game.player, game.player.sneaking, dt, sound);
    for (const ev of events) {
      if (ev === 'suspicious') sound.suspicious();
      if (ev === 'alarm') {
        sound.alarm();
        game.levelSpotted = true;
        game.everSpotted = true;
      }
      if (ev === 'caught') {
        restartLevel();
        return;
      }
    }
  }
}

function render() {
  ctx.clearRect(0, 0, 960, 640);
  if (game.state === 'title') {
    drawWorld(ctx, game);
    drawOverlay(ctx, 'LANTERN THIEF', [
      'A top-down stealth game in three museum wings.',
      'Lift every gem — and the Star Lantern — then slip out unseen.',
      'Guards watch cones of light. Crates block their sight.',
      'Hold Shift to sneak. Seen too long, and the hunt begins.',
    ], 'Click or press Enter to begin  ·  WASD / arrows to move');
    return;
  }
  drawWorld(ctx, game);
  drawHUD(ctx, game);
  if (game.state === 'intro') {
    drawOverlay(ctx, game.level.name, [game.level.intro], game.message || '');
  } else if (game.state === 'levelclear') {
    const ghost = !game.levelSpotted ? `Ghost bonus +${GHOST_BONUS} — never spotted!` : 'Spotted this wing — no ghost bonus.';
    drawOverlay(ctx, 'CLEAN GETAWAY', [
      `${game.level.name} cleared.`,
      `Time bonus +${game.levelClearBonus}. ${ghost}`,
      `Score: ${game.score}`,
    ], 'Press Enter for the next wing');
  } else if (game.state === 'gameover') {
    drawOverlay(ctx, 'CAUGHT', [
      'The museum keepers found you in the dark.',
      `Final score: ${game.score}`,
    ], 'Press Enter to try again');
  } else if (game.state === 'win') {
    drawOverlay(ctx, 'THE STAR LANTERN IS YOURS', [
      'Three wings, every gem, one clean shadow.',
      game.everSpotted ? 'You were spotted along the way — but never caught.' : 'A perfect ghost run. No guard ever raised the alarm.',
      `Final score: ${game.score}`,
    ], 'Press Enter to play again');
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  sound.ensure();
  const key = e.key.toLowerCase();
  game.keys[key] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
  if (key === 'm') sound.toggleMute();
  if (key === 'r' && game.state === 'play') restartLevel();
  if (key === 'enter') {
    if (game.state === 'title') startGame();
    else if (game.state === 'levelclear') nextLevel();
    else if (game.state === 'gameover' || game.state === 'win') startGame();
  }
});
window.addEventListener('keyup', (e) => {
  game.keys[e.key.toLowerCase()] = false;
});
canvas.addEventListener('mousedown', (e) => {
  sound.ensure();
  if (game.state === 'title') { startGame(); return; }
  if (game.state === 'levelclear') { nextLevel(); return; }
  if (game.state === 'gameover' || game.state === 'win') { startGame(); return; }
  if (game.state !== 'play') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * COLS;
  const y = ((e.clientY - rect.top) / rect.height) * ROWS;
  if (!solidAt(game.level, Math.floor(x), Math.floor(y))) game.clickTarget = { x, y };
});

// Boot on the title screen over level one, so the first paint already
// shows the museum, its guards and their cones.
loadLevel(0);
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) applyShot(game, shot, { startGame, nextLevel, loadLevel });
requestAnimationFrame(frame);
